require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { sql, poolPromise } = require("./dbconfig");
const { JWT_SECRET, authenticateAdmin, checkAdminCredentials } = require("./adminAuth");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5050;

app.use(cors());
app.use(express.json());

// ------------------ LOAD QUESTIONS ------------------
const questionsDir = path.join(__dirname, "questions");
const allQuestions = {
  level1: JSON.parse(fs.readFileSync(path.join(questionsDir, "level1.json"), "utf8")),
  level2: JSON.parse(fs.readFileSync(path.join(questionsDir, "level2.json"), "utf8")),
  level3: JSON.parse(fs.readFileSync(path.join(questionsDir, "level3.json"), "utf8")),
};

// ------------------ LOAD RULES ------------------
const rulesFile = path.join(__dirname, "rules", "rules.json");
let rules = [];
try {
  rules = JSON.parse(fs.readFileSync(rulesFile, "utf8"));
} catch (err) {
  console.error("Failed to load rules:", err);
}

// ------------------ HEALTH CHECK ------------------
app.get("/ping", (req, res) => res.send("pong"));

// ------------------ LOGIN ------------------
app.post("/api/login", async (req, res) => {
  const { studentName, collegeName } = req.body;
  if (!studentName || !collegeName) return res.status(400).json({ error: "Missing fields" });

  try {
    const pool = await poolPromise;
    if (!pool) return res.status(500).json({ error: "Database connection unavailable" });

    // Insert student into QuizApp.Students
    const result = await pool.request()
      .input('StudentName', sql.NVarChar, studentName)
      .input('CollegeName', sql.NVarChar, collegeName)
      .query(`
        INSERT INTO QuizApp.Students (StudentName, CollegeName)
        OUTPUT INSERTED.StudentID
        VALUES (@StudentName, @CollegeName)
      `);
    const studentID = result.recordset[0].StudentID;
    res.json({ studentID, currentLevel: 1 });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Database error during login" });
  }
});

// ------------------ GET QUESTIONS ------------------
app.get("/api/questions", (req, res) => {
  res.json(allQuestions);
});

// ------------------ SUBMIT SCORE ------------------
app.post("/api/submit-score", async (req, res) => {
  const { studentID, level, score, timeTaken, totalQuestions } = req.body;
  if (!studentID || !level || score === undefined || timeTaken === undefined || totalQuestions === undefined) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const pool = await poolPromise;
    const existing = await pool.request()
      .input('StudentID', sql.Int, studentID)
      .input('Level', sql.Int, level)
      .query(`SELECT * FROM QuizApp.Scores WHERE StudentID = @StudentID AND Level = @Level`);

    if (existing.recordset.length > 0) {
      await pool.request()
        .input('StudentID', sql.Int, studentID)
        .input('Level', sql.Int, level)
        .input('Score', sql.Int, score)
        .input('TimeTaken', sql.Int, timeTaken)
        .input('TotalQuestions', sql.Int, totalQuestions)
        .query(`UPDATE QuizApp.Scores SET Score=@Score, TimeTaken=@TimeTaken, TotalQuestions=@TotalQuestions WHERE StudentID=@StudentID AND Level=@Level`);
    } else {
      await pool.request()
        .input('StudentID', sql.Int, studentID)
        .input('Level', sql.Int, level)
        .input('Score', sql.Int, score)
        .input('TimeTaken', sql.Int, timeTaken)
        .input('TotalQuestions', sql.Int, totalQuestions)
        .query(`INSERT INTO QuizApp.Scores (StudentID, Level, Score, TimeTaken, TotalQuestions) VALUES (@StudentID,@Level,@Score,@TimeTaken,@TotalQuestions)`);
    }

    // Clear progress after submission
    await pool.request()
      .input('StudentID', sql.Int, studentID)
      .input('Level', sql.Int, level)
      .query(`DELETE FROM QuizApp.UserProgress WHERE StudentID=@StudentID AND Level=@Level`);

    res.json({ message: "Score saved" });
  } catch (err) {
    console.error("Submit score error:", err);
    res.status(500).json({ error: "Database error during score submission" });
  }
});

// ------------------ PLAYER SCORE ------------------
app.get("/api/player-score/:studentID/:level", async (req, res) => {
  const { studentID, level } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('StudentID', sql.Int, studentID)
      .input('Level', sql.Int, level)
      .query(`SELECT Score, TimeTaken, TotalQuestions FROM QuizApp.Scores WHERE StudentID=@StudentID AND Level=@Level`);
    if (result.recordset.length === 0) return res.status(404).json({ error: "Score not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Get player score error:", err);
    res.status(500).json({ error: "Database error while fetching score" });
  }
});

// ------------------ LEADERBOARD ------------------
app.get("/api/leaderboard/:level", async (req, res) => {
  const { level } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Level', sql.Int, level)
      .query(`
        SELECT s.StudentID as id, st.StudentName as name, st.CollegeName as college, 
               s.Score as score, s.TotalQuestions as total, s.TimeTaken as timeTaken
        FROM QuizApp.Scores s
        INNER JOIN QuizApp.Students st ON s.StudentID = st.StudentID
        WHERE s.Level=@Level
        ORDER BY s.Score DESC, s.TimeTaken ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Database error while fetching leaderboard" });
  }
});

// ------------------ CHECK ELIGIBILITY ------------------
app.get("/api/check-eligibility", async (req, res) => {
  const { studentID, level } = req.query;
  if (!studentID || !level) return res.json({ eligible: false });

  try {
    const pool = await poolPromise;
    if (level == 3) {
      const result = await pool.request()
        .input('StudentID', sql.Int, studentID)
        .query(`SELECT Score FROM QuizApp.Scores WHERE StudentID=@StudentID AND Level=2`);
      const scoreLevel2 = result.recordset[0]?.Score || 0;
      return res.json({ eligible: scoreLevel2 >= 6 });
    }
    res.json({ eligible: true });
  } catch (err) {
    console.error("Eligibility error:", err);
    res.json({ eligible: false });
  }
});

// ------------------ GET RULES ------------------
app.get("/api/rules", (req, res) => res.json({ rules }));

// ------------------ USER PROGRESS ------------------

// Save/update progress
app.post("/api/progress", async (req, res) => {
  const { studentID, level, currentIndex, selectedAnswers, remainingTime } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('StudentID', sql.Int, studentID)
      .input('Level', sql.Int, level)
      .input('CurrentIndex', sql.Int, currentIndex)
      .input('SelectedAnswers', sql.NVarChar, JSON.stringify(selectedAnswers))
      .input('RemainingTime', sql.Int, remainingTime)
      .query(`
        IF EXISTS (SELECT 1 FROM QuizApp.UserProgress WHERE StudentID=@StudentID AND Level=@Level)
          UPDATE QuizApp.UserProgress
          SET CurrentIndex=@CurrentIndex,
              SelectedAnswers=@SelectedAnswers,
              RemainingTime=@RemainingTime,
              LastUpdated=GETDATE()
          WHERE StudentID=@StudentID AND Level=@Level
        ELSE
          INSERT INTO QuizApp.UserProgress (StudentID, Level, CurrentIndex, SelectedAnswers, RemainingTime)
          VALUES (@StudentID, @Level, @CurrentIndex, @SelectedAnswers, @RemainingTime)
      `);
    res.json({ success: true });
  } catch (err) {
    console.error("Save progress error:", err);
    res.status(500).json({ error: "Failed to save progress" });
  }
});

// Fetch progress
app.get("/api/progress/:studentID/:level", async (req, res) => {
  const { studentID, level } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('StudentID', sql.Int, studentID)
      .input('Level', sql.Int, level)
      .query(`SELECT * FROM QuizApp.UserProgress WHERE StudentID=@StudentID AND Level=@Level`);
    res.json(result.recordset[0] || null);
  } catch (err) {
    console.error("Fetch progress error:", err);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

// Delete progress (after submission)
app.delete("/api/progress/:studentID/:level", async (req, res) => {
  const { studentID, level } = req.params;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('StudentID', sql.Int, studentID)
      .input('Level', sql.Int, level)
      .query(`DELETE FROM QuizApp.UserProgress WHERE StudentID=@StudentID AND Level=@Level`);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete progress error:", err);
    res.status(500).json({ error: "Failed to delete progress" });
  }
});

// ------------------ ADMIN AUTH ------------------
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const valid = await checkAdminCredentials(username, password, poolPromise, sql);
    if (valid) {
      const token = jwt.sign({ username, role: "admin" }, JWT_SECRET, { expiresIn: "2h" });
      return res.json({ token });
    }
    return res.status(401).json({ error: "Invalid admin credentials" });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ error: "Server error during admin login" });
  }
});

app.post("/api/admin/reset", authenticateAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().query("TRUNCATE TABLE QuizApp.Scores");
    res.json({ message: "All leaderboard scores have been reset." });
  } catch (err) {
    console.error("Admin reset error:", err);
    res.status(500).json({ error: "Failed to reset leaderboard scores." });
  }
});

// ------------------ START SERVER ------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

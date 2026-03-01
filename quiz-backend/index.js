const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { sql, poolPromise } = require('./dbconfig');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 5000;

// ----------------------
// 1. Login / Register
// ----------------------
app.post('/api/login', async (req, res) => {
    const { studentName, collegeName } = req.body;
    if (!studentName || !collegeName) return res.status(400).send('Missing fields');

    try {
        const pool = await poolPromise;

        // Check if student exists
        const result = await pool.request()
            .input('StudentName', sql.NVarChar, studentName)
            .input('CollegeName', sql.NVarChar, collegeName)
            .query(`
                SELECT StudentID, CurrentLevel 
                FROM QuizApp.Students
                WHERE StudentName=@StudentName AND CollegeName=@CollegeName
            `);

        if (result.recordset.length > 0) {
            return res.json({
                studentID: result.recordset[0].StudentID,
                currentLevel: result.recordset[0].CurrentLevel
            });
        } else {
            // Insert new student
            const insert = await pool.request()
                .input('StudentName', sql.NVarChar, studentName)
                .input('CollegeName', sql.NVarChar, collegeName)
                .query(`
                    INSERT INTO QuizApp.Students (StudentName, CollegeName, CurrentLevel)
                    OUTPUT INSERTED.StudentID, INSERTED.CurrentLevel
                    VALUES (@StudentName, @CollegeName, 1)
                `);

            return res.json({
                studentID: insert.recordset[0].StudentID,
                currentLevel: insert.recordset[0].CurrentLevel
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// ----------------------
// 2. Submit Score
// ----------------------
app.post('/api/submit-score', async (req, res) => {
    const { studentID, level, score, timeTaken, totalQuestions } = req.body;
    if (!studentID || !level || score === undefined || timeTaken === undefined || !totalQuestions) {
        return res.status(400).send('Missing fields');
    }

    try {
        const pool = await poolPromise;

        // Upsert score
        await pool.request()
            .input('StudentID', sql.Int, studentID)
            .input('Level', sql.Int, level)
            .input('Score', sql.Int, score)
            .input('TimeTaken', sql.Int, timeTaken)
            .input('TotalQuestions', sql.Int, totalQuestions)
            .query(`
                IF EXISTS (SELECT 1 FROM QuizApp.Scores WHERE StudentID=@StudentID AND Level=@Level)
                    UPDATE QuizApp.Scores 
                    SET Score=@Score, TimeTaken=@TimeTaken, TotalQuestions=@TotalQuestions
                    WHERE StudentID=@StudentID AND Level=@Level
                ELSE
                    INSERT INTO QuizApp.Scores (StudentID, Level, Score, TimeTaken, TotalQuestions)
                    VALUES (@StudentID, @Level, @Score, @TimeTaken, @TotalQuestions)
            `);

        // Update CurrentLevel if score qualifies
        let minScoreToUnlock = 0;
        if (level === 1) minScoreToUnlock = 4;
        if (level === 2) minScoreToUnlock = 6;

        if (score >= minScoreToUnlock) {
            await pool.request()
                .input('StudentID', sql.Int, studentID)
                .input('NextLevel', sql.Int, level + 1)
                .input('CurrentLevel', sql.Int, level)
                .query(`
                    UPDATE QuizApp.Students 
                    SET CurrentLevel=@NextLevel 
                    WHERE StudentID=@StudentID AND CurrentLevel=@CurrentLevel
                `);
        }

        // Clear progress after submission
        await pool.request()
            .input('StudentID', sql.Int, studentID)
            .input('Level', sql.Int, level)
            .query(`DELETE FROM QuizApp.UserProgress WHERE StudentID=@StudentID AND Level=@Level`);

        res.json({ message: 'Score submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// ----------------------
// 3. Leaderboard
// ----------------------
app.get('/api/leaderboard/:level', async (req, res) => {
    const level = parseInt(req.params.level);
    if (![1,2,3].includes(level)) return res.status(400).send('Invalid level');

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Level', sql.Int, level)
            .query(`
                SELECT s.StudentID, st.StudentName, st.CollegeName, s.Score, s.TotalQuestions, s.TimeTaken
                FROM QuizApp.Scores s
                JOIN QuizApp.Students st ON s.StudentID = st.StudentID
                WHERE s.Level=@Level
                ORDER BY s.Score DESC, s.TimeTaken ASC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// ----------------------
// 4. Questions
// ----------------------
app.get('/api/questions', (req, res) => {
    try {
        const level1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions', 'level1.json')));
        const level2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions', 'level2.json')));
        const level3 = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions', 'level3.json')));
        res.json({ level1, level2, level3 });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to load questions');
    }
});

// ----------------------
// 5. Rules
// ----------------------
app.get('/api/rules', (req, res) => {
    try {
        const rules = JSON.parse(fs.readFileSync(path.join(__dirname, 'rules', 'rules.json')));
        res.json(rules);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to load rules');
    }
});

// ----------------------
// 6. Check Eligibility
// ----------------------
app.get('/api/check-eligibility', async (req, res) => {
    const studentID = parseInt(req.query.studentID);
    const level = parseInt(req.query.level);
    if (!studentID || !level) return res.status(400).send('Missing parameters');

    try {
        const pool = await poolPromise;
        if (level === 3) {
            const result = await pool.request()
                .input('StudentID', sql.Int, studentID)
                .query(`SELECT Score FROM QuizApp.Scores WHERE StudentID=@StudentID AND Level=2`);
            const scoreLevel2 = result.recordset[0]?.Score || 0;
            return res.json({ eligible: scoreLevel2 >= 6 });
        }
        return res.json({ eligible: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// ----------------------
// 7. User Progress
// ----------------------

// Save/update progress
app.post('/api/progress', async (req, res) => {
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
        console.error(err);
        res.status(500).send('Failed to save progress');
    }
});

// Fetch progress
app.get('/api/progress/:studentID/:level', async (req, res) => {
    const { studentID, level } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('StudentID', sql.Int, studentID)
            .input('Level', sql.Int, level)
            .query(`SELECT * FROM QuizApp.UserProgress WHERE StudentID=@StudentID AND Level=@Level`);
        res.json(result.recordset[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to fetch progress');
    }
});

// Delete progress (after submission)
app.delete('/api/progress/:studentID/:level', async (req, res) => {
    const { studentID, level } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('StudentID', sql.Int, studentID)
            .input('Level', sql.Int, level)
            .query(`DELETE FROM QuizApp.UserProgress WHERE StudentID=@StudentID AND Level=@Level`);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to delete progress');
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

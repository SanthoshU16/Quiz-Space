// Helper to safely render primitive values only, fallback to string for objects
const safeRender = (val) => {
  if (val === null || val === undefined) return "-";
  if (typeof val === "object") {
    if (typeof val.score === "number" || typeof val.score === "string") return val.score;
    try {
      return JSON.stringify(val);
    } catch {
      return "[object]";
    }
  }
  return val;
};

// src/pages/Lvls_Zp8rX4vN9tQ2sL7yB5jM3hR6kW.jsx
import React, { useEffect, useState } from "react";
import { useScore } from "../ScoreContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getPlayerScore } from "../api";

function Lvls_Zp8rX4vN9tQ2sL7yB5jM3hR6kW() {
  const navigate = useNavigate();
  const location = useLocation();
  const { levelScores, setLevelScores } = useScore();
  const [loading, setLoading] = useState(true);

  const studentID = location.state?.studentID || localStorage.getItem("studentID");
  const studentName = location.state?.name || localStorage.getItem("studentName") || "Player";
  const collegeName = location.state?.college || localStorage.getItem("collegeName") || "College";

  useEffect(() => {
    if (!studentID) {
      alert("Player info missing. Please log in again.");
      navigate("/");
    }
  }, [studentID, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const levels = [
    { id: 1, title: "Level-1", difficulty: "Beginner", time: "5 min", questions: 8, qualification: 4, desc: "Introduction to basics.", img: "level1.jpeg" },
    { id: 2, title: "Level-2", difficulty: "Intermediate", time: "5 min", questions: 8, qualification: 6, desc: "Intermediate challenges with more complexity.", img: "level2.jpeg" },
    { id: 3, title: "Level-3", difficulty: "Advanced", time: "5 min", questions: 8, qualification: "Top 3", desc: "Advanced challenges with maximum difficulty.", img: "level3.jpeg" },
  ];

  useEffect(() => {
    let mounted = true;
    if (!studentID) {
      navigate("/login");
      return;
    }
    setLoading(true);
    const fetchScores = async () => {
      try {
        const scores = {};
        for (let level of levels) {
          try {
            const playerScore = await getPlayerScore(studentID, level.id);
            if (playerScore && typeof playerScore.Score === "number") {
              scores[level.id] = {
                score: playerScore.Score,
                played: true,
                qualified:
                  (level.id === 1 && playerScore.Score >= 4) ||
                  (level.id === 2 && playerScore.Score >= 6) ||
                  (level.id === 3 && playerScore.Score >= 6),
              };
            } else {
              scores[level.id] = null;
            }
          } catch (err) {
            scores[level.id] = null;
          }
        }
        if (mounted) setLevelScores(scores);
      } catch (err) {
        if (mounted) console.error("[DEBUG] Failed to fetch player scores:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchScores();
    return () => { mounted = false; };
  }, [studentID, setLevelScores]);

  // 🔑 Sequential locking system
  const isLocked = (level) => {
    if (level.id === 1) {
      return levelScores[1]?.qualified === true;
    }
    if (level.id === 2) {
      if (!(levelScores[1]?.qualified)) return true;
      if (levelScores[2]?.qualified) return true;
      return false;
    }
    if (level.id === 3) {
      return !(levelScores[2]?.qualified);
    }
    return true;
  };

  // 🔹 Map level IDs to new 30-character obfuscated routes
  const levelRoutes = {
    1: "/L1_a9f3k8bR2mT6xV1zQ4pB7yX9sL0",
    2: "/L2_X7n5vQ1pK8tL3mY2wE6fR9zB4cH1",
    3: "/L3_P2r9mL6kB4yT8qF3zV1xN7sD5uJ0",
  };

  const handleStart = (level) => {
    if (isLocked(level)) return;
    navigate(levelRoutes[level.id], { state: { studentID, name: studentName, college: collegeName, level: level.id } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-tr from-pink-400 via-sky-400 to-purple-600 p-6 font-sans">
      <h1 className="text-5xl font-extrabold mb-12 tracking-wide drop-shadow-lg text-white">
        {"Choose Your Level".split("").map((char, i) => (
          <span
            key={i}
            className="inline-block animate-letterGlow"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {char}
          </span>
        ))}
      </h1>

      {loading || !levelScores ? (
        <div className="text-2xl text-white font-bold mt-12 animate-pulse">Loading levels...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full justify-items-center">
          {levels.map((level) => {
            const locked = isLocked(level);
            const playerScore = levelScores[level.id];
            let qualificationText = "";
            if (locked && level.id > 1 && levels[level.id - 2]) {
              qualificationText = `Requires Level ${level.id - 1} score ≥ ${levels[level.id - 2].qualification}`;
            }
            return (
              <div
                key={level.id}
                className={`relative w-80 h-[650px] p-6 rounded-3xl flex flex-col items-center justify-between transition-all duration-500 transform ${
                  locked
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105 hover:animate-cardGlow hover:shadow-[0_0_80px_rgba(255,255,255,0.6)]"
                }`}
                style={{
                  background: "linear-gradient(145deg, #ec4899, #38bdf8, #6b7280, #9333ea)",
                  boxShadow: "0 15px 40px rgba(255,255,255,0.2)",
                }}
                title={qualificationText}
              >
                {locked && (
                  <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center text-white text-4xl font-bold z-10">
                    🔒
                  </div>
                )}
                <h2 className="text-3xl font-extrabold mb-4 text-white">{level.title}</h2>
                <div
                  className={`w-48 h-48 rounded-xl overflow-hidden shadow-2xl mb-4 transition-transform duration-300 transform ${
                    !locked ? "hover:scale-110 hover:shadow-[0_0_60px_rgba(255,255,255,0.8)]" : ""
                  } z-20`}
                >
                  <img src={level.img} alt={level.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-center text-white font-semibold mb-3 z-20">{level.desc}</p>
                <div className="bg-black/30 p-4 rounded-xl w-full text-white text-sm shadow-inner mb-4 z-20 transition-transform duration-300 transform hover:scale-105">
                  <p>Difficulty: {level.difficulty}</p>
                  <p>Time Limit: {level.time}</p>
                  <p>Questions: {level.questions}</p>
                  <p>Qualification: {level.id === 3 ? "Top 3" : `${level.qualification} correct`}</p>
                  {!locked && playerScore !== null && playerScore !== undefined && <p>Your Score: {safeRender(playerScore)}</p>}
                  {!locked && (playerScore === null || playerScore === undefined) && <p>Not played yet</p>}
                </div>
                <button
                  onClick={() => handleStart(level)}
                  disabled={locked}
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 z-20 ${
                    locked
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-pink-500 text-white hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.9)]"
                  }`}
                >
                  {locked ? "Locked" : "Start"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes lightGlow {
          0%,100% { box-shadow: 0 0 20px rgba(255,255,255,0.2), 0 0 40px rgba(255,255,255,0.1);}
          50% { box-shadow: 0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.3);}
        }
        .hover\\:animate-cardGlow:hover {
          animation: lightGlow 2s infinite alternate;
        }

        @keyframes letterGlow {
          0%,100% { color: #ec4899; text-shadow: 0 0 5px #ec4899, 0 0 10px #38bdf8;}
          50% { color: #38bdf8; text-shadow: 0 0 10px #6b7280, 0 0 15px #9333ea;}
        }
        .animate-letterGlow {
          animation: letterGlow 1.5s infinite alternate;
        }
      `}</style>
    </div>
  );
}

export default Lvls_Zp8rX4vN9tQ2sL7yB5jM3hR6kW;

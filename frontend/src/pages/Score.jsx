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

// src/pages/Score.jsx
import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useScore } from "../ScoreContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getLeaderboard, getPlayerScore } from "../api";

export default function Score() {
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [scoreData, setScoreData] = useState(() => {
    const saved = localStorage.getItem("scoreData");
    return saved ? JSON.parse(saved) : { score: 0, total: 0, timeTaken: 0, level: 1 };
  });
  const { setLevelScores } = useScore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(() => {
    const saved = localStorage.getItem("currentLevel");
    return saved ? Number(saved) : 1;
  });
  const [isFinal, setIsFinal] = useState(false);

  const levelColors = {
    1: "from-purple-500 via-pink-500 to-red-500",
    2: "from-purple-400 via-purple-500 to-pink-500",
    3: "from-pink-400 via-purple-400 to-sky-400",
  };

  useEffect(() => {
    if ((currentLevel === 1 && scoreData.score >= 4) || (currentLevel === 2 && scoreData.score >= 6)) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => window.history.pushState(null, '', window.location.href);
    const handleBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    let studentID = location.state?.studentID || localStorage.getItem("studentID");
    let level = location.state?.level || currentLevel;
    setCurrentLevel(level);
    setIsFinal(level >= 3);

    if (!studentID) { alert("Player info missing. Please log in again."); navigate("/"); return; }

    const fetchData = async () => {
      try {
        const score = await getPlayerScore(studentID, level);
        const newScoreData = {
          level,
          score: score.Score,
          total: score.TotalQuestions,
          timeTaken: score.TimeTaken,
        };
        setScoreData(newScoreData);
        localStorage.setItem("scoreData", JSON.stringify(newScoreData));
        localStorage.setItem("currentLevel", String(level));
        const lb = await getLeaderboard(level);
        setLeaderboard(lb);
      } catch (err) {
        console.error("Error fetching score or leaderboard:", err);
        alert("Failed to load score data. Please try again.");
      }
    };
    fetchData();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.state, navigate]);

  function formatTime(seconds) {
    if (!seconds && seconds !== 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function handleNextLevel() {
    setLevelScores((prev) => ({
      ...prev,
      [currentLevel]: {
        score: scoreData.score,
        played: true,
        qualified: (currentLevel === 1 && scoreData.score >= 4) || 
                   (currentLevel === 2 && scoreData.score >= 6) || 
                   currentLevel === 3,
      },
    }));

    // Clear persisted score data
    localStorage.removeItem("scoreData");
    localStorage.removeItem("currentLevel");

    // Navigate to failed if not qualified
    if ((currentLevel === 1 && scoreData.score < 4) || (currentLevel === 2 && scoreData.score < 6)) {
      navigate("/failed", { 
        state: { score: scoreData.score, total: scoreData.total, level: currentLevel }, 
        replace: true 
      });
      return;
    }

    // Updated navigation logic only
    if (currentLevel === 1 || currentLevel === 2) {
      navigate("/Lvls_Zp8rX4vN9tQ2sL7yB5jM3hR6kW", { 
        state: { studentID: location.state?.studentID || localStorage.getItem("studentID") }, 
        replace: true 
      });
    } else {
      navigate("/Lvls_Zp8rX4vN9tQ2sL7yB5jM3hR6kW", { 
        state: { studentID: location.state?.studentID || localStorage.getItem("studentID") }, 
        replace: true 
      });
    }
  }

  return (
    <>
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={400} recycle={false} />}
      <div className={`min-h-screen bg-gradient-to-tr ${levelColors[currentLevel]} p-6 flex flex-col items-center justify-center`}>
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl justify-center">

          {/* Score Card */}
          <div className="bg-gradient-to-br from-purple-700 via-pink-600 to-red-500 rounded-3xl shadow-2xl p-10 flex-1 text-center transform transition-all duration-500 hover:scale-105 hover:shadow-glow animate-cardEntrance">
            <h1 className="text-4xl font-extrabold text-white mb-6 animate-glowText">
              {isFinal ? "🎉 Your Final Score" : `🎉 Level ${currentLevel} Score`}
            </h1>
            <p className="text-xl text-white mb-2">
              Correct Answers: <span className="font-bold text-green-300">{safeRender(scoreData.score)}</span> / <span className="font-bold text-green-200">{safeRender(scoreData.total)}</span>
            </p>
            <p className="text-xl text-white mb-2">
              Wrong Answers: <span className="font-bold text-red-400">{safeRender(scoreData.total - scoreData.score)}</span>
            </p>
            <p className="text-xl text-white mb-2">
              Score Percentage: <span className="font-bold text-yellow-300">{safeRender(scoreData.total ? ((scoreData.score / scoreData.total) * 100).toFixed(1) : "0.0")}%</span>
            </p>
            <p className="text-xl text-white">
              ⏱ Time Taken: {safeRender(formatTime(scoreData.timeTaken))}
            </p>
          </div>

          {/* Leaderboard Card */}
          <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl p-8 flex-1 text-center overflow-y-auto max-h-[520px] transform transition-all duration-500 hover:scale-105 hover:shadow-glow animate-cardEntrance">
            <h1 className="text-3xl font-extrabold text-white mb-6 animate-glowText">🏆 Leaderboard</h1>
            {leaderboard.length === 0 ? (
              <p className="text-white/70">No entries yet</p>
            ) : (
              <ul className="text-white text-left space-y-4">
                {leaderboard.map((entry, idx) => (
                  <li key={entry.StudentID || entry.id || idx} className="flex justify-between p-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all">
                    <span>{idx + 1}. {entry.StudentName || entry.name} ({entry.CollegeName || entry.college})</span>
                    <span className="font-bold text-green-200">{safeRender(entry.score)} / {safeRender(entry.totalQuestions) !== '-' ? safeRender(entry.totalQuestions) : (safeRender(entry.total) !== '-' ? safeRender(entry.total) : 8)} ⏱ {safeRender(formatTime(entry.timeTaken))}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Next Level Button */}
        {currentLevel < 3 && (
          <button
            onClick={handleNextLevel}
            className="absolute bottom-6 right-6 bg-white/90 text-purple-700 py-3 px-6 rounded-3xl font-bold transform transition-all duration-300 hover:scale-110 hover:shadow-glow animate-pulseButton"
          >
            Next Level →
          </button>
        )}

        {/* Custom animations */}
        <style>{`
          @keyframes cardEntrance {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes glowText {
            0%,100% { text-shadow: 0 0 8px rgba(255,255,255,0.7), 0 0 16px rgba(255,192,203,0.5); }
            50% { text-shadow: 0 0 12px rgba(255,255,255,1), 0 0 24px rgba(255,105,180,0.7); }
          }
          @keyframes glowCard {
            0%,100% { box-shadow: 0 0 20px rgba(255,192,203,0.4), 0 0 40px rgba(147,51,234,0.3); }
            50% { box-shadow: 0 0 30px rgba(255,105,180,0.6), 0 0 60px rgba(123,50,250,0.4); }
          }
          @keyframes pulseButton {
            0%,100% { transform: scale(1) }
            50% { transform: scale(1.08) }
          }
          .animate-cardEntrance { animation: cardEntrance 0.6s ease-out forwards; }
          .animate-glowText { animation: glowText 2s linear infinite alternate; }
          .hover\\:shadow-glow:hover { animation: glowCard 2s infinite alternate; }
          .animate-pulseButton { animation: pulseButton 1.5s infinite; }
        `}</style>
      </div>
    </>
  );
}

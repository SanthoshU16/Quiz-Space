import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Completed() {
  const navigate = useNavigate();
  const location = useLocation();
  const [levelScores, setLevelScores] = useState({});
  const [lastCompletedLevel, setLastCompletedLevel] = useState(1);
  const [isFinal, setIsFinal] = useState(false);

  // Get studentID from navigation state
  const studentID = location.state?.studentID;

  useEffect(() => {
    // Block browser back/forward navigation
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);

    const fetchScores = async () => {
      try {
        const res = await fetch(`/api/player-scores/${studentID}`);
        const data = await res.json();

        setLevelScores(data.scores || {});
        setLastCompletedLevel(data.lastCompletedLevel || 1);
        setIsFinal(data.lastCompletedLevel >= 3);
      } catch (err) {
        console.error("Failed to fetch player scores:", err);
      }
    };
    if (studentID) fetchScores();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [studentID]);

  const goToScore = () => {
    const levelToShow = isFinal ? 3 : lastCompletedLevel;
    navigate("/score", {
      state: {
        studentID,
        level: levelToShow,
        score: levelScores[levelToShow]?.score || 0,
        total: levelScores[levelToShow]?.totalQuestions || 10,
        timeTaken: levelScores[levelToShow]?.timeTaken || 0,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-sky-300 via-sky-400 to-sky-500 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-white/80">
        <h1 className="text-3xl font-bold mb-4 text-sky-500">
          {isFinal
            ? "🎉 All Levels Completed!"
            : `Level-${lastCompletedLevel} Completed! 🎉`}
        </h1>

        <p className="text-lg mb-6 text-black">
          {isFinal
            ? "Amazing! You’ve successfully completed all levels of the quiz."
            : "Well done! You’ve successfully completed this level."}
        </p>

        <button
          onClick={goToScore}
          className="bg-sky-500 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-sky-500/70 focus:ring-4 focus:ring-sky-400"
        >
          {isFinal ? "View Final Score & Leaderboard" : "View Score & Leaderboard"}
        </button>
      </div>
    </div>
  );
}

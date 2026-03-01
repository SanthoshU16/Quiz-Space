// src/pages/Rules.jsx
import React, { useEffect, useState } from "react";
import { useRules } from "../RulesContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getRules } from "../api";

export default function Rules() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accepted, setAccepted } = useRules();
  const [rules, setRules] = useState([]);

  const studentName = localStorage.getItem("studentName") || location.state?.name || "Player";
  const collegeName = localStorage.getItem("collegeName") || location.state?.college || "College";
  const studentID = localStorage.getItem("studentID") || location.state?.studentID;

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await getRules();
        setRules(res.rules || []);
      } catch (err) {
        console.error("Failed to fetch rules:", err);
        setRules(["Unable to load rules from server. Please try again later."]);
      }
    };
    fetchRules();
  }, []);

  const handleAcceptChange = (e) => setAccepted(e.target.checked);

  const handleProceed = () => {
    if (!accepted) {
      alert("You must accept the terms and conditions before proceeding.");
      return;
    }
    navigate("/Lvls_Zp8rX4vN9tQ2sL7yB5jM3hR6kW", { state: { studentID, name: studentName, college: collegeName } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-pink-skyblue-gray-purple">
      {/* Glowing Orbs */}
      <div className="absolute w-[700px] h-[700px] bg-pink-400/20 rounded-full blur-3xl animate-glow1 -top-40 -left-40 pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] bg-sky-400/20 rounded-full blur-3xl animate-glow2 -bottom-40 -right-40 pointer-events-none"></div>

      {/* Card Container */}
      <div className="relative z-10 flex flex-col md:flex-row w-11/12 md:w-3/4 max-w-6xl rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(200,100,255,0.5)] border border-purple-400/40 bg-gray-900/70 backdrop-blur-xl animate-[float_6s_ease-in-out_infinite]">
        
        {/* Left Panel */}
        <div className="md:w-1/2 p-6 flex flex-col bg-gradient-to-br from-pink-600 via-purple-600 to-gray-700 text-white">
          <h1 className="text-2xl font-bold mb-3 bg-gradient-to-r from-pink-200 via-white to-sky-300 bg-clip-text text-transparent animate-[shimmer_3s_linear_infinite]">
            Quiz Rules & Guidelines
          </h1>
          <p className="text-pink-200 mb-3 text-sm">
            Welcome <span className="font-semibold">{studentName}</span> from{" "}
            <span className="font-semibold">{collegeName}</span> 👋
          </p>

          <div className="flex-1 overflow-y-auto pr-2 mb-3 border rounded-xl bg-gray-900/40 p-4" style={{ maxHeight: "30vh" }}>
            <ul className="space-y-1 text-sm text-purple-200">
              {rules.map((rule, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-pink-400 font-bold mt-1 text-xs">☑️</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-2 mb-3 bg-gray-800/50 rounded-xl border border-purple-500 text-sky-200 text-xs shadow-md">
            <h2 className="text-sm font-semibold text-pink-400 mb-1">⚠ Important Notes:</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Level 2 unlocks only if Level 1 score ≥ 4</li>
              <li>Level 3 unlocks only if Level 2 score ≥ 6</li>
              <li>Tab-switching limit: 3 times (4th = auto-submit)</li>
              <li>Timer ends → quiz auto-submits</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2 mb-3">
            <input
              key={location.key || Date.now()}
              type="checkbox"
              id="terms"
              checked={accepted}
              onChange={handleAcceptChange}
              autoComplete="off"
              className="w-4 h-4 text-pink-400 border-gray-300 rounded focus:ring-purple-300"
            />
            <label htmlFor="terms" className="text-sky-200 text-sm">
              I accept the <span className="font-semibold underline text-pink-400">Terms and Conditions</span>
            </label>
          </div>

          <button
            onClick={handleProceed}
            disabled={!accepted}
            className={`relative w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-sky-400 text-white font-bold rounded-xl shadow-xl transition-all duration-300 overflow-hidden group ${!accepted && "opacity-60 cursor-not-allowed"}`}
          >
            <span className="relative z-10">Proceed →</span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-200/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></span>
          </button>
        </div>

        {/* Right Panel */}
        <div className="md:w-1/2 p-6 flex flex-col items-center justify-center bg-gradient-to-br from-sky-400 via-pink-500 to-purple-600 text-white shadow-xl">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-center drop-shadow-lg animate-bounce">
            Let's Play Fair - Win The Game! 😉
          </h2>
          <p className="text-sm md:text-base text-center mb-4">
            Get ready to test your knowledge and compete with others. Stay
            focused, manage your time, and good luck! 🚀
          </p>
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden shadow-xl transition-transform duration-300 transform">
            <img
              src="/ho.jpeg"
              alt="Quiz Illustration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        .bg-pink-skyblue-gray-purple {
          min-height: 100vh;
          background: linear-gradient(135deg, #ec4899 0%, #38bdf8 40%, #6b7280 70%, #9333ea 100%);
          position: relative;
          overflow: hidden;
        }
        .animate-glow1 { animation: float 8s ease-in-out infinite; }
        .animate-glow2 { animation: float 10s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0px);}50%{transform:translateY(-15px);} }
        @keyframes shimmer { 0% { background-position: -500px 0; } 100% { background-position: 500px 0; } }
        .animate-[shimmer_3s_linear_infinite] { animation: shimmer 3s linear infinite; }
        @keyframes bounce { 0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);} }
        .animate-bounce { animation: bounce 2s infinite; }
      `}</style>
    </div>
  );
}

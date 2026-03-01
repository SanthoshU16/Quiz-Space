import React from "react";
import { useLocation } from "react-router-dom";

export default function Failed() {
  const location = useLocation();
  const { score, total, level } = location.state || {};
  const hasState = score !== undefined && total !== undefined && level !== undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-purple-300 to-indigo-300 p-6 overflow-hidden relative">

      {/* Decorative floating shapes */}
      <div className="absolute top-12 left-12 w-44 h-44 bg-pink-400 rounded-full opacity-40 animate-spin-slow"></div>
      <div className="absolute bottom-12 right-12 w-64 h-64 bg-purple-500 rounded-full opacity-30 animate-pulse-slow"></div>
      <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-indigo-400 rounded-full opacity-25 animate-bounce-slow"></div>

      {/* Card with glow effect */}
  <div className="relative max-w-lg w-full bg-white rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.2)] p-12 text-center animate-fadeIn glow-card">
        {/* Illustration */}
        <img
          src="/CEL.jpeg"
          alt="Quiz Failed"
          className="mx-auto w-40 mb-6 drop-shadow-xl rounded-2xl animate-fadeInUp"
        />

        {/* Main Title with letter glow animation */}
        <h1 className="text-4xl font-extrabold mb-2 flex justify-center flex-wrap">
          {"Better Luck Next Time!".split("").map((char, index) => (
            <span
              key={index}
              className="animate-letterGlow"
              style={{ animationDelay: `${index * 0.07}s` }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Description */}
        <p className="text-lg text-purple-900 mb-8 font-medium animate-fadeInUp delay-100">
          {hasState
            ? "You didn’t reach the required score to unlock the next level. Keep learning and try again!"
            : "We couldn’t retrieve your session info. Please restart the quiz to try again."}
        </p>

        {/* Score Card */}
        {hasState && (
          <div className="bg-purple-100 p-6 rounded-3xl shadow-inner mb-8 animate-fadeInUp delay-200 glow-card-inner">
            <p className="text-purple-700 font-bold text-lg">Your Score:</p>
            <p className="text-purple-900 text-3xl font-extrabold">{score} / {total}</p>
            <p className="mt-2 text-purple-800 font-semibold">Level Attempted: {level}</p>
          </div>
        )}

        {/* Motivational Footer */}
        <p className="text-indigo-800 font-bold animate-fadeIn delay-400">
          Don’t give up! Learn from mistakes and try again. 🌟
        </p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); }
        }
        @keyframes pulse-slow {
          0%,100% { opacity: 0.3; } 50% { opacity: 0.6; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes letterGlow {
          0%,100% { color: #ec4899; text-shadow: 0 0 5px #ec4899, 0 0 10px #fcd34d; }
          50% { color: #8b5cf6; text-shadow: 0 0 10px #6366f1, 0 0 20px #34d399; }
        }
        @keyframes glowCard {
          0%,100% { box-shadow: 0 15px 50px rgba(0,0,0,0.2); }
          50% { box-shadow: 0 20px 60px rgba(255,255,255,0.3), 0 0 30px rgba(255,255,255,0.2); }
        }

        .animate-spin-slow { animation: spin-slow 25s linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 1s ease forwards; }
        .animate-fadeInUp { animation: fadeInUp 1s ease forwards; }
        .animate-letterGlow { animation: letterGlow 1.5s infinite alternate; display: inline-block; }

        .glow-card { animation: glowCard 3s infinite alternate; }
        .glow-card-inner { animation: glowCard 3s infinite alternate; }

        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>
    </div>
  );
}
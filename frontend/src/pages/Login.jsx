// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !collegeName.trim()) {
      setShowPopup(true);
      return;
    }
    try {
      const data = await login(studentName.trim(), collegeName.trim());
      localStorage.setItem("studentID", data.studentID);
      localStorage.setItem("studentName", studentName.trim());
      localStorage.setItem("collegeName", collegeName.trim());
      navigate("/rules", {
        state: {
          studentID: data.studentID,
          name: studentName.trim(),
          college: collegeName.trim(),
          currentLevel: data.currentLevel || 1,
        },
      });
    } catch (err) {
      console.error("Login failed:", err);
      alert("Failed to login. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-colorful-gradient">
      {/* Glowing Orbs */}
      <div className="absolute w-[600px] h-[600px] bg-pink-400/30 rounded-full blur-3xl animate-pulse -top-40 -left-40"></div>
      <div className="absolute w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-3xl animate-pulse -bottom-40 -right-40"></div>

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.5)] border border-pink-400/30 bg-black/60 backdrop-blur-xl animate-[float_6s_ease-in-out_infinite]">
        
        {/* Left Panel */}
        <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-10 bg-gradient-to-br from-pink-500 via-purple-500 to-sky-400 text-white text-center space-y-6">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-pink-200 via-sky-100 to-purple-300 bg-clip-text text-transparent animate-[shimmer_3s_linear_infinite]">
            👑 Welcome!
          </h2>
          <p className="text-lg leading-relaxed text-pink-100">
            Enter the <span className="font-bold">AI Escape Room</span> 🤖  
            Solve puzzles, rise through levels, and shine bright.  
            <br />Your adventure begins now! ✨
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center space-y-6">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-sky-300 via-pink-200 to-purple-400 bg-clip-text text-transparent animate-[shimmer_3s_linear_infinite]">
             Login to Begin
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              placeholder=" Student Name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/10 text-pink-200 placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(236,72,153,0.7)]"
            />
            <input
              type="text"
              placeholder=" College Name"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/10 text-sky-200 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(56,189,248,0.7)]"
            />
            <button
              type="submit"
              className="relative w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-sky-400 text-white font-bold rounded-xl shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <span className="relative z-10">Enter Game →</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></span>
            </button>
          </form>
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-pink-400 p-6 rounded-2xl shadow-2xl w-80 text-center transform scale-90 animate-[zoomIn_0.3s_ease-out_forwards]">
            <h3 className="text-xl font-bold text-pink-300 mb-2">⚠ Missing Info</h3>
            <p className="text-sky-200 mb-4">
              Please enter both Student Name and College Name.
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="px-6 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-400 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Custom Background Animation */}
      <style>{`
        .bg-colorful-gradient {
          min-height: 100vh;
          background: linear-gradient(135deg, #ec4899 0%, #38bdf8 40%, #808080 70%, #8b5cf6 100%);
          position: relative;
          overflow: hidden;
        }
        .bg-colorful-gradient::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background: radial-gradient(circle at 60% 40%, #ec489955 0 200px, transparent 400px),
                      radial-gradient(circle at 30% 70%, #38bdf855 0 150px, transparent 300px),
                      radial-gradient(circle at 80% 20%, #8b5cf655 0 200px, transparent 400px);
          pointer-events: none;
          animation: bgMove 12s ease-in-out infinite alternate;
        }
        @keyframes bgMove {
          0% { transform: scale(1) translateY(0); opacity: 0.9; }
          50% { transform: scale(1.05) translateY(-20px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 0.9; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes shimmer {
          0% { background-position: -500px 0; }
          100% { background-position: 500px 0; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
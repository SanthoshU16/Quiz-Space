import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const floatingStyle = (delay, top, left) => ({
    position: "absolute",
    width: "70px",
    height: "70px",
    background: "rgba(255, 255, 255, 0.08)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    top,
    left,
    animation: `float 6s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
  });

  return (
    <div className="landing-page">
      {/* Navbar */}
      <header className="navbar">
        <div className="logo">AI Escape Room</div>
        <nav>
          <a href="#about">About</a>
          <a href="#events">Events</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero-title">
          {"Welcome to AI Escape Room".split(" ").map((word, wIdx) => (
            <span key={wIdx} style={{ marginRight: "8px" }}>
              {word.split("").map((char, cIdx) => (
                <span
                  key={cIdx}
                  className="animate-letterGlow"
                  style={{ animationDelay: `${(wIdx * 10 + cIdx) * 0.08}s` }}
                >
                  {char}
                </span>
              ))}
            </span>
          ))}
        </h1>

        <p className="hero-subtitle">
          Solve AI puzzles, beat the timer, and prove your genius. Escape if you can! 🔐
        </p>

        {/* Start Game Button */}
        <div className="hero-buttons">
          <button onClick={() => navigate("/login")} className="hero-button start-button">
            Start Game 🚀
          </button>
        </div>
        
        {/* Event Card */}
        <div className="event-card glow-card">
          <h2>THINKBIT_25 - National Tech Symposium</h2>
          <p>Organized by AI & DS and IT Departments, Mount Zion College of Engineering and Technology</p>
          <p>🗓 October 10, 2025 | 🏆 Win Exciting Cash Prizes!</p>
          <p>🎯 Event: AI Escape Room</p>
          <p>📍 Mount Zion Campus</p>
        </div>
      </section>

      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Montserrat:wght@700&family=Roboto:wght@400&display=swap');

        .landing-page {
          font-family: 'Roboto', sans-serif;
          background: radial-gradient(circle at 20% 20%, #000010, #00111a 40%, #000000 100%);
          background-size: 400% 400%;
          animation: bgMove 15s ease infinite;
          color: #fff;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }

        /* Dynamic gradient movement */
        @keyframes bgMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Navbar */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 60px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
          border-radius: 0 0 20px 20px;
          z-index: 10;
          position: relative;
        }
        .logo { font-family: 'Orbitron', sans-serif; font-size: 30px; font-weight: 800; color: #00f6ff; text-shadow: 0 0 10px #00f6ff; }
        .navbar nav a { margin: 0 15px; color: #fff; text-decoration: none; font-weight: 600; transition: 0.3s; }
        .navbar nav a:hover { color: #f9a826; }

        /* Hero */
        .hero { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%; padding: 0 20px; position: relative; z-index: 1; }
        .hero-title { font-family: 'Orbitron', sans-serif; font-size: 52px; margin-bottom: 20px; text-shadow: 0 0 10px #00f6ff, 0 0 20px #ff00ff; }
        .hero-subtitle { font-family: 'Montserrat', sans-serif; font-size: 20px; max-width: 600px; margin-bottom: 40px; color: #c1c1c1; }

        /* Start Game Button */
        .hero-button.start-button {
          padding: 18px 50px;
          font-weight: 900;
          font-size: 22px;
          border-radius: 20px;
          border: 3px solid transparent;
          cursor: pointer;
          background: linear-gradient(90deg, #00f6ff, #ff00ff, #00f6ff);
          background-size: 300%;
          color: #fff;
          text-shadow: 0 0 10px #00f6ff, 0 0 20px #ff00ff;
          box-shadow: 0 0 20px #00f6ff, 0 0 40px #ff00ff;
          transition: all 0.3s ease-in-out;
          animation: glowStart 2s infinite alternate, borderMove 6s linear infinite;
        }

        @keyframes borderMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        .hero-button.start-button:hover {
          transform: scale(1.1);
          box-shadow: 0 0 35px #00f6ff, 0 0 70px #ff00ff, 0 0 100px #00f6ff;
        }

        @keyframes glowStart {
          0% { box-shadow: 0 0 15px #00f6ff, 0 0 30px #ff00ff; }
          50% { box-shadow: 0 0 25px #ff00ff, 0 0 50px #00f6ff; }
          100% { box-shadow: 0 0 15px #00f6ff, 0 0 30px #ff00ff; }
        }

        /* Event Card */
        .event-card {
          background: rgba(10, 10, 15, 0.85);
          border: 2px solid rgba(0,255,255,0.4);
          backdrop-filter: blur(12px);
          border-radius: 25px;
          max-width: 700px;
          margin-top: 50px;
          padding: 40px 45px;
          text-align: center;
          font-size: 17px;
          line-height: 1.7;
          color: #e0e0e0;
          box-shadow: 0 0 20px rgba(0,255,255,0.2), 0 0 50px rgba(255,0,255,0.1);
          transition: all 0.6s ease;
          animation: fadeInUp 1.5s ease, cardPulse 3s infinite alternate;
        }
        .event-card:hover {
          transform: scale(1.05);
          box-shadow: 0 0 50px rgba(0,255,255,0.4), 0 0 80px rgba(255,0,255,0.3);
        }
        .event-card h2 {
          font-family: 'Orbitron', sans-serif;
          font-size: 30px;
          color: #00f6ff;
          text-shadow: 0 0 10px #00f6ff, 0 0 20px #ff00ff;
          margin-bottom: 15px;
        }

        @keyframes cardPulse {
          0% { box-shadow: 0 0 20px rgba(0,255,255,0.2); }
          50% { box-shadow: 0 0 35px rgba(255,0,255,0.3); }
          100% { box-shadow: 0 0 20px rgba(0,255,255,0.2); }
        }

        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Floating icons animation */
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-25px); } }

        /* Letter Glow Animation */
        @keyframes letterGlow {
          0%,100% { color: #00f6ff; text-shadow: 0 0 5px #00f6ff, 0 0 10px #ff00ff; }
          50% { color: #ff00ff; text-shadow: 0 0 10px #ff00ff, 0 0 20px #00f6ff; }
        }
        .animate-letterGlow { animation: letterGlow 1.5s infinite alternate; display: inline-block; }
      `}</style>
    </div>
  );
}
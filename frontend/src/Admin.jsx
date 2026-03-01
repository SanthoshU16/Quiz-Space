import React, { useState, useEffect } from "react";
import { getLeaderboard, resetLeaderboard, adminLogin } from "./api";

// Helper to verify admin token
async function verifyAdminToken(token) {
  // Try a protected endpoint (resetLeaderboard) with GET just to verify
  try {
    const res = await fetch("http://localhost:5050/api/admin/reset", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 200) return true;
    return false;
  } catch {
    return false;
  }
}

// Helper to format time in mm:ss
function formatTime(seconds) {
  if (!seconds && seconds !== 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const Admin = () => {
  // Block browser back/forward navigation
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [leaderboards, setLeaderboards] = useState({ 1: [], 2: [], 3: [] });
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  // ---- Authentication state ----
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check token on mount
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setIsAuthenticated(false);
        setCheckingAuth(false);
        return;
      }
      // Verify token with backend
      const valid = await verifyAdminToken(token);
      if (valid) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem("adminToken");
      }
      setCheckingAuth(false);
    };
    checkToken();
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await adminLogin(username, password);
      localStorage.setItem("adminToken", res.token);
      setIsAuthenticated(true);
      setUsername("");
      setPassword("");
    } catch (err) {
      setAuthError("Invalid username or password.");
      setIsAuthenticated(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("adminToken");
    setUsername("");
    setPassword("");
  };

  // Fetch leaderboards for all levels
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchAllLeaderboards = async () => {
      setLoading(true);
      try {
        const lb1 = await getLeaderboard(1);
        const lb2 = await getLeaderboard(2);
        const lb3 = await getLeaderboard(3);
        setLeaderboards({ 1: lb1, 2: lb2, 3: lb3 });
      } catch (err) {
        setError("Failed to fetch leaderboards.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllLeaderboards();
  }, [isAuthenticated]);

  // Reset leaderboard/player progress via backend API
  const handleResetLeaderboard = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all leaderboards and player progress? This cannot be undone!"
      )
    ) {
      setResetting(true);
      setError("");
      try {
        await resetLeaderboard();
        alert("Leaderboards and player progress have been reset successfully.");
        // Refresh leaderboards after reset
        const lb1 = await getLeaderboard(1);
        const lb2 = await getLeaderboard(2);
        const lb3 = await getLeaderboard(3);
        setLeaderboards({ 1: lb1, 2: lb2, 3: lb3 });
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes("token")) {
          setIsAuthenticated(false);
          localStorage.removeItem("adminToken");
          setAuthError("Session expired. Please log in again.");
        } else {
          setError("Failed to reset leaderboard.");
        }
      } finally {
        setResetting(false);
      }
    }
  };

  // Get top 3 from level 3 leaderboard
  const top3 = (leaderboards[3] || []).slice(0, 3);

  // ---- If not authenticated, show login form ----
  if (!isAuthenticated || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-sky-300 via-purple-300 to-pink-300 p-6 relative overflow-hidden">
        {/* Decorative shapes for consistency */}
        <div className="absolute w-72 h-72 bg-white/20 rounded-full top-[-60px] left-[-60px] blur-3xl animate-pulse-glow"></div>
        <div className="absolute w-96 h-96 bg-white/20 rounded-full bottom-[-80px] right-[-80px] blur-3xl animate-pulse-glow"></div>

  <div className="relative z-10 bg-white/50 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md p-10 flex flex-col justify-center space-y-6 transform transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(128,0,128,0.6)] animate-pulse-glow">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(128,0,128,0.7)]"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(128,0,128,0.7)]"
              required
            />
            {authError && (
              <div className="text-red-600 text-sm font-semibold">{authError}</div>
            )}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white font-bold rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(128,0,128,0.8)]"
              disabled={checkingAuth}
            >
              {checkingAuth ? "Checking..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---- Authenticated view ----
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-sky-300 via-purple-300 to-pink-300 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center w-full max-w-3xl mb-8">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
        <div className="flex justify-between mb-4">
          <button
            onClick={handleResetLeaderboard}
            disabled={resetting}
            className={`px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all ${resetting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {resetting ? "Resetting..." : "Reset All Leaderboards"}
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all"
          >
            Logout
          </button>
        </div>
        {error && <div className="mt-4 text-red-600 font-semibold">{error}</div>}
      </div>

      {/* Rest of your leaderboard UI */}
      <div className="w-full max-w-6xl flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4 text-gray-700">Current Leaderboards</h2>
        {loading ? (
          <div className="text-gray-500">Loading leaderboards...</div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 w-full justify-center mb-8">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className="relative max-w-sm w-80 p-6 rounded-3xl shadow-2xl flex flex-col items-center justify-between transition-all duration-300 transform bg-gradient-to-br from-purple-400 via-pink-300 to-red-300"
                style={{ minHeight: 350 }}
              >
                <h3 className="text-2xl font-bold mb-2 text-white z-20">Level {level} Leaderboard</h3>
                {leaderboards[level].length === 0 ? (
                  <p className="text-gray-100">No entries yet</p>
                ) : (
                  <ul className="text-white text-left space-y-2 w-full">
                    {leaderboards[level].map((entry, idx) => (
                      <li
                        key={entry.StudentID || entry.id || idx}
                        className="flex justify-between p-2 border-b border-white/30 rounded hover:bg-white/10 transition-all"
                      >
                        <span>
                          {idx + 1}. {entry.StudentName || entry.name} ({entry.CollegeName || entry.college})
                        </span>
                        <span className="font-bold">
                          {entry.score}/{entry.TotalQuestions || entry.total} • ⏱ {formatTime(entry.TimeTaken ?? entry.timeTaken)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Top 3 Winners from Level 3 */}
        <div className="w-full max-w-2xl bg-white/80 p-6 rounded-2xl shadow-xl mt-4 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4 text-purple-700">🏆 Top 3 Winners </h2>
          {top3.length === 0 ? (
            <p className="text-gray-500">No winners yet</p>
          ) : (
            <ul className="text-black text-left space-y-3 w-full">
              {top3.map((entry, idx) => (
                <li
                  key={entry.StudentID || entry.id || idx}
                  className="flex justify-between p-3 border-b border-gray-200 rounded-lg bg-gradient-to-r from-yellow-200 via-pink-100 to-purple-100 shadow"
                >
                  <span className="font-bold text-lg">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {entry.StudentName || entry.name} ({entry.CollegeName || entry.college})
                  </span>
                  <span className="font-bold text-purple-700">
                    {entry.score}/{entry.TotalQuestions || entry.total} • ⏱ {formatTime(entry.TimeTaken ?? entry.timeTaken)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;

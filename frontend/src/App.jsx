import React from "react";
import { ScoreProvider } from "./ScoreContext";
import { RulesProvider } from "./RulesContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import all pages
import Home from "./pages/Home";  // ✅ new home page
import Login from "./pages/Login";
import Rules from "./pages/Rules";
import Lvls_Zp8rX4vN9tQ2sL7yB5jM3hR6kW from "./pages/Lvls_Zp8rX4vN9tQ2sL7yB5jM3hR6kW";
import L1_a9f3k8bR2mT6xV1zQ4pB7yX9sL0 from "./pages/L1_a9f3k8bR2mT6xV1zQ4pB7yX9sL0";
import L2_X7n5vQ1pK8tL3mY2wE6fR9zB4cH1 from "./pages/L2_X7n5vQ1pK8tL3mY2wE6fR9zB4cH1";
import L3_P2r9mL6kB4yT8qF3zV1xN7sD5uJ0 from "./pages/L3_P2r9mL6kB4yT8qF3zV1xN7sD5uJ0";
import Completed from "./pages/Completed";
import Score from "./pages/Score";
import Admin from "./Admin";
import Failed from "./pages/Failed";

function App() {
  return (
    <ScoreProvider>
      <RulesProvider>
        <Router>
          <Routes>
            {/* ✅ Home Page */}
            <Route path="/" element={<Home />} />

            {/* Login page */}
            <Route path="/login" element={<Login />} />

            {/* Rules page */}
            <Route path="/rules" element={<Rules />} />

            {/* Levels selection page */}
            <Route path="/Lvls_Zp8rX4vN9tQ2sL7yB5jM3hR6kW" element={<Lvls_Zp8rX4vN9tQ2sL7yB5jM3hR6kW />} />

            {/* Individual level pages with 30-character route names */}
            <Route
              path="/L1_a9f3k8bR2mT6xV1zQ4pB7yX9sL0"
              element={<L1_a9f3k8bR2mT6xV1zQ4pB7yX9sL0 />}
            />
            <Route
              path="/L2_X7n5vQ1pK8tL3mY2wE6fR9zB4cH1"
              element={<L2_X7n5vQ1pK8tL3mY2wE6fR9zB4cH1 />}
            />
            <Route
              path="/L3_P2r9mL6kB4yT8qF3zV1xN7sD5uJ0"
              element={<L3_P2r9mL6kB4yT8qF3zV1xN7sD5uJ0 />}
            />

            {/* Completed, Score, and Failed pages */}
            <Route path="/completed" element={<Completed />} />
            <Route path="/score" element={<Score />} />
            <Route path="/failed" element={<Failed />} />

            {/* Admin */}
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Router>
      </RulesProvider>
    </ScoreProvider>
  );
}

export default App;

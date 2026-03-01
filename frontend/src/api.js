const BASE_URL = "http://172.29.185.8:5050"; // Updated backend port

// Helper to handle fetch responses and errors
const checkResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Network response was not ok");
  }
  return res.json();
};

// ---------------- ADMIN LOGIN & RESET LEADERBOARD ----------------
export const adminLogin = async (username, password) => {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return checkResponse(res); // { token }
};

export const resetLeaderboard = async () => {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${BASE_URL}/api/admin/reset`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return checkResponse(res);
};

// ---------------- LOGIN ----------------
export const login = async (studentName, collegeName) => {
  if (!studentName || !collegeName) throw new Error("Missing studentName or collegeName");

  const res = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentName, collegeName }),
  });

  return checkResponse(res);
};

// ---------------- SUBMIT SCORE ----------------
export const submitScore = async (studentID, level, score, timeTaken, totalQuestions) => {
  console.log('[DEBUG] submitScore params', { studentID, level, score, timeTaken, totalQuestions });
  if (
    !studentID ||
    !level ||
    score === undefined ||
    timeTaken === undefined ||
    totalQuestions === undefined ||
    totalQuestions === null
  ) {
    throw new Error("Missing required parameters");
  }

  const res = await fetch(`${BASE_URL}/api/submit-score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentID, level, score, timeTaken, totalQuestions }),
  });

  return checkResponse(res);
};

// ---------------- GET PLAYER SCORE ----------------
export const getPlayerScore = async (studentID, level) => {
  if (!studentID || !level) throw new Error("Missing studentID or level");

  try {
    const res = await fetch(`${BASE_URL}/api/player-score/${studentID}/${level}`);
    return checkResponse(res); // expects { score, totalQuestions, timeTaken }
  } catch (err) {
    console.error("Error fetching player score:", err);
    throw err;
  }
};

// ---------------- GET LEADERBOARD ----------------
export const getLeaderboard = async (level) => {
  if (!level) throw new Error("Level is required for leaderboard");

  try {
    const res = await fetch(`${BASE_URL}/api/leaderboard/${level}`);
    return checkResponse(res);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    throw err;
  }
};

// ---------------- GET QUESTIONS ----------------
export const getQuestions = async (level) => {
  const url = `${BASE_URL}/api/questions`;

  try {
    const data = await checkResponse(await fetch(url));
    if (level === 1 && data.level1) return data.level1;
    if (level === 2 && data.level2) return data.level2;
    if (level === 3 && data.level3) return data.level3;
    return [];
  } catch (err) {
    console.error("Error fetching questions:", err);
    return [];
  }
};

// ---------------- GET RULES ----------------
export const getRules = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/rules`);
    return checkResponse(res);
  } catch (err) {
    console.error("Error fetching rules:", err);
    return [];
  }
};

// ---------------- CHECK ELIGIBILITY ----------------
export const checkEligibility = async (studentID, level) => {
  try {
    const res = await fetch(`${BASE_URL}/api/check-eligibility?studentID=${studentID}&level=${level}`);
    return checkResponse(res); // { eligible: true/false }
  } catch (err) {
    console.error("Error checking eligibility:", err);
    return { eligible: false };
  }
};

// ---------------- USER PROGRESS ----------------

// Save/update progress
export const saveProgress = async ({ studentID, level, currentIndex, selectedAnswers, remainingTime }) => {
  const res = await fetch(`${BASE_URL}/api/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentID, level, currentIndex, selectedAnswers, remainingTime }),
  });
  return checkResponse(res);
};

// Get progress
export const getProgress = async (studentID, level) => {
  const res = await fetch(`${BASE_URL}/api/progress/${studentID}/${level}`);
  return checkResponse(res); // returns progress object or null
};

// Delete progress
export const deleteProgress = async (studentID, level) => {
  const res = await fetch(`${BASE_URL}/api/progress/${studentID}/${level}`, { method: "DELETE" });
  return checkResponse(res);
};

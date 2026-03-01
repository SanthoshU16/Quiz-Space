// src/pages/Level3.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getQuestions, submitScore } from "../api";

export default function Level3() {
  const navigate = useNavigate();
  const location = useLocation();

  const studentID = location.state?.studentID || localStorage.getItem("studentID");
  const studentName = location.state?.name || localStorage.getItem("studentName") || "Player";
  const collegeName = location.state?.college || localStorage.getItem("collegeName") || "College";

  const STORAGE_KEY = `level3_state_v1_${studentID}`;
  const SPLIT_SCREEN_RATIO = 0.7;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [time, setTime] = useState(300);
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [violationModal, setViolationModal] = useState({ show: false, msg: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const timer = useRef(null);
  const violationCount = useRef(0);
  const lastViolationTime = useRef(0);

  // -------------------- Security Utilities --------------------
  const handleViolation = (msg) => {
    if (submitted) return;

    const now = Date.now();
    if (now - lastViolationTime.current < 2000) return; // debounce rapid violations
    lastViolationTime.current = now;

    violationCount.current += 1;

    if (violationCount.current <= 2) {
      setShowWarningModal(true);
    } else {
      setViolationModal({ show: true, msg: `${msg} detected multiple times. Quiz will be submitted.` });
      setTimeout(() => handleSubmit(), 1000);
    }
  };

  // -------------------- Shuffle Helpers --------------------
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const shuffleChoices = (choices, answerIndex) => {
    const arr = choices.map((choice, idx) => ({ choice, idx }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const newChoices = arr.map((item) => item.choice);
    const newAnswerIndex = arr.findIndex((item) => item.idx === answerIndex);
    return { choices: newChoices, answerIndex: newAnswerIndex };
  };

  // -------------------- Initial Load --------------------
  useEffect(() => {
    const restoreOrFetch = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.questions?.length > 0) {
            setQuestions(parsed.questions);
            setSelected(parsed.selected || Array(parsed.questions.length).fill(null));
            setCurrentIndex(parsed.currentIndex || 0);
            setTime(parsed.time || 300);
            setSubmitted(parsed.submitted || false);
            setLoading(false);
            return;
          }
        }

        let level3Qs = await getQuestions(3);
        if (!Array.isArray(level3Qs) || level3Qs.length === 0) {
          setError("No questions available for Level 3. Please contact admin.");
          setQuestions([]);
          setLoading(false);
          return;
        }

        level3Qs = shuffleArray(level3Qs).slice(0, 8);
        level3Qs = level3Qs.map((q) => {
          const shuffled = shuffleChoices(q.choices, q.answerIndex);
          return { ...q, choices: shuffled.choices, answerIndex: shuffled.answerIndex };
        });

        setQuestions(level3Qs);
        setSelected(Array(level3Qs.length).fill(null));
        setCurrentIndex(0);
        setTime(300);
        setSubmitted(false);
        setLoading(false);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            questions: level3Qs,
            currentIndex: 0,
            selected: Array(level3Qs.length).fill(null),
            time: 300,
            submitted: false,
          })
        );
      } catch (err) {
        console.error("Failed to fetch Level 3 questions:", err);
        setError("Failed to load questions. Please try again later.");
        setLoading(false);
      }
    };

    restoreOrFetch();
  }, []);

  // -------------------- Security Protections --------------------
  useEffect(() => {
    const disableContext = (e) => e.preventDefault();
    const disableCopy = (e) => e.preventDefault();
    window.addEventListener("contextmenu", disableContext);
    window.addEventListener("copy", disableCopy);
    const prevSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("contextmenu", disableContext);
      window.removeEventListener("copy", disableCopy);
      document.body.style.userSelect = prevSelect || "auto";
    };
  }, []);

  const requestFullScreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    setReady(true);
  };

  useEffect(() => {
    const onFullChange = () => {
      if (ready && !document.fullscreenElement && !submitted) handleViolation("Fullscreen exit");
    };
    document.addEventListener("fullscreenchange", onFullChange);
    return () => document.removeEventListener("fullscreenchange", onFullChange);
  }, [ready, submitted]);

  useEffect(() => {
    const onHide = () => { if (document.hidden && ready && !submitted) handleViolation("Tab switch"); };
    const onBlur = () => { if (ready && !submitted) handleViolation("Focus lost"); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onBlur);
    };
  }, [ready, submitted]);

  useEffect(() => {
    const screenW = window.screen?.width || 0;
    const screenH = window.screen?.height || 0;
    const onResize = () => {
      if (!ready || submitted) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if ((vw / screenW < SPLIT_SCREEN_RATIO) || (vh / screenH < SPLIT_SCREEN_RATIO)) handleViolation("Window resize");
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [ready, submitted]);

  useEffect(() => {
    const keyHandler = (e) => {
      const forbidden =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I","C"].includes(e.key)) ||
        (e.ctrlKey && ["U","P","S","R"].includes(e.key));
      if (forbidden) {
        e.preventDefault();
        handleViolation("Suspicious key activity");
      }
    };
    window.addEventListener("keydown", keyHandler, true);
    return () => window.removeEventListener("keydown", keyHandler, true);
  }, [submitted]);

  useEffect(() => {
    const beforeUnload = (e) => { e.preventDefault(); e.returnValue = ""; };
    const onPop = () => { window.history.pushState(null,"",window.location.href); alert("🚫 You cannot go back during the quiz!"); };
    window.addEventListener("beforeunload", beforeUnload);
    window.history.pushState(null,"",window.location.href);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useEffect(() => {
    if (ready && !submitted && questions.length) {
      timer.current = setInterval(() => {
        setTime((prev) => {
          const newT = Math.max(prev - 1, 0);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions, selected, currentIndex, time: newT, submitted }));
          return newT;
        });
      }, 1000);
    }
    return () => clearInterval(timer.current);
  }, [ready, submitted, questions, selected, currentIndex]);

  useEffect(() => {
    if (time <= 0 && !submitted) handleSubmit();
  }, [time]);

  const handleSelect = (idx) => {
    if (submitted) return;
    const copy = [...selected];
    copy[currentIndex] = idx;
    setSelected(copy);
  };

  const handleNext = () => {
    if (selected[currentIndex] === null) return;
    if (currentIndex === questions.length - 1) handleSubmit();
    else setCurrentIndex((i) => i + 1);
  };

  const calculateScore = () =>
    selected.reduce((acc, ans, idx) => (ans === questions[idx].answerIndex ? acc + 1 : acc), 0);

  const handleSubmit = async () => {
    if (submitted) return;
    if (!questions.length) return;

    clearInterval(timer.current);
    setSubmitted(true);
    localStorage.removeItem(STORAGE_KEY);

    const finalScore = calculateScore();
    const timeTaken = 300 - time;

    try {
      await submitScore(studentID, 3, finalScore, timeTaken, questions.length);
      navigate("/score", {
        state: { studentID, name: studentName, college: collegeName, level: 3, score: finalScore, total: questions.length, timeTaken },
      });
    } catch {
      alert("Score submission failed. Please try again.");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2,"0")}`;
  };

  if (loading) return <div>Loading Level 3...</div>;
  if (error) return <div className="text-red-600 text-center mt-10">{error}</div>;
  if (!questions.length) return <div>No questions found for Level 3</div>;

  const currQ = questions[currentIndex];
  const answered = selected[currentIndex] !== null;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-900 via-purple-800 to-pink-700 flex items-center justify-center p-6 select-none">
      {!ready && (
        <div className="flex flex-col items-center justify-center text-white">
          <h1 className="text-3xl font-bold mb-6">Ready to start Level 3?</h1>
          <button
            onClick={requestFullScreen}
            className="px-8 py-4 bg-white text-purple-700 rounded-2xl font-bold hover:scale-105 transition-all"
          >
            Enter Fullscreen & Start
          </button>
        </div>
      )}

      {ready && (
        <div className="max-w-5xl w-full bg-white/20 backdrop-blur-xl rounded-3xl shadow-glowCard p-10 flex flex-col gap-8 animate-cardAppear">
          <div className="flex justify-between mb-4 text-white font-bold text-lg animate-pulseText">
            <div>Question {currentIndex + 1} / {questions.length}</div>
            <div className="font-mono">Time: {formatTime(time)}</div>
          </div>

          <div className="bg-white/90 p-8 rounded-3xl shadow-neonCard flex flex-col gap-6 animate-cardGlow">
            {/* ✅ Only question text glows now */}
            <h2 className="text-2xl font-extrabold text-purple-700 animate-gradientText">{currQ.text}</h2>
            <div className="grid gap-4">
              {currQ.choices.map((ch, idx) => (
                <label key={idx} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-300
                  ${selected[currentIndex] === idx ? "bg-pink-300 border-pink-500 shadow-glowChoice" : "hover:bg-pink-100 border-transparent hover:shadow-md"}`}>
                  <input type="radio" name={`q-${currQ.id}`} checked={selected[currentIndex] === idx} onChange={() => handleSelect(idx)} className="mr-3"/>
                  <span>{ch}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button disabled={!answered || submitted} onClick={handleNext} className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform
              ${!answered || submitted ? "bg-gray-400 cursor-not-allowed text-gray-600" : "bg-white text-purple-700 hover:scale-105 hover:shadow-neonBtn animate-pulseButton"}`}>
              {currentIndex === questions.length - 1 ? "Submit" : "Next"}
            </button>
          </div>

          {showWarningModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl w-96 text-center">
                <h3 className="text-xl font-bold text-yellow-500 mb-3">⚠️ Warning!</h3>
                <p className="text-gray-800 mb-5">Don’t leave fullscreen or switch tabs again — or your quiz will end.</p>
                <button onClick={() => { setShowWarningModal(false); requestFullScreen(); }} className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold">OK</button>
              </div>
            </div>
          )}

          {violationModal.show && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
              <div className="bg-white p-6 rounded-2xl w-96 text-center">
                <h3 className="text-xl font-bold text-red-600 mb-4">Violation Detected</h3>
                <p className="text-gray-700 mb-6">{violationModal.msg}</p>
                <p className="text-sm text-gray-500 mb-4">Your attempt is being recorded and will be reviewed.</p>
              </div>
            </div>
          )}

          <style>{`
            @keyframes gradientText {
              0% { background-position: 0% } 
              100% { background-position: 200% } 
            }
            .animate-gradientText { 
              background: linear-gradient(90deg, #ec4899, #8b5cf6, #f472b6); 
              background-size: 200% auto; 
              -webkit-background-clip: text; 
              color: transparent; 
              animation: gradientText 3s linear infinite; 
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
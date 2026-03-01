import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getQuestions, submitScore } from "../api";

// Utility: Shuffle helpers
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleChoices(choices, answerIndex) {
  const arr = choices.map((choice, idx) => ({ choice, idx }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const newChoices = arr.map((item) => item.choice);
  const newAnswerIndex = arr.findIndex((item) => item.idx === answerIndex);
  return { choices: newChoices, answerIndex: newAnswerIndex };
}

export default function Level2() {
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [violationModal, setViolationModal] = useState({ show: false, msg: "" });
  const [time, setTime] = useState(300);
  const navigate = useNavigate();
  const location = useLocation();
  const timer = useRef(null);
  const violationCount = useRef(0);
  const lastViolationTime = useRef(0);

  const studentID = location.state?.studentID || localStorage.getItem("studentID");
  const studentName = location.state?.name || localStorage.getItem("studentName") || "Player";
  const collegeName = location.state?.college || localStorage.getItem("collegeName") || "College";

  const STORAGE_KEY = `level2_state_v1_${studentID}`;
  const SPLIT_SCREEN_RATIO = 0.7;

  // Disable right-click, copy, select
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

  const handleViolation = (msg) => {
    if (submitted) return;

    const now = Date.now();
    if (now - lastViolationTime.current < 2000) return;
    lastViolationTime.current = now;

    violationCount.current += 1;

    if (violationCount.current <= 2) {
      setShowWarningModal(true);
    } else {
      setViolationModal({ show: true, msg: `${msg} detected multiple times. Quiz will be submitted.` });
      setTimeout(() => handleSubmit(), 1000);
    }
  };

  useEffect(() => {
    const onFullChange = () => {
      if (ready && !document.fullscreenElement && !submitted) handleViolation("Fullscreen exit");
    };
    document.addEventListener("fullscreenchange", onFullChange);
    return () => document.removeEventListener("fullscreenchange", onFullChange);
  }, [ready, submitted]);

  useEffect(() => {
    const onHide = () => {
      if (document.hidden && ready && !submitted) handleViolation("Tab switch");
    };
    const onBlur = () => {
      if (ready && !submitted) handleViolation("Focus lost");
    };
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
        (e.ctrlKey && e.shiftKey && ["I", "C"].includes(e.key)) ||
        (e.ctrlKey && ["U", "P", "S", "R"].includes(e.key));
      if (forbidden) {
        e.preventDefault();
        handleViolation("Suspicious key activity");
      }
    };
    window.addEventListener("keydown", keyHandler, true);

    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onPop = () => {
      window.history.pushState(null, "", window.location.href);
      alert("🚫 You cannot go back during the quiz!");
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("keydown", keyHandler, true);
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", onPop);
    };
  }, [submitted]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.questions?.length) {
            setQuestions(parsed.questions);
            setSelected(parsed.selected || Array(parsed.questions.length).fill(null));
            setCurrentIndex(parsed.currentIndex || 0);
            setTime(parsed.time ?? 300);
            return;
          }
        }
        let qs = await getQuestions(2);
        if (!qs?.length) {
          setError("No questions available for Level 2.");
          return;
        }
        qs = shuffleArray(qs)
          .slice(0, 8)
          .map((q) => {
            const s = shuffleChoices(q.choices, q.answerIndex);
            return { ...q, choices: s.choices, answerIndex: s.answerIndex };
          });
        setQuestions(qs);
        setSelected(Array(qs.length).fill(null));
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions: qs, selected: Array(qs.length).fill(null), time: 300 }));
      } catch {
        setError("Failed to load questions.");
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (ready && !submitted && questions.length) {
      timer.current = setInterval(() => {
        setTime((prev) => {
          const newT = Math.max(prev - 1, 0);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions, selected, time: newT }));
          return newT;
        });
      }, 1000);
    }
    return () => clearInterval(timer.current);
  }, [ready, submitted, questions, selected]);

  useEffect(() => {
    if (time <= 0 && !submitted) handleSubmit();
  }, [time]);

  const handleSelect = (i) => {
    if (submitted) return;
    const copy = [...selected];
    copy[currentIndex] = i;
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
    if (submitted || !questions.length) return;
    clearInterval(timer.current);
    setSubmitted(true);
    localStorage.removeItem(STORAGE_KEY);

    const score = calculateScore();
    const timeTaken = 300 - time;

    try {
      await submitScore(studentID, 2, score, timeTaken, questions.length);
      navigate("/score", {
        state: { studentID, name: studentName, college: collegeName, level: 2, score, total: questions.length, timeTaken },
      });
    } catch {
      alert("Failed to submit score.");
    }
  };

  if (error) return <div className="text-center text-red-600">{error}</div>;
  if (!ready)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gradient-to-tr from-indigo-900 via-purple-800 to-pink-700">
        <h1 className="text-3xl font-bold mb-6">Ready to start Level 2?</h1>
        <button
          onClick={requestFullScreen}
          className="px-8 py-4 bg-white text-purple-700 rounded-2xl font-bold hover:scale-105 transition-all"
        >
          Enter Fullscreen & Start
        </button>
      </div>
    );
  if (!questions.length) return <div>Loading questions...</div>;

  const q = questions[currentIndex];
  const answered = selected[currentIndex] !== null;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-900 via-purple-800 to-pink-700 flex items-center justify-center p-6 relative select-none">
      {/* 🔹 Gradient animation added */}
      <style>{`
        @keyframes textGlow {
          0%,100% { text-shadow: 0 0 2px #fff, 0 0 5px #ec4899, 0 0 10px #8b5cf6; }
          50% { text-shadow: 0 0 4px #fff, 0 0 10px #f472b6, 0 0 20px #a78bfa; }
        }
        .glow-text { animation: textGlow 2s infinite alternate; }
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

      <div className="absolute top-3 right-4 text-xs text-white opacity-50 select-none">
        {studentName} ({collegeName})
      </div>

      <div className="max-w-5xl w-full bg-white/20 backdrop-blur-xl rounded-3xl p-10 flex flex-col gap-8">
        <div className="flex justify-between mb-4 text-white font-bold text-lg">
          <div>Question {currentIndex + 1} / {questions.length}</div>
          <div>Time: {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}</div>
        </div>

        <div className="bg-white/90 p-8 rounded-3xl flex flex-col gap-6">
          <h2 className="text-2xl font-extrabold text-purple-700 glow-text animate-gradientText">{q.text}</h2>
          <div className="grid gap-4">
            {q.choices.map((ch, i) => (
              <label
                key={i}
                className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                  selected[currentIndex] === i
                    ? "bg-pink-300 border-pink-500"
                    : "hover:bg-gray-200 border-transparent"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={selected[currentIndex] === i}
                  onChange={() => handleSelect(i)}
                  className="mr-3"
                />
                <span>{ch}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            disabled={!answered || submitted}
            onClick={handleNext}
            className={`px-8 py-4 rounded-2xl font-bold transition-all ${
              !answered || submitted ? "bg-gray-400" : "bg-white text-purple-700 hover:scale-105"
            }`}
          >
            {currentIndex === questions.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>

      {showWarningModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-96 text-center">
            <h3 className="text-xl font-bold text-yellow-500 mb-3">⚠️ Warning!</h3>
            <p className="text-gray-800 mb-5">
              Don’t leave fullscreen or switch tabs again — or your quiz will end.
            </p>
            <button
              onClick={() => {
                setShowWarningModal(false);
                requestFullScreen();
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {violationModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
          <div className="bg-white p-6 rounded-2xl w-96 text-center">
            <h3 className="text-xl font-bold text-red-600 mb-4">Violation Detected</h3>
            <p className="text-gray-700 mb-6">{violationModal.msg}</p>
            <p className="text-sm text-gray-500 mb-4">
              Your attempt is being recorded and will be reviewed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../services/api.js";
import Editor from "@monaco-editor/react";
import { 
  AlertTriangle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Terminal,
  Code2, 
  CheckCircle2, 
  XCircle, 
  Check,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";

export const QuizSession = () => {
  const { id: quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // State mapping questionId -> selectedOptionId (for MCQ) or { language, codes: { [lang]: code } } (for CODING)
  const [selectedAnswers, setSelectedAnswers] = useState({});
  
  const [timeLeft, setTimeLeft] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Compiler state
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [runningCode, setRunningCode] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleTab, setConsoleTab] = useState(0);

  // Proctoring state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [proctorWarning, setProctorWarning] = useState(null); // "fullscreen" or "tab"
  const [warningTimeLeft, setWarningTimeLeft] = useState(10);

  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const submittingRef = useRef(submitting);

  // Sync submitting state ref for visibility checks
  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  // Helper to trigger browser Fullscreen
  const enterFullscreen = () => {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen();
    } else if (docEl.mozRequestFullScreen) {
      docEl.mozRequestFullScreen();
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
    } else if (docEl.msRequestFullscreen) {
      docEl.msRequestFullscreen();
    }
  };

  // 1. Restore state from session storage on reload
  useEffect(() => {
    let activeSession = location.state;

    if (!activeSession) {
      const saved = sessionStorage.getItem(`active_session_${quizId}`);
      if (saved) {
        activeSession = JSON.parse(saved);
      }
    } else {
      sessionStorage.setItem(`active_session_${quizId}`, JSON.stringify(activeSession));
    }

    if (!activeSession) {
      navigate(`/quizzes/${quizId}`, { replace: true });
      return;
    }

    setSession(activeSession);
    setQuestions(activeSession.questions);

    // Restore answers
    const savedAnswers = sessionStorage.getItem(`answers_${activeSession.attemptId}`);
    if (savedAnswers) {
      setSelectedAnswers(JSON.parse(savedAnswers));
    }

    // Initialize Timer
    let savedEndTime = sessionStorage.getItem(`endtime_${activeSession.attemptId}`);
    if (!savedEndTime) {
      savedEndTime = Date.now() + activeSession.quiz.duration * 60 * 1000;
      sessionStorage.setItem(`endtime_${activeSession.attemptId}`, savedEndTime);
    } else {
      savedEndTime = parseInt(savedEndTime, 10);
    }

    const calculateTime = () => {
      const diff = Math.max(0, Math.round((savedEndTime - Date.now()) / 1000));
      setTimeLeft(diff);
      
      // Auto-submit when time is up
      if (diff <= 0) {
        clearInterval(timerRef.current);
        handleAutoSubmit(activeSession.attemptId, savedEndTime);
      }
    };

    calculateTime();
    timerRef.current = setInterval(calculateTime, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  // 2. Proctoring listeners (Fullscreen, Tab/Window switches, context blocks)
  useEffect(() => {
    // Initial check
    setIsFullscreen(!!document.fullscreenElement);

    const handleFullscreenChange = () => {
      if (submittingRef.current) return;
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        setProctorWarning("fullscreen");
      } else {
        if (!document.hidden) {
          setProctorWarning(null);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (submittingRef.current) return;
      if (document.hidden) {
        setProctorWarning("tab");
      }
    };

    const handleWindowBlur = () => {
      if (submittingRef.current) return;
      setProctorWarning("tab");
    };

    const handleWindowFocus = () => {
      if (submittingRef.current) return;
      if (document.fullscreenElement && !document.hidden) {
        setProctorWarning(null);
      }
    };

    // Keyboard copy/inspections block
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (
        (isCtrl && ["c", "v", "x", "u", "s"].includes(e.key.toLowerCase())) ||
        (isCtrl && e.shiftKey && e.key.toLowerCase() === "i") ||
        e.key === "F12"
      ) {
        e.preventDefault();
        alert("Proctoring Guard: Copying, pasting, view-source, and element inspects are strictly disabled during this quiz.");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 3. Proctoring violation 10s countdown timer
  useEffect(() => {
    if (proctorWarning) {
      setWarningTimeLeft(10);
      
      warningTimerRef.current = setInterval(() => {
        setWarningTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(warningTimerRef.current);
            // Exceeded 10s warning - auto-submit and terminate
            if (session) {
              handleAutoSubmit(session.attemptId);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (warningTimerRef.current) {
        clearInterval(warningTimerRef.current);
      }
      setWarningTimeLeft(10);
    }

    return () => {
      if (warningTimerRef.current) {
        clearInterval(warningTimerRef.current);
      }
    };
  }, [proctorWarning, session]);

  const handleOptionSelect = (questionId, optionId) => {
    const updated = {
      ...selectedAnswers,
      [questionId]: optionId,
    };
    setSelectedAnswers(updated);
    if (session) {
      sessionStorage.setItem(`answers_${session.attemptId}`, JSON.stringify(updated));
    }
  };

  const handleCodeChange = (questionId, lang, code) => {
    const prevAnswer = selectedAnswers[questionId] || { codes: {}, language: lang };
    const updated = {
      ...selectedAnswers,
      [questionId]: {
        language: lang,
        codes: {
          ...(prevAnswer.codes || {}),
          [lang]: code
        }
      }
    };
    setSelectedAnswers(updated);
    if (session) {
      sessionStorage.setItem(`answers_${session.attemptId}`, JSON.stringify(updated));
    }
  };

  const handleLanguageChange = (questionId, lang) => {
    setSelectedLanguage(lang);
    
    const prevAnswer = selectedAnswers[questionId] || { codes: {} };
    // Load previously edited code or template fallback
    const currentCode = prevAnswer.codes?.[lang] || currentQuestion.codingTemplate?.[lang] || "";
    
    handleCodeChange(questionId, lang, currentCode);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 65; // keep normal mod behavior
    const correctSecs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${correctSecs.toString().padStart(2, "0")}`;
  };

  // Compile and run against sample test cases
  const handleRunCode = async () => {
    const currentQuestion = questions[currentIdx];
    const ans = selectedAnswers[currentQuestion.id];
    const activeLanguage = ans?.language || selectedLanguage;
    const codeToRun = ans?.codes?.[activeLanguage] || ans?.code || currentQuestion.codingTemplate?.[activeLanguage] || "";

    setRunningCode(true);
    setRunResults(null);
    setShowConsole(true);
    setConsoleTab(0);

    try {
      const res = await api.post(`/quizzes/${quizId}/run`, {
        questionId: currentQuestion.id,
        code: codeToRun,
        language: activeLanguage,
      });
      setRunResults(res.results);
    } catch (err) {
      setError(err.message || "Failed to run code execution request");
    } finally {
      setRunningCode(false);
    }
  };

  const buildSubmissionPayload = () => {
    return questions.map((q) => {
      const ans = selectedAnswers[q.id];
      if (q.type === "CODING") {
        const lang = ans?.language || selectedLanguage;
        const code = ans?.codes?.[lang] || ans?.code || q.codingTemplate?.[lang] || "";
        return {
          questionId: q.id,
          submittedCode: code,
          submittedLanguage: lang,
        };
      } else {
        return {
          questionId: q.id,
          selectedOptionId: typeof ans === "string" ? ans : null,
        };
      }
    });
  };

  const handleAutoSubmit = async (attemptId, endTime) => {
    setSubmitting(true);
    setError("");

    const formattedAnswers = buildSubmissionPayload();

    try {
      // Exit fullscreen if still active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      const res = await api.post(`/quizzes/${quizId}/submit`, {
        attemptId: attemptId || session.attemptId,
        answers: formattedAnswers,
      });

      // Clear sessions
      sessionStorage.removeItem(`active_session_${quizId}`);
      sessionStorage.removeItem(`endtime_${attemptId || session.attemptId}`);
      sessionStorage.removeItem(`answers_${attemptId || session.attemptId}`);

      navigate(`/attempts/${res.data.id}`, { replace: true });
    } catch (err) {
      setError("Auto-submission failed. Please contact the administrator.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    setSubmitting(true);
    setError("");

    const formattedAnswers = buildSubmissionPayload();

    try {
      // Exit fullscreen if still active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      const res = await api.post(`/quizzes/${quizId}/submit`, {
        attemptId: session.attemptId,
        answers: formattedAnswers,
      });

      // Clear sessions
      sessionStorage.removeItem(`active_session_${quizId}`);
      sessionStorage.removeItem(`endtime_${session.attemptId}`);
      sessionStorage.removeItem(`answers_${session.attemptId}`);

      navigate(`/attempts/${res.data.id}`, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to submit quiz. Please try again.");
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const isCoding = currentQuestion.type === "CODING";
  
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = questions.length - answeredCount;

  // Sync state language to matching question selected lang if already saved
  const activeCodeObj = selectedAnswers[currentQuestion.id];
  const activeLanguage = activeCodeObj?.language || selectedLanguage;
  const monacoLanguage = activeLanguage === "cpp" ? "cpp" : activeLanguage === "js" ? "javascript" : activeLanguage;
  
  // Resolve current code editor text
  const currentEditorValue = activeCodeObj?.codes?.[activeLanguage] || activeCodeObj?.code || currentQuestion.codingTemplate?.[activeLanguage] || "";

  return (
    <div 
      className="mx-auto max-w-6xl py-2 flex flex-col gap-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">{session.quiz.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Attempt Session: {session.attemptId}</p>
        </div>

        {/* Timer Box */}
        <div className={`flex items-center gap-2 rounded-xl px-4 py-2 border font-mono text-lg font-bold shadow-sm ${
          timeLeft < 60 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-white text-slate-700 border-slate-200"
        }`}>
          <Clock className="h-5 w-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left column: Question Display Card */}
        <div className="md:col-span-2 flex flex-col gap-4">
          
          <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between min-h-[450px]">
            <div>
              {/* Question specs */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-semibold text-slate-500">
                <span>Question {currentIdx + 1} of {questions.length}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-bold">{currentQuestion.type}</span>
                  <span>Marks: {currentQuestion.marks}</span>
                </div>
              </div>

              {/* Question description */}
              <h3 className="mt-4 text-lg font-bold text-slate-900 leading-relaxed font-display">
                {currentQuestion.questionText}
              </h3>

              {/* Toggle MCQ options list vs Monaco Compiler Editor */}
              {isCoding ? (
                <div className="mt-5 flex flex-col gap-3">
                  {/* Language Selector bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Code2 className="h-4 w-4 text-indigo-500" />
                      <span>Write your solution:</span>
                    </span>
                    <select
                      value={activeLanguage}
                      onChange={(e) => handleLanguageChange(currentQuestion.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="python">Python 3</option>
                      <option value="javascript">Node.js (JavaScript)</option>
                      <option value="cpp">C++ (GCC)</option>
                      <option value="c">C (GCC)</option>
                      <option value="java">Java (JDK)</option>
                    </select>
                  </div>

                  {/* Monaco Editor */}
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <Editor
                      height="320px"
                      language={monacoLanguage}
                      value={currentEditorValue}
                      onChange={(val) => handleCodeChange(currentQuestion.id, activeLanguage, val)}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        automaticLayout: true,
                        scrollbar: { vertical: "visible", horizontal: "visible" },
                        contextmenu: false,
                        copyWithSyntaxHighlighting: false,
                      }}
                    />
                  </div>

                  {/* Run code trigger bar */}
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleRunCode}
                      disabled={runningCode}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 disabled:bg-slate-400 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Run sample test cases</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* MCQ Options List */
                <div className="mt-6 flex flex-col gap-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white"
                        }`}>
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
                        </div>
                        <span>{option.optionText}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  setCurrentIdx(Math.max(0, currentIdx - 1));
                  setShowConsole(false);
                }}
                disabled={currentIdx === 0}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              {currentIdx === questions.length - 1 ? (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-md hover:bg-indigo-700 transition-colors"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1));
                    setShowConsole(false);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

          </div>

          {/* Compiler console output drawer */}
          {showConsole && isCoding && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-white">
                <span className="text-xs font-bold font-mono flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <span>Execution Output Console</span>
                </span>
                <button 
                  onClick={() => setShowConsole(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="p-4 bg-slate-950 font-mono text-sm min-h-[120px] max-h-[250px] overflow-y-auto">
                {runningCode ? (
                  <div className="flex items-center gap-3 py-6 justify-center text-slate-400">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                    <span>Compiling and running code...</span>
                  </div>
                ) : runResults ? (
                  <div className="flex flex-col gap-4">
                    {/* Test Case tab switcher */}
                    <div className="flex border-b border-slate-800 pb-2 gap-2">
                      {runResults.map((res, i) => (
                        <button
                          key={i}
                          onClick={() => setConsoleTab(i)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                            consoleTab === i
                              ? "bg-slate-800 text-white"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <span>Test Case {i + 1}</span>
                          {res.passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Result details */}
                    {runResults[consoleTab] && (
                      <div className="flex flex-col gap-2.5 text-xs">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Input</span>
                            <pre className="mt-1 text-slate-300 whitespace-pre-wrap">{runResults[consoleTab].input || "<no stdin>"}</pre>
                          </div>
                          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Expected Output</span>
                            <pre className="mt-1 text-slate-355 whitespace-pre-wrap">{runResults[consoleTab].expected}</pre>
                          </div>
                        </div>

                        {runResults[consoleTab].error ? (
                          <div className="bg-red-950/40 p-2.5 rounded border border-red-900/50 text-red-400">
                            <span className="text-[10px] text-red-500 font-bold uppercase block">Run Error</span>
                            <pre className="mt-1 whitespace-pre-wrap">{runResults[consoleTab].error}</pre>
                          </div>
                        ) : (
                          <div className={`p-2.5 rounded border ${
                            runResults[consoleTab].passed 
                              ? "bg-green-950/20 border-green-900/50 text-green-400" 
                              : "bg-red-950/20 border-red-900/50 text-red-400"
                          }`}>
                            <span className="text-[10px] font-bold uppercase block">Your Output</span>
                            <pre className="mt-1 whitespace-pre-wrap">{runResults[consoleTab].output || "<no stdout>"}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500">Run code to see compile and execution results</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right column: Navigation drawer */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-5 h-fit">
          <div>
            <h3 className="font-display font-bold text-slate-900">Quiz Map</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                <span>Answered ({answeredCount})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-200"></span>
                <span>Remaining ({unansweredCount})</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-4">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIdx;
              const isAnswered = !!selectedAnswers[q.id];
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIdx(idx);
                    setShowConsole(false);
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold border transition-all ${
                    isCurrent
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : isAnswered
                      ? "border-indigo-100 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full rounded-xl bg-slate-950 py-3 text-center text-sm font-semibold text-white hover:bg-slate-900 transition-colors shadow-sm"
            >
              Submit Assessment
            </button>
          </div>

        </div>

      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-4">
            
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 font-display">Submit Assessment?</h3>
              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to finish and submit your quiz attempt?
              </p>
              {unansweredCount > 0 && (
                <div className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700 font-semibold border border-amber-100">
                  ⚠️ You have left {unansweredCount} questions unanswered/unsolved.
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Back to Test
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  "Yes, Submit"
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Proctoring Start Modal */}
      {!isFullscreen && !proctorWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl flex flex-col gap-6 text-center text-white">
            
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 animate-pulse">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold font-display">Assessment Proctoring Guard</h3>
              <p className="mt-3 text-sm text-slate-450 leading-relaxed">
                This test is strictly monitored to ensure fairness. You must run this quiz in <strong>Fullscreen mode</strong>. 
                Switching tabs, minimizing the browser, or exiting fullscreen mode will initiate an automatic test cancellation.
              </p>
              <div className="mt-4 rounded-xl bg-indigo-950/40 p-4 border border-indigo-900/50 text-xs text-indigo-350 text-left flex flex-col gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                  <span>Clipboard operations (copy/cut/paste) are disabled.</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                  <span>Shortcuts like inspect element (F12) are blocked.</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                  <span>You have 10 seconds to recover if you exit fullscreen.</span>
                </span>
              </div>
            </div>

            <button
              onClick={enterFullscreen}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
            >
              Start Assessment in Fullscreen
            </button>

          </div>
        </div>
      )}

      {/* Proctoring Violation Warning Modal */}
      {proctorWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-800 bg-red-950 p-6 shadow-2xl flex flex-col gap-5 text-center text-white border-t-4 border-t-red-500">
            
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-900/50 text-red-400 border border-red-750 animate-bounce">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold font-display text-red-200">Proctoring Violation Detected!</h3>
              <p className="mt-2 text-sm text-red-300">
                {proctorWarning === "fullscreen" 
                  ? "You have exited Fullscreen mode!" 
                  : "You have switched browser tabs or windows!"}
              </p>
              <p className="mt-1.5 text-xs text-red-400">
                Please return to Fullscreen mode immediately. If you do not return within the countdown, your test will be auto-submitted and graded as-is.
              </p>
            </div>

            <div className="bg-red-900/30 py-3 rounded-xl border border-red-800/40">
              <span className="text-3xl font-extrabold font-mono text-red-400">{warningTimeLeft}s</span>
              <span className="block text-[10px] text-red-300 uppercase tracking-wider mt-1">Remaining to Return</span>
            </div>

            <button
              onClick={enterFullscreen}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 active:scale-95 transition-all"
            >
              Return to Fullscreen
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default QuizSession;

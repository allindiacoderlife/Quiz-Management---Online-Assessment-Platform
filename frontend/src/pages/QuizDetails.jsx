import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/auth.context.jsx";
import { 
  Timer, 
  Award, 
  HelpCircle, 
  ArrowLeft, 
  AlertCircle, 
  Play, 
  History,
  CheckSquare
} from "lucide-react";

export const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [userAttempts, setUserAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchQuizDetails();
  }, [id]);

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      const [quizRes, attemptsRes] = await Promise.all([
        api.get(`/quizzes/${id}`),
        api.get("/attempts"),
      ]);
      setQuiz(quizRes.data);
      
      // Filter user attempts for this specific quiz
      const matchedAttempts = attemptsRes.data.filter((a) => a.quizTitle === quizRes.data.title);
      setUserAttempts(matchedAttempts);
    } catch (err) {
      setError(err.message || "Failed to load quiz details");
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!quiz) return;
    
    // Check attempt limit
    if (userAttempts.length >= quiz.maxAttempts) {
      setError(`You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.`);
      return;
    }

    setError("");
    setStarting(true);

    try {
      const res = await api.post(`/quizzes/${id}/start`);
      // Navigate to the active session route, passing the session details and questions array
      navigate(`/quizzes/${id}/session`, {
        state: {
          attemptId: res.data.attemptId,
          quiz: res.data.quiz,
          questions: res.data.questions,
        },
      });
    } catch (err) {
      setError(err.message || "Failed to start quiz attempt. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case "EASY":
        return "bg-green-100 text-green-800 border-green-200";
      case "HARD":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
        Quiz details could not be found.
      </div>
    );
  }

  const remainingAttempts = quiz.maxAttempts - userAttempts.length;

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6 py-4">
      {/* Back button */}
      <div>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Discover</span>
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 flex flex-col gap-6">
        
        {/* Title and Tags */}
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-600">
              {quiz.categoryName}
            </span>
            <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${getDifficultyColor(quiz.difficulty)}`}>
              {quiz.difficulty.toLowerCase()}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl font-display">{quiz.title}</h2>
          <p className="text-sm text-slate-500 mt-2">
            {quiz.description || "Take this quiz to validate your skills and track your scores."}
          </p>
        </div>

        {/* Specs Highlights */}
        <div className="grid gap-4 sm:grid-cols-3">
          
          {/* Duration */}
          <div className="rounded-xl bg-slate-50 p-4 flex flex-col items-center text-center">
            <Timer className="h-6 w-6 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">Duration</span>
            <span className="text-lg font-bold text-slate-900 mt-1">{quiz.duration} Minutes</span>
          </div>

          {/* Questions */}
          <div className="rounded-xl bg-slate-50 p-4 flex flex-col items-center text-center">
            <HelpCircle className="h-6 w-6 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">Questions</span>
            <span className="text-lg font-bold text-slate-900 mt-1">{quiz.questionCount} Items</span>
          </div>

          {/* Passing score */}
          <div className="rounded-xl bg-slate-50 p-4 flex flex-col items-center text-center">
            <Award className="h-6 w-6 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">Passing score</span>
            <span className="text-lg font-bold text-slate-900 mt-1">{quiz.passingScore}% Correct</span>
          </div>

        </div>

        {/* Instructions */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 flex flex-col gap-3">
          <h3 className="font-display font-bold text-slate-900">Quiz Instructions & Rules:</h3>
          <ul className="list-inside list-disc text-sm text-slate-600 flex flex-col gap-1">
            <li>Ensure you have a stable internet connection before starting.</li>
            <li>The timer begins the moment you click **Start Assessment**.</li>
            <li>Refreshing or navigating away does not pause the timer.</li>
            <li>The quiz will be auto-submitted immediately if the countdown expires.</li>
            <li>You can go back and forth between questions to review answers.</li>
          </ul>
        </div>

        {/* Attempts status panel */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-5 text-sm">
          <div className="flex flex-col text-slate-600">
            <span className="flex items-center gap-1.5">
              <History className="h-4 w-4 text-slate-400" />
              <span>Attempts Taken: <strong className="text-slate-900">{userAttempts.length} / {quiz.maxAttempts}</strong></span>
            </span>
            {quiz.maxAttempts - userAttempts.length > 0 && (
              <span className="text-xs text-slate-400 mt-0.5">Remaining attempts: {remainingAttempts}</span>
            )}
          </div>

          {remainingAttempts <= 0 ? (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-center text-xs font-semibold text-red-600">
              Maximum attempts limit reached for this quiz.
            </div>
          ) : (
            <button
              onClick={handleStartQuiz}
              disabled={starting}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {starting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Start Assessment</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default QuizDetails;

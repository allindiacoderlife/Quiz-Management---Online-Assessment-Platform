import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api.js";
import { 
  Trophy, 
  XCircle, 
  CheckCircle, 
  Award, 
  Clock, 
  Check, 
  X, 
  Info,
  HelpCircle
} from "lucide-react";

export const QuizResult = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResultDetails();
  }, [id]);

  const fetchResultDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attempts/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load attempt result");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
        {error || "Result information could not be retrieved."}
      </div>
    );
  }

  const { attempt, questions } = data;
  const isPassed = attempt.status === "PASSED";

  const getOptionStyle = (option, question) => {
    const isUserSelected = question.selectedOptionId === option.id;
    const isCorrectOption = option.isCorrect;

    if (isCorrectOption) {
      return "border-green-300 bg-green-50 text-green-900";
    }
    if (isUserSelected && !isCorrectOption) {
      return "border-red-300 bg-red-50 text-red-900";
    }
    return "border-slate-200 bg-white text-slate-700";
  };

  return (
    <div className="mx-auto max-w-4xl py-4 flex flex-col gap-6">
      
      {/* Scorecard Hero card */}
      <div className={`relative rounded-3xl p-6 text-center border shadow-lg md:p-8 flex flex-col items-center ${
        isPassed
          ? "bg-gradient-to-r from-emerald-50 to-green-100/50 border-green-200 text-green-900"
          : "bg-gradient-to-r from-red-50 to-orange-50 border-red-200 text-red-900"
      }`}>
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-md ${
          isPassed ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {isPassed ? <Trophy className="h-9 w-9" /> : <XCircle className="h-9 w-9" />}
        </div>

        <h1 className="mt-4 text-3xl font-extrabold font-display">
          {isPassed ? "Congratulations!" : "Keep Practicing!"}
        </h1>
        <p className="mt-1 text-sm opacity-80">
          You completed the quiz <strong className="font-semibold">{attempt.quizTitle}</strong>
        </p>

        {/* Score percentage banner */}
        <div className="mt-6 flex flex-col items-center">
          <span className="text-5xl font-extrabold tracking-tight font-display">
            {attempt.percentage}%
          </span>
          <span className="mt-1.5 rounded-full px-4 py-1 text-sm font-bold uppercase tracking-wider border bg-white shadow-sm flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${isPassed ? "bg-green-600" : "bg-red-600"}`}></span>
            <span className={isPassed ? "text-green-700" : "text-red-700"}>{attempt.status}</span>
          </span>
        </div>

        {/* Breakdown Stats */}
        <div className="mt-8 grid w-full grid-cols-2 gap-4 border-t border-slate-200/60 pt-6 text-slate-700 sm:grid-cols-4 font-semibold text-sm">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Correct</span>
            <span className="text-lg font-bold text-slate-900 mt-1">{attempt.correctAnswers}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Incorrect</span>
            <span className="text-lg font-bold text-slate-900 mt-1">{attempt.incorrectAnswers}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Unanswered</span>
            <span className="text-lg font-bold text-slate-900 mt-1">{attempt.unanswered}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Time Taken</span>
            <span className="text-lg font-bold text-slate-900 mt-1">
              {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            Explore Quizzes
          </Link>
        </div>
      </div>

      {/* Answer key review list */}
      <div className="flex flex-col gap-5 mt-4">
        <h3 className="text-xl font-bold text-slate-900 font-display">Review Questions</h3>

        {questions.map((q, idx) => {
          const isCorrect = q.isCorrect;
          const isCoding = q.type === "CODING";
          const hasAnswered = isCoding ? q.submittedCode !== null : q.selectedOptionId !== null;

          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
              
              {/* Question header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <span className="text-sm font-bold text-slate-500 font-display">Question {idx + 1}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  !hasAnswered
                    ? "bg-slate-100 text-slate-600 border-slate-200"
                    : isCorrect
                    ? "bg-green-50 text-green-700 border-green-100"
                    : "bg-red-50 text-red-700 border-red-100"
                }`}>
                  {!hasAnswered ? (
                    <span>Skipped</span>
                  ) : isCorrect ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Correct (+{q.marks})</span>
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3" />
                      <span>Incorrect</span>
                    </>
                  )}
                </span>
              </div>

              {/* Question Text */}
              <h4 className="font-display font-bold text-slate-950 leading-relaxed">
                {q.questionText}
              </h4>

              {/* Toggle coding source vs MCQ options list */}
              {isCoding ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <span>Language: </span>
                      <strong className="text-slate-800 capitalize">{q.submittedLanguage || "unknown"}</strong>
                    </span>
                    {hasAnswered && (
                      <span className={`px-2 py-0.5 rounded-full border font-bold ${
                        isCorrect ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                      }`}>
                        Passed: {q.passedCount || 0} / {q.totalCount || 0} Test Cases
                      </span>
                    )}
                  </div>

                  {hasAnswered ? (
                    <div className="rounded-xl bg-slate-900 p-4 font-mono text-sm text-slate-250 border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed select-all">
                      <code>{q.submittedCode}</code>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 py-6 text-center text-sm font-semibold text-slate-500">
                      No code submitted for this task
                    </div>
                  )}
                </div>
              ) : (
                /* Options list with correct/incorrect highlights */
                <div className="flex flex-col gap-2.5">
                  {q.options.map((option) => {
                    const isSelected = q.selectedOptionId === option.id;
                    const isCorrectOption = option.isCorrect;
                    const styleClass = getOptionStyle(option, q);

                    return (
                      <div
                        key={option.id}
                        className={`flex items-start justify-between rounded-xl border p-4 text-sm font-semibold transition-colors ${styleClass}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isCorrectOption ? "border-green-600 bg-green-600" : isSelected ? "border-red-600 bg-red-600" : "border-slate-300 bg-white"
                          }`}>
                            {(isCorrectOption || isSelected) && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
                          </div>
                          <span>{option.optionText}</span>
                        </div>

                        {/* Icon overlay indication */}
                        <div className="flex items-center gap-2 text-xs font-bold select-none shrink-0">
                          {isCorrectOption && (
                            <span className="flex items-center gap-1 text-green-700">
                              <Check className="h-4 w-4" />
                              <span>Correct Answer</span>
                            </span>
                          )}
                          {isSelected && !isCorrectOption && (
                            <span className="flex items-center gap-1 text-red-700">
                              <X className="h-4 w-4" />
                              <span>Your Selection</span>
                            </span>
                          )}
                          {isSelected && isCorrectOption && (
                            <span className="rounded-full bg-green-600 text-white p-0.5">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation block */}
              {q.explanation && (
                <div className="mt-2 rounded-xl border border-indigo-50 bg-indigo-50/30 p-4 text-sm text-slate-700 leading-relaxed flex items-start gap-2.5">
                  <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900 font-display">Explanation:</h5>
                    <p className="mt-1 text-slate-600">{q.explanation}</p>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default QuizResult;

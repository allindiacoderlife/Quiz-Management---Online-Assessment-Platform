import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { Plus, BookOpen, Pencil, Trash2, Eye, Play, Check, X, AlertCircle } from "lucide-react";

export const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Quiz Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE"); // "CREATE" or "EDIT"
  const [quizId, setQuizId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [duration, setDuration] = useState(15);
  const [passingScore, setPassingScore] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quizzesRes, categoriesRes] = await Promise.all([
        api.get("/quizzes"),
        api.get("/categories"),
      ]);
      setQuizzes(quizzesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError(err.message || "Failed to load database details");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode("CREATE");
    setQuizId("");
    setTitle("");
    setDescription("");
    setCategoryId(categories[0]?.id || "");
    setDifficulty("INTERMEDIATE");
    setDuration(15);
    setPassingScore(60);
    setMaxAttempts(1);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (quiz) => {
    setModalMode("EDIT");
    setQuizId(quiz.id);
    setTitle(quiz.title);
    setDescription(quiz.description || "");
    setCategoryId(quiz.categoryId || "");
    setDifficulty(quiz.difficulty);
    setDuration(quiz.duration);
    setPassingScore(quiz.passingScore);
    setMaxAttempts(quiz.maxAttempts);
    setModalError("");
    setShowModal(true);
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;

    setModalError("");
    setSaving(true);

    const payload = {
      title: title.trim(),
      description,
      categoryId,
      difficulty,
      duration: parseInt(duration, 10),
      passingScore: parseInt(passingScore, 10),
      maxAttempts: parseInt(maxAttempts, 10),
    };

    try {
      if (modalMode === "CREATE") {
        const res = await api.post("/quizzes", payload);
        const catName = categories.find((c) => c.id === categoryId)?.name || "";
        setQuizzes([...quizzes, { ...res.data, categoryName: catName, questionCount: 0 }]);
      } else {
        const res = await api.put(`/quizzes/${quizId}`, payload);
        const catName = categories.find((c) => c.id === categoryId)?.name || "";
        setQuizzes(
          quizzes.map((q) =>
            q.id === quizId
              ? { ...q, ...res.data, categoryName: catName }
              : q
          )
        );
      }
      setShowModal(false);
    } catch (err) {
      setModalError(err.message || "Failed to save quiz configurations");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (quizId, currentStatus, questionCount) => {
    // Cannot publish if quiz has no questions
    if (currentStatus !== "PUBLISHED" && questionCount === 0) {
      alert("Cannot publish a quiz with 0 questions. Please add questions first by clicking 'Manage Questions'.");
      return;
    }

    const nextStatus = currentStatus === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";
    try {
      await api.patch(`/quizzes/${quizId}/publish`, { status: nextStatus });
      setQuizzes(quizzes.map((q) => (q.id === quizId ? { ...q, status: nextStatus } : q)));
    } catch (err) {
      alert(err.message || "Failed to update publish status");
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!window.confirm(`Are you sure you want to permanently delete the quiz "${quiz?.title}"? All questions, options, and candidate attempts associated with it will be deleted.`)) {
      return;
    }

    try {
      await api.delete(`/quizzes/${quizId}`);
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
    } catch (err) {
      alert(err.message || "Failed to delete quiz");
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-50 text-green-700 border-green-200";
      case "UNPUBLISHED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">Manage Quizzes</h1>
          <p className="text-sm text-slate-500 mt-1">Configure timed test settings and manage active question banks</p>
        </div>
        <button
          onClick={handleOpenCreate}
          disabled={categories.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all self-start sm:self-auto disabled:bg-slate-400"
        >
          <Plus className="h-4 w-4" />
          <span>New Assessment</span>
        </button>
      </div>

      {categories.length === 0 && !loading && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 font-semibold">
          ⚠️ Please create at least one category under the "Categories" tab before configuring quizzes.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-800">No Quizzes Defined</h3>
          <p className="mt-2 text-sm text-slate-500">Configure a quiz to build question sheets</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              
              <div>
                {/* Meta details tag */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {quiz.categoryName}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(quiz.status)}`}>
                    {quiz.status.toLowerCase()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-4 font-display text-lg font-bold text-slate-900 line-clamp-1">{quiz.title}</h3>
                
                {/* Specs */}
                <div className="mt-4 grid grid-cols-2 gap-y-2 border-y border-slate-100 py-3 text-xs font-semibold text-slate-500">
                  <div>Difficulty: <strong className={`rounded border px-1.5 py-0.5 text-[10px] ${getDifficultyColor(quiz.difficulty)}`}>{quiz.difficulty}</strong></div>
                  <div>Duration: <strong className="text-slate-800">{quiz.duration} mins</strong></div>
                  <div>Passing score: <strong className="text-slate-800">{quiz.passingScore}%</strong></div>
                  <div>Max attempts: <strong className="text-slate-800">{quiz.maxAttempts}</strong></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Questions in bank</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-800">{quiz.questionCount}</span>
                </div>

                <Link
                  to={`/admin/quizzes/${quiz.id}/questions`}
                  className="rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Manage Questions
                </Link>

                <div className="flex gap-2">
                  {/* Publish/Unpublish */}
                  <button
                    onClick={() => handleTogglePublish(quiz.id, quiz.status, quiz.questionCount)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${
                      quiz.status === "PUBLISHED"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {quiz.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </button>

                  {/* Edit details */}
                  <button
                    onClick={() => handleOpenEdit(quiz)}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    title="Edit Quiz Configuration"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete Quiz"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Quiz Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {modalMode === "CREATE" ? "New Assessment Config" : "Edit Quiz Details"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-semibold flex items-start gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuiz} className="flex flex-col gap-4 overflow-y-auto pr-1">
              
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quiz Title</label>
                <input
                  type="text"
                  placeholder="e.g. JavaScript Basics, React Router Advanced"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                  disabled={saving}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
                <textarea
                  placeholder="Enter details about what is covered in this test..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  disabled={saving}
                />
              </div>

              {/* Category selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subject Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  required
                  disabled={saving}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dual grid params */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Difficulty */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    disabled={saving}
                  >
                    <option value="EASY">Easy</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                    disabled={saving}
                  />
                </div>

                {/* Passing Score */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Passing Score (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                    disabled={saving}
                  />
                </div>

                {/* Max attempts */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Max Attempts</label>
                  <input
                    type="number"
                    min={1}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim() || !categoryId}
                  className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center"
                >
                  {saving ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    "Save Configurations"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminQuizzes;

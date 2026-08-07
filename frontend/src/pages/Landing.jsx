import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { BookOpen, Search, Filter, Timer, Award, CheckCircle } from "lucide-react";

export const Landing = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

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
      setError(err.message || "Failed to load quizzes list");
    } finally {
      setLoading(false);
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

  // Filter logic on clientside for real-time response
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? quiz.categoryId === selectedCategory : true;
    const matchesDifficulty = selectedDifficulty ? quiz.difficulty === selectedDifficulty : true;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Hero section */}
      <section className="relative rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 px-6 py-12 text-center text-white shadow-xl md:px-12 md:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl font-display">
          Challenge Your Skills, Level Up!
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-indigo-100 md:text-lg">
          Browse and take online quizzes across various technical categories. Check details, test yourself under countdown timers, and track your leaderboard ranking.
        </p>
      </section>

      {/* Discovery Filters Grid */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search quizzes by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Filters Selectors */}
          <div className="flex flex-wrap gap-3">
            {/* Categories */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="HARD">Hard</option>
            </select>

            {/* Reset */}
            {(selectedCategory || selectedDifficulty || search) && (
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setSelectedDifficulty("");
                  setSearch("");
                }}
                className="rounded-xl border border-indigo-200 px-4 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

        </div>
      </section>

      {/* Quizzes Grids */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
          {error}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-800">No Quizzes Found</h3>
          <p className="mt-2 text-sm text-slate-500">Try matching filters or search queries</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
              
              <div>
                {/* Meta details tag */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {quiz.categoryName}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getDifficultyColor(quiz.difficulty)}`}>
                    {quiz.difficulty.toLowerCase()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-4 font-display text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {quiz.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                  {quiz.description || "Test your understanding with this comprehensive practice set."}
                </p>

                {/* Specs */}
                <div className="mt-4 grid grid-cols-2 gap-y-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Timer className="h-4 w-4 text-indigo-500" />
                    <span>{quiz.duration} mins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                    <span>{quiz.questionCount} questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-indigo-500" />
                    <span>{quiz.passingScore}% passing</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-indigo-500" />
                    <span>Max {quiz.maxAttempts} attempts</span>
                  </div>
                </div>
              </div>

              {/* Start action */}
              <div className="mt-6">
                <Link
                  to={`/quizzes/${quiz.id}`}
                  className="block w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  Start Assessment
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Landing;

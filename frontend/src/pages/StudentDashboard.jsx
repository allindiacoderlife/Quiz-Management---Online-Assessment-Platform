import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { Award, CheckCircle2, XCircle, ChevronRight, BarChart2, BookOpen } from "lucide-react";

export const StudentDashboard = () => {
  const [stats, setStats] = useState({
    totalAttempts: 0,
    passedAttempts: 0,
    failedAttempts: 0,
    averageScore: "0.00",
    highestScore: "0.00",
  });
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/attempts");
      setAttempts(res.data);
      
      // Calculate stats locally from the attempts array
      const attemptsList = res.data;
      const total = attemptsList.length;
      
      if (total > 0) {
        const passed = attemptsList.filter(a => a.status === "PASSED").length;
        const avg = (attemptsList.reduce((sum, a) => sum + parseFloat(a.percentage), 0) / total).toFixed(2);
        const highest = Math.max(...attemptsList.map(a => parseFloat(a.percentage))).toFixed(2);
        
        setStats({
          totalAttempts: total,
          passedAttempts: passed,
          failedAttempts: total - passed,
          averageScore: avg,
          highestScore: highest,
        });
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status === "PASSED" 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-red-100 text-red-800 border-red-200";
  };

  // Format data for chart (Chronological score progression)
  const chartData = [...attempts]
    .reverse()
    .slice(-10) // Show last 10 attempts
    .map((attempt) => ({
      name: attempt.quizTitle.length > 12 ? `${attempt.quizTitle.substring(0, 12)}...` : attempt.quizTitle,
      score: parseFloat(attempt.percentage),
    }));

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">Student Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor your assessment progress, scores, and recent attempts</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
          {error}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Total Attempts */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Attempted</span>
                <span className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalAttempts}</span>
              </div>
            </div>

            {/* Quizzes Passed */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Passed</span>
                <span className="text-2xl font-bold text-slate-900 mt-0.5">{stats.passedAttempts}</span>
              </div>
            </div>

            {/* Average Score */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <BarChart2 className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg. Score</span>
                <span className="text-2xl font-bold text-slate-900 mt-0.5">{stats.averageScore}%</span>
              </div>
            </div>

            {/* Highest Score */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Award className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Best Score</span>
                <span className="text-2xl font-bold text-slate-900 mt-0.5">{stats.highestScore}%</span>
              </div>
            </div>

          </div>

          {/* Graph and Performance Summary */}
          {attempts.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Analytics Line Chart */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
                <h3 className="text-lg font-bold text-slate-900 font-display">Performance Progress (Last 10 Quizzes)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "8px" }}
                        labelStyle={{ fontWeight: "bold" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#4f46e5" 
                        strokeWidth={2.5} 
                        activeDot={{ r: 6 }} 
                        name="Score Percentage"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pass/Fail Ratio donut fallback */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
                <h3 className="text-lg font-bold text-slate-900 font-display">Ratio Analysis</h3>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: "Passed", count: stats.passedAttempts, fill: "#22c55e" },
                      { name: "Failed", count: stats.failedAttempts, fill: "#ef4444" }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {
                          [
                            { fill: "#22c55e" },
                            { fill: "#ef4444" }
                          ].map((entry, index) => (
                            <Bar key={`cell-${index}`} fill={entry.fill} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Historical Attempts Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900 font-display">Quiz Attempt History</h3>
            </div>
            
            {attempts.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                You haven't attempted any quizzes yet. Go to <Link to="/" className="text-indigo-600 font-semibold hover:underline">Discover</Link> to start one!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <th className="px-6 py-4">Quiz Name</th>
                      <th className="px-6 py-4">Attempt Date</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Time Taken</th>
                      <th className="px-6 py-4 text-right">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{attempt.quizTitle}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(attempt.startedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{attempt.percentage}%</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(attempt.status)}`}>
                            {attempt.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/attempts/${attempt.id}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            <span>Review Answers</span>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default StudentDashboard;

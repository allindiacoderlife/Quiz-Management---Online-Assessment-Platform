import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Users, BookOpen, HelpCircle, Award, CheckCircle2, ChevronRight } from "lucide-react";

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, attemptsRes] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/admin/attempts"),
      ]);
      setData(analyticsRes.data);
      setAttempts(attemptsRes.data.slice(0, 10)); // Show top 10 recent attempts
    } catch (err) {
      setError(err.message || "Failed to load admin dashboard statistics");
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
        {error || "Analytics details could not be found."}
      </div>
    );
  }

  // Formatting chart metrics
  const passedCount = data.passFailBreakdown.find((item) => item.status === "PASSED")?.count || 0;
  const failedCount = data.passFailBreakdown.find((item) => item.status === "FAILED")?.count || 0;

  const pieData = [
    { name: "Passed", value: passedCount },
    { name: "Failed", value: failedCount },
  ];
  const COLORS = ["#10b981", "#ef4444"];

  const popularQuizzesData = data.popularQuizzes.map((quiz) => ({
    name: quiz.quizTitle.length > 15 ? `${quiz.quizTitle.substring(0, 15)}...` : quiz.quizTitle,
    Attempts: quiz.attemptsCount,
  }));

  const getStatusColor = (status) => {
    return status === "PASSED" 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">Creator Control Center</h1>
        <p className="text-sm text-slate-500 mt-1">Review platform analytics, user accounts, and candidate scores</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Students */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5">{data.totalStudents}</span>
          </div>
        </div>

        {/* Quizzes */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quizzes</span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5">
              {data.quizzesBreakdown.reduce((sum, item) => sum + item.count, 0)}
            </span>
          </div>
        </div>

        {/* Questions count */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Questions</span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5">{data.totalQuestions}</span>
          </div>
        </div>

        {/* Attempts */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Award className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempts</span>
            <span className="text-2xl font-bold text-slate-900 mt-0.5">{data.totalAttempts}</span>
          </div>
        </div>

      </div>

      {/* Analytics Graphs */}
      {data.totalAttempts > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Top Quizzes Attempts bar chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-900 font-display">Most Popular Quizzes</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularQuizzesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="Attempts" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pass/Fail pie chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-900 font-display">Pass / Fail Ratio breakdown</h3>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 font-semibold text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                  <span>Passed ({passedCount})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500"></span>
                  <span>Failed ({failedCount})</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Recent Attempts Table across platform */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900 font-display">Recent Candidate Attempts</h3>
        </div>

        {attempts.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No quiz attempts have been made on the platform yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Quiz Name</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Time Taken</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{attempt.userName}</span>
                        <span className="text-xs text-slate-400">{attempt.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{attempt.quizTitle}</td>
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
                        to={`/attempts/${attempt.id}`} // Users detailed sheet review mapping path
                        className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        <span>Review Sheet</span>
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

    </div>
  );
};

export default AdminDashboard;

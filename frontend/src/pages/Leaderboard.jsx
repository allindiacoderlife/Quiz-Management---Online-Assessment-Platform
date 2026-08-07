import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import { useAuth } from "../context/auth.context.jsx";
import { Trophy, Medal, Award, Star, Users } from "lucide-react";

export const Leaderboard = () => {
  const { user: currentUser } = useAuth();
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/leaderboard");
      setRanks(res.data);
    } catch (err) {
      setError(err.message || "Failed to load leaderboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm border border-amber-200">
            <Trophy className="h-4 w-4" />
          </div>
        );
      case 1:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm border border-slate-200">
            <Medal className="h-4 w-4" />
          </div>
        );
      case 2:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-700 shadow-sm border border-amber-100">
            <Medal className="h-4 w-4" />
          </div>
        );
      default:
        return <span className="text-slate-500 font-bold text-sm w-8 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Header */}
      <div className="text-center py-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 shadow-md">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight font-display">Global Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          See the top performing students ranked by their average percentage score across completed assessments
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
          {error}
        </div>
      ) : ranks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-800">No Standings Yet</h3>
          <p className="mt-2 text-sm text-slate-500">Be the first to complete a quiz and claim rank #1!</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden max-w-4xl mx-auto w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="px-6 py-4 w-20 text-center">Rank</th>
                  <th className="px-6 py-4">Candidate Name</th>
                  <th className="px-6 py-4 text-center">Quizzes Taken</th>
                  <th className="px-6 py-4 text-center">Quizzes Passed</th>
                  <th className="px-6 py-4 text-right">Avg. Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ranks.map((rank, index) => {
                  const isSelf = currentUser && rank.userId === currentUser.id;
                  return (
                    <tr 
                      key={rank.userId} 
                      className={`transition-colors ${
                        isSelf 
                          ? "bg-indigo-50/40 hover:bg-indigo-50/60 font-semibold" 
                          : "hover:bg-slate-50/50"
                      }`}
                    >
                      <td className="px-6 py-4 flex justify-center">{getRankBadge(index)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-900 flex items-center gap-1.5 font-semibold">
                            <span>{rank.userName}</span>
                            {isSelf && (
                              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 tracking-wide">
                                YOU
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-400">{rank.userEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 text-sm font-semibold">{rank.quizzesAttempted}</td>
                      <td className="px-6 py-4 text-center text-slate-600 text-sm font-semibold">{rank.quizzesPassed}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-base font-extrabold text-slate-900 font-display">
                          {rank.averagePercentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Leaderboard;

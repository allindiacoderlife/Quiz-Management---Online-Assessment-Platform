import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import { Search, UserCheck, UserX, Trash2, Eye, X, BookOpen, Award, CheckCircle, Users, Plus, AlertCircle } from "lucide-react";

const generateTempPassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Detailed view states
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Add Student modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const handleOpenAddModal = () => {
    setAddName("");
    setAddEmail("");
    setAddPassword(generateTempPassword());
    setAddError("");
    setShowAddModal(true);
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword) return;

    setAddError("");
    setAdding(true);

    try {
      const res = await api.post("/users", {
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword,
        role: "STUDENT",
      });

      // Directly update the local state listing
      setUsers([res.data, ...users]);
      setShowAddModal(false);
    } catch (err) {
      setAddError(err.message || "Failed to register student");
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      // Filter out admins (we only manage STUDENT status in this table)
      setUsers(res.data.filter((u) => u.role === "STUDENT"));
    } catch (err) {
      setError(err.message || "Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.patch(`/users/${userId}/status`, { status: nextStatus });
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)));
      
      // Update selected profile view if open
      if (selectedUser && selectedUser.id === userId) {
        setUserProfileData((prev) => ({
          ...prev,
          user: { ...prev.user, status: nextStatus }
        }));
      }
    } catch (err) {
      alert(err.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this user? All their attempt history will be wiped.")) {
      return;
    }
    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(null);
      }
    } catch (err) {
      alert(err.message || "Failed to delete user");
    }
  };

  const handleViewProfile = async (user) => {
    setSelectedUser(user);
    setProfileLoading(true);
    try {
      const res = await api.get(`/users/${user.id}`);
      setUserProfileData(res.data);
    } catch (err) {
      alert(err.message || "Failed to load profile details");
      setSelectedUser(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">Student Management</h1>
          <p className="text-sm text-slate-500 mt-1">Search, monitor history, and toggle statuses for registered student accounts</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Student</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Search filters */}
      <div className="relative w-full max-w-md">
        <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search students by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-800">No Students Found</h3>
          <p className="mt-2 text-sm text-slate-500">Try matching filters or search queries</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Register Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        u.status === "ACTIVE"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {u.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2.5">
                      {/* View detailed profile */}
                      <button
                        onClick={() => handleViewProfile(u)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        title="View Detailed History"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>

                      {/* Toggle status */}
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`rounded-lg p-2 transition-colors ${
                          u.status === "ACTIVE"
                            ? "text-green-600 hover:bg-green-50"
                            : "text-slate-400 hover:bg-slate-100 hover:text-green-600"
                        }`}
                        title={u.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"}
                      >
                        {u.status === "ACTIVE" ? <UserCheck className="h-4.5 w-4.5" /> : <UserX className="h-4.5 w-4.5" />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User profile detailed view Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-display">Student Performance Profile</h3>
                <p className="text-xs text-slate-500 mt-0.5">Details for {selectedUser.name}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {profileLoading ? (
              <div className="flex justify-center py-10">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : userProfileData ? (
              <div className="flex flex-col gap-5 overflow-y-auto pr-1">
                {/* Stats row */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 p-4 flex flex-col items-center text-center">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Quizzes Taken</span>
                    <span className="text-xl font-bold text-slate-900 mt-1">{userProfileData.stats.totalAttempts}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 flex flex-col items-center text-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Quizzes Passed</span>
                    <span className="text-xl font-bold text-slate-900 mt-1">{userProfileData.stats.passedAttempts}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 flex flex-col items-center text-center">
                    <Award className="h-6 w-6 text-amber-600" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Average Percentage</span>
                    <span className="text-xl font-bold text-slate-900 mt-1">{userProfileData.stats.avgPercentage}%</span>
                  </div>
                </div>

                {/* History table */}
                <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                    <h4 className="font-display font-bold text-sm text-slate-900">Attempt Records</h4>
                  </div>
                  {userProfileData.attempts.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      This student has not made any quiz attempts.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-75">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                            <th className="px-4 py-3">Quiz Name</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3 text-center">Percentage</th>
                            <th className="px-4 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {userProfileData.attempts.map((attempt) => (
                            <tr key={attempt.id}>
                              <td className="px-4 py-3 font-semibold text-slate-800">{attempt.quizTitle}</td>
                              <td className="px-4 py-3 text-slate-500">
                                {new Date(attempt.startedAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-800">{attempt.percentage}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                                  attempt.status === "PASSED"
                                    ? "bg-green-50 text-green-700 border-green-100"
                                    : "bg-red-50 text-red-700 border-red-100"
                                }`}>
                                  {attempt.status.toLowerCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* Add Student Modal dialog popup */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-bold text-slate-900 font-display">Add New Student</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-semibold flex items-start gap-1.5 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddStudentSubmit} className="flex flex-col gap-4">
              
              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Student Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-850 focus:border-indigo-500 focus:outline-none"
                  required
                  disabled={adding}
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-850 focus:border-indigo-500 focus:outline-none"
                  required
                  disabled={adding}
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Temporary Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Temporary password"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-850 focus:border-indigo-500 focus:outline-none font-mono"
                    required
                    minLength={6}
                    disabled={adding}
                  />
                  <button
                    type="button"
                    onClick={() => setAddPassword(generateTempPassword())}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shrink-0"
                    disabled={adding}
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={adding}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !addName.trim() || !addEmail.trim() || !addPassword}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center"
                >
                  {adding ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    "Register Student"
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

export default AdminUsers;

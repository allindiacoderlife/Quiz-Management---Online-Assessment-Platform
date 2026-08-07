import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.context.jsx";
import api from "../services/api.js";
import { KeyRound, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export const ChangePassword = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/change-password", { newPassword });
      setSuccess(true);
      
      // Reload profile to fetch the updated user (mustChangePassword becomes false)
      await refreshUser();
      
      // Delay navigation slightly to show success message
      setTimeout(() => {
        if (user?.role === "ADMIN") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col gap-5">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-900">
            Secure Your Account
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            This is your first login. Please choose a new password to activate your account.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-650 font-semibold flex items-start gap-1.5 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs text-green-750 font-semibold flex items-start gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
            <span>Password updated successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="Choose a new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                required
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="Verify your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                required
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success || !newPassword || !confirmPassword}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              "Save & Continue"
            )}
          </button>

        </form>

      </div>
    </div>
  );
};

export default ChangePassword;

import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api.js";
import { KeyRound, Lock, ArrowLeft, Mail } from "lucide-react";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp || !newPassword) return;

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password. Check details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80svh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
          <KeyRound className="h-6 w-6" />
        </div>

        <h2 className="mt-4 text-center text-2xl font-bold text-slate-900 font-display">Reset Password</h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Verify your reset code and define your new credentials
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700 border border-green-100">
            Password reset successfully! Redirecting to sign in page...
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                required
                disabled={success}
              />
            </div>
          </div>

          {/* OTP Code */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reset Code (6 Digits)</label>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="rounded-lg border border-slate-200 px-4 py-3 text-center text-xl font-bold tracking-widest text-slate-900 placeholder-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              required
              disabled={success}
            />
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Password</label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                required
                disabled={success}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="mt-2 rounded-lg bg-indigo-600 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-400 transition-all flex items-center justify-center"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              "Save New Password"
            )}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

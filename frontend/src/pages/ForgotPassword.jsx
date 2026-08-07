import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { KeyRound, Mail, ArrowLeft } from "lucide-react";

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to submit request. Please verify your email.");
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
        
        <h2 className="mt-4 text-center text-2xl font-bold text-slate-900 font-display">Forgot Password?</h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Enter your email address and we'll send you a 6-digit reset code
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700 border border-green-100">
            Reset code sent! Redirecting to password reset page...
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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

          <button
            type="submit"
            disabled={loading || success}
            className="mt-2 rounded-lg bg-indigo-600 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-400 transition-all flex items-center justify-center"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              "Send Reset Code"
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

export default ForgotPassword;

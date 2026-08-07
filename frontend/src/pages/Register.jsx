import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.context.jsx";
import { UserPlus, Mail, Lock, User, KeyRound } from "lucide-react";

export const Register = () => {
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // States for handling OTP verification block
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setError("");
    setLoading(true);

    try {
      const res = await register(name, email, password, role);
      if (res.requireOtp) {
        setOtpEmail(res.data.email);
        setShowOtpScreen(true);
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setOtpError("Please enter a valid 6-digit code");
      return;
    }

    setOtpError("");
    setOtpLoading(true);

    try {
      const user = await verifyOtp(otpEmail, otpCode);
      navigate(user.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      setOtpError(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80svh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
        
        {/* OTP Verification Block */}
        {showOtpScreen ? (
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-center text-2xl font-bold text-slate-900">Verify Email</h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              We've sent a 6-digit verification code to <span className="font-semibold text-slate-800">{otpEmail}</span>.
            </p>

            {otpError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100">
                {otpError}
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-center text-xl font-bold tracking-widest text-slate-900 placeholder-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="mt-2 rounded-lg bg-indigo-600 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-400 transition-all flex items-center justify-center"
              >
                {otpLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  "Verify & Sign In"
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowOtpScreen(false)}
                className="text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Back to Sign Up
              </button>
            </form>
          </div>
        ) : (
          /* Registration Form Block */
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <UserPlus className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-center text-2xl font-bold text-slate-900">Create Account</h2>
            <p className="mt-1 text-center text-sm text-slate-500">
              Start building and taking quizzes today
            </p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
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
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Account Role */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">I want to register as a</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("STUDENT")}
                    className={`rounded-lg border py-3 text-sm font-semibold transition-all ${
                      role === "STUDENT"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Student / Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("ADMIN")}
                    className={`rounded-lg border py-3 text-sm font-semibold transition-all ${
                      role === "ADMIN"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Admin / Creator
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-lg bg-indigo-600 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-400 transition-all flex items-center justify-center"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Sign In
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Register;

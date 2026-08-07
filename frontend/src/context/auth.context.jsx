import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token is stored
  useEffect(() => {
    const token = localStorage.getItem("quiz_token");
    if (token) {
      loadMe();
    } else {
      setLoading(false);
    }
  }, []);

  const loadMe = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to load user profile:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      
      // If user requires email verification first (returns requireOtp)
      if (res.requireOtp) {
        return { requireOtp: true, email: res.data.email };
      }

      localStorage.setItem("quiz_token", res.token);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      throw err;
    }
  };

  const register = async (name, email, password, role = "STUDENT") => {
    try {
      const res = await api.post("/auth/register", { name, email, password, role });
      return res; // contains requireOtp: true, data: { email }
    } catch (err) {
      throw err;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      localStorage.setItem("quiz_token", res.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("quiz_token");
    setUser(null);
    setLoading(false);
  };

  const value = {
    user,
    loading,
    login,
    register,
    verifyOtp,
    logout,
    refreshUser: loadMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/auth.context.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Student / Public Pages
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import QuizDetails from "./pages/QuizDetails.jsx";
import QuizSession from "./pages/QuizSession.jsx";
import QuizResult from "./pages/QuizResult.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";

// Admin-Only Pages
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminCategories from "./pages/AdminCategories.jsx";
import AdminQuizzes from "./pages/AdminQuizzes.jsx";
import AdminQuestions from "./pages/AdminQuestions.jsx";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Student & Shared Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <Landing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quizzes/:id"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <QuizDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quizzes/:id/session"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <QuizSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attempts/:id"
              element={
                <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}>
                  <QuizResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />

            {/* Admin-Only Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quizzes"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminQuizzes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quizzes/:quizId/questions"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/questions"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <Navigate to="/admin/quizzes" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={<ChangePassword />}
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

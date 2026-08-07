import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth.context.jsx";

/**
 * Route protector checking authentication and role access
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] Optional list of allowed roles (e.g. ['ADMIN', 'STUDENT'])
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If Admin attempts to access student page, redirect to admin dashboard, and vice versa
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;

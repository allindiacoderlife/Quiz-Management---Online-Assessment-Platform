import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth.context.jsx";
import { 
  BookOpen, 
  BarChart2, 
  Users, 
  Folder, 
  Trophy, 
  LogOut, 
  User as UserIcon, 
  LayoutDashboard,
  Menu,
  X
} from "lucide-react";

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Define navigation links based on user role
  const getNavLinks = () => {
    if (!user || user.mustChangePassword) return [];
    
    if (user.role === "ADMIN") {
      return [
        { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
        { label: "Quizzes", path: "/admin/quizzes", icon: BookOpen },
        { label: "Categories", path: "/admin/categories", icon: Folder },
        { label: "Students", path: "/admin/users", icon: Users },
      ];
    } else {
      return [
        { label: "Discover", path: "/", icon: BookOpen },
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          {/* Logo */}
          <Link to={user?.role === "ADMIN" ? "/admin" : "/"} className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-indigo-600">
            <Trophy className="h-7 w-7 text-indigo-600" />
            <span>Quiz<span className="text-slate-900">Arena</span></span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Section */}
          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                  <span className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</span>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <UserIcon className="h-5 w-5" />
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-indigo-600">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && user && (
          <div className="border-t border-slate-200 bg-white p-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                      isActive(link.path)
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              <hr className="my-2 border-slate-200" />
              <div className="flex items-center justify-between p-2">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                  <span className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Page Area */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p>© {new Date().getFullYear()} QuizArena Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

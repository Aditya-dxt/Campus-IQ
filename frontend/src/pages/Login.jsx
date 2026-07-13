import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, LogIn, Sparkles, BookOpen, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={role === 'mentor' ? '/mentor' : '/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      if (user) {
        navigate(user.role === 'mentor' ? '/mentor' : '/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface-50">
      {/* ── Left: Form Panel ── */}
      <div
        className={`flex-1 flex items-center justify-center px-6 py-12 lg:px-16 transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
        }`}
      >
        <div className="w-full max-w-md space-y-8">
          {/* Logo / Brand */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-surface-800">CampusIQ</span>
            </div>
            <h1 className="text-4xl font-extrabold text-gradient leading-tight">Welcome Back</h1>
            <p className="mt-2 text-surface-500 text-base">Sign in to your CampusIQ account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2 animate-in">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-surface-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 bg-white text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-surface-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 bg-white text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Hint */}
          <div className="bg-surface-100 border border-surface-200 rounded-xl px-4 py-3 text-xs text-surface-500 space-y-1">
            <p className="font-semibold text-surface-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent-500" />
              Demo Credentials
            </p>
            <p>
              <span className="font-medium text-surface-600">Student:</span> aarav@campusiq.dev / password123
            </p>
            <p>
              <span className="font-medium text-surface-600">Mentor:</span> mentor@campusiq.dev / password123
            </p>
          </div>

          {/* Sign-up Link */}
          <p className="text-center text-sm text-surface-500">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700 transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right: Decorative Panel ── */}
      <div
        className={`hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary-500 via-accent-500 to-primary-700 items-center justify-center transition-all duration-1000 ease-out ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Floating Decorative Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-72 h-72 rounded-full bg-white/10 -top-20 -right-20 animate-float" />
          <div
            className="absolute w-48 h-48 rounded-full bg-white/10 bottom-32 -left-10 animate-float"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute w-32 h-32 rounded-full bg-white/5 top-1/3 right-1/4 animate-float"
            style={{ animationDelay: '4s' }}
          />
          <div
            className="absolute w-20 h-20 rounded-full bg-white/10 bottom-20 right-20 animate-float"
            style={{ animationDelay: '1s' }}
          />
          <div
            className="absolute w-56 h-56 rounded-full bg-white/5 top-10 left-1/3 animate-float"
            style={{ animationDelay: '3s' }}
          />
        </div>

        {/* Center Content */}
        <div className="relative z-10 text-center px-12 max-w-lg space-y-8">
          {/* Illustration Area */}
          <div className="mx-auto w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <BookOpen className="w-16 h-16 text-white" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white leading-snug">
              Your AI-Powered
              <br />
              Academic Copilot
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              Intelligent scheduling, smart mentorship, and data-driven insights — all in one beautifully crafted
              platform.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {['Smart Timetables', 'AI Mentor Match', 'Live Analytics'].map((feat) => (
              <span
                key={feat}
                className="px-4 py-1.5 rounded-full bg-white/20 text-white backdrop-blur-sm font-medium"
              >
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

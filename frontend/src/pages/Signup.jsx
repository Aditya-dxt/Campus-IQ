import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Loader2,
  UserPlus,
  GraduationCap,
  Users,
  Brain,
  Rocket,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const { signup, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
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

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific errors on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (error) setError('');
  };

  const validate = () => {
    const errors = {};

    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const user = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      if (user) {
        navigate(user.role === 'mentor' ? '/mentor' : '/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: 'student',
      label: 'Student',
      icon: GraduationCap,
      description: 'Access courses & AI tools',
    },
    {
      value: 'mentor',
      label: 'Mentor',
      icon: Users,
      description: 'Guide & manage students',
    },
  ];

  const InputField = ({ id, label, type = 'text', icon: Icon, placeholder, field, autoComplete }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-surface-700">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400 pointer-events-none" />
        <input
          id={id}
          type={type}
          value={form[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${
            fieldErrors[field]
              ? 'border-red-300 focus:ring-red-400'
              : 'border-surface-200 focus:ring-primary-500'
          }`}
        />
      </div>
      {fieldErrors[field] && (
        <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface-50">
      {/* ── Left: Decorative Panel (mirrored from Login) ── */}
      <div
        className={`hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary-500 via-accent-500 to-primary-700 items-center justify-center transition-all duration-1000 ease-out ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Floating Decorative Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-72 h-72 rounded-full bg-white/10 -top-20 -left-20 animate-float" />
          <div
            className="absolute w-48 h-48 rounded-full bg-white/10 bottom-32 -right-10 animate-float"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute w-32 h-32 rounded-full bg-white/5 top-1/3 left-1/4 animate-float"
            style={{ animationDelay: '4s' }}
          />
          <div
            className="absolute w-20 h-20 rounded-full bg-white/10 bottom-20 left-20 animate-float"
            style={{ animationDelay: '1s' }}
          />
          <div
            className="absolute w-56 h-56 rounded-full bg-white/5 top-10 right-1/3 animate-float"
            style={{ animationDelay: '3s' }}
          />
        </div>

        {/* Center Content */}
        <div className="relative z-10 text-center px-12 max-w-lg space-y-8">
          <div className="mx-auto w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Rocket className="w-16 h-16 text-white" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white leading-snug">
              Start Your
              <br />
              Academic Journey
            </h2>
            <p className="text-white/80 text-base leading-relaxed">
              Join thousands of students and mentors leveraging AI to transform their campus experience.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 text-left max-w-xs mx-auto">
            {[
              'Personalized AI study plans',
              'Smart mentor matching',
              'Real-time performance analytics',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-white/90">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div
        className={`flex-1 flex items-center justify-center px-6 py-12 lg:px-16 transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
        }`}
      >
        <div className="w-full max-w-md space-y-7">
          {/* Logo / Brand */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-surface-800">CampusIQ</span>
            </div>
            <h1 className="text-4xl font-extrabold text-gradient leading-tight">Create Account</h1>
            <p className="mt-2 text-surface-500 text-base">Join CampusIQ and supercharge your learning</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2 animate-in">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              id="name"
              label="Full Name"
              icon={User}
              placeholder="Aarav Sharma"
              field="name"
              autoComplete="name"
            />

            <InputField
              id="email"
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              field="email"
              autoComplete="email"
            />

            <InputField
              id="password"
              label="Password"
              type="password"
              icon={Lock}
              placeholder="Min 6 characters"
              field="password"
              autoComplete="new-password"
            />

            <InputField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              icon={Lock}
              placeholder="Re-enter your password"
              field="confirmPassword"
              autoComplete="new-password"
            />

            {/* Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(({ value, label, icon: RoleIcon, description }) => {
                  const isSelected = form.role === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleChange('role', value)}
                      className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-surface-200 bg-surface-100 hover:border-surface-300 hover:bg-surface-50'
                      }`}
                    >
                      <RoleIcon
                        className={`w-6 h-6 ${
                          isSelected ? 'text-primary-600' : 'text-surface-400'
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          isSelected ? 'text-primary-700' : 'text-surface-600'
                        }`}
                      >
                        {label}
                      </span>
                      <span
                        className={`text-xs ${
                          isSelected ? 'text-primary-500' : 'text-surface-400'
                        }`}
                      >
                        {description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-surface-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

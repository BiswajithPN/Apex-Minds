import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Briefcase, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function Login() {
  const navigate = useNavigate();
  const { login, homePath, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (isAuthenticated()) {
      const target = homePath();
      if (target) {
        navigate(target, { replace: true });
      }
    }
  }, [isAuthenticated, homePath, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      login(data.token, data.user);
      navigate(homePath(data.user.role), { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (!err.response) {
        setError('Cannot reach server. Please check your internet connection and try again.');
      } else if (status === 404) {
        setError('No account found with this email. Please sign up first.');
      } else if (status === 401) {
        setError('Incorrect password. Please verify your credentials and try again.');
      } else if (status === 429) {
        setError(msg || 'Too many failed login attempts. Account temporarily locked for 15 minutes.');
      } else if (status === 403) {
        setError('Your account has been deactivated. Please contact support.');
      } else {
        setError(msg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/google', {
        credential: credentialResponse.credential,
        isSignUp: false,
      });
      login(data.token, data.user);
      navigate(homePath(data.user.role), { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (!err.response) {
        setError('Cannot reach server. Please check your internet connection.');
      } else if (status === 404) {
        setError('No account found with this Google account. Please create an account first.');
      } else {
        setError(msg || 'Google login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 font-sans">
      {/* ── LEFT SIDE: Brand Hero Section ── */}
      <div className="bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#0d5c4d] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
            <Briefcase className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Hire<span className="text-emerald-400">Hub</span>
          </span>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 my-10 lg:my-0 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI-Driven Recruitment Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            AI-Powered <br />
            Recruitment <br />
            <span className="text-emerald-400">Made Simple</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-6">
            Connect with top local talent through intelligent matching, AI-driven resume analysis, and automated candidate shortlisting.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-10 border-t border-emerald-800/60 mt-10">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">10K+</p>
              <p className="text-xs text-emerald-300/80 font-medium mt-0.5">Active Jobs</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">50K+</p>
              <p className="text-xs text-emerald-300/80 font-medium mt-0.5">Job Seekers</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">95%</p>
              <p className="text-xs text-emerald-300/80 font-medium mt-0.5">Match Rate</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 hidden lg:block text-xs text-slate-400">
          © {new Date().getFullYear()} HireHub Inc. All rights reserved.
        </div>
      </div>

      {/* ── RIGHT SIDE: Sign In Section ── */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-colors shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0d806f] hover:bg-[#0a6b5d] active:bg-[#08564a] text-white font-medium text-sm rounded-lg shadow-md shadow-emerald-900/10 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Google OAuth Option */}
          {googleClientId && (
            <>
              <div className="relative flex items-center justify-center my-6">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider absolute">OR</span>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed. Please try again.')}
                  theme="outline"
                  shape="pill"
                  size="large"
                  text="continue_with"
                  width="320"
                />
              </div>
            </>
          )}

          <p className="text-center text-sm text-slate-500 mt-8">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Briefcase, Eye, EyeOff, AlertCircle, Sparkles, ShieldCheck, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function Login() {
  const navigate = useNavigate();
  const { login, homePath, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
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

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter admin email address.');
      return;
    }
    if (!password) {
      setError('Please enter admin password.');
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
      } else if (status === 403) {
        setError(msg || 'Email/password login is restricted to Admin accounts only. Regular users must sign in with Google.');
      } else if (status === 404) {
        setError('No account found with this email. Regular users must sign in with Google.');
      } else if (status === 401) {
        setError('Incorrect password. Please verify admin credentials.');
      } else if (status === 429) {
        setError(msg || 'Too many failed attempts. Admin account locked for 15 minutes.');
      } else {
        setError(msg || 'Admin login failed. Please try again.');
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

        {/* Logo */}
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

          {/* 1. Primary User Sign In (Google OAuth) */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4 mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mb-1">
              <UserCheck className="w-5 h-5" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                User Sign In
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Job Seekers & Employers must sign in via Google OAuth.
              </p>
            </div>

            {loading ? (
              <div className="py-2 flex justify-center items-center gap-2 text-emerald-700 text-sm font-semibold">
                <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : googleClientId ? (
              <div className="flex justify-center pt-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed.')}
                  theme="outline"
                  shape="pill"
                  size="large"
                  text="continue_with"
                  width="320"
                />
              </div>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Google OAuth Client ID is missing. Set VITE_GOOGLE_CLIENT_ID in Frontend .env.
              </p>
            )}
          </div>

          {/* 2. Admin Login Section (Password login restricted to Admin) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6 transition-all">
            <button
              type="button"
              onClick={() => setShowAdminForm(!showAdminForm)}
              className="w-full px-5 py-3.5 bg-slate-100/80 hover:bg-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Admin Login (Email / Password)</span>
              </span>
              {showAdminForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdminForm && (
              <form onSubmit={handleAdminLogin} className="p-5 bg-white space-y-4 border-t border-slate-200 animate-fade-in">
                <p className="text-xs text-slate-500 mb-2">
                  Password login is restricted strictly to verified Admin accounts.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Email</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@hirehub.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#0d806f] hover:bg-[#0a6b5d] active:bg-[#08564a] text-white font-semibold text-xs rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer uppercase tracking-wider"
                >
                  {loading ? 'Authenticating Admin...' : 'Sign In as Admin'}
                </button>
              </form>
            )}
          </div>

          {/* Create account link */}
          <p className="text-center text-sm text-slate-500 mt-6">
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

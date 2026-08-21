import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Briefcase, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';
import HireHubLogo from '../../components/ui/HireHubLogo';

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
      navigate(homePath(), { replace: true });
    }
  }, []);

  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', {
        email: cleanEmail,
        password,
      });

      login(data.token, data.user);
      navigate(homePath(data.user.role), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password. Please verify your credentials.'
      );
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
      setError(err.response?.data?.message || 'Account not found. Please create an account first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 font-sans bg-white">
      {/* LEFT COLUMN: Deep Emerald Branding Banner */}
      <div className="lg:col-span-6 bg-[#044e3f] text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden shrink-0">
        {/* Subtle decorative ambient glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo & Tag */}
        <div className="space-y-4 relative z-10">
          <HireHubLogo size="lg" textColor="text-white" accentColor="text-amber-400" />

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-800/70 border border-emerald-600/40 text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>AI-Driven Biasless Recruitment Engine</span>
          </div>
        </div>

        {/* Middle: Headline & Value Proposition */}
        <div className="my-6 lg:my-8 space-y-3 sm:space-y-4 relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight">
            AI-Powered <br />
            Recruitment <br />
            <span className="text-emerald-400">Made Simple</span>
          </h1>

          <p className="text-emerald-100/80 text-xs sm:text-sm lg:text-base max-w-md leading-relaxed font-medium">
            Connect with top verified talent through multi-criteria matching, explainable resume analysis, and automated candidate shortlisting.
          </p>
        </div>

        {/* Bottom: Metrics (Shown on tablets & desktops) */}
        <div className="pt-4 border-t border-emerald-800/60 relative z-10 hidden sm:block">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">10K+</p>
              <p className="text-[11px] sm:text-xs text-emerald-200/70 font-semibold mt-0.5">Active Jobs</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">50K+</p>
              <p className="text-[11px] sm:text-xs text-emerald-200/70 font-semibold mt-0.5">Job Seekers</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">95%</p>
              <p className="text-[11px] sm:text-xs text-emerald-200/70 font-semibold mt-0.5">Match Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean Sign-In Form */}
      <div className="lg:col-span-6 bg-white p-6 sm:p-10 lg:p-14 flex flex-col justify-center max-w-lg mx-auto w-full pb-20 lg:pb-14">
        <div className="space-y-5 sm:space-y-6 animate-fade-in">
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl font-bold animate-fade-in">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className="pt-1">
            <div className="flex justify-center">
              {googleClientId ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Authentication Failed.')}
                  useOneTap
                  theme="outline"
                  size="large"
                  shape="pill"
                  text="signin_with"
                  width="340"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setError('Google Client ID not configured. Please sign in with email below.')}
                  className="w-full py-3 px-4 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2.5 transition-colors shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Sign in with Google
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full py-3 px-4 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 font-medium transition-all shadow-2xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/change-password" className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 px-4 pr-11 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 font-medium transition-all shadow-2xs"
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

            {/* Sign In Primary CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Bottom link */}
          <p className="text-center text-xs sm:text-sm font-medium text-slate-500 pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="font-extrabold text-emerald-700 hover:text-emerald-800 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

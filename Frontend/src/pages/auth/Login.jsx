import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, ShieldCheck, Zap, Users, TrendingUp } from 'lucide-react';
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
      const { data } = await api.post('/auth/login', { email: cleanEmail, password });
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
    <div className="min-h-screen w-full bg-white font-sans flex flex-col lg:flex-row">

      {/* ── HERO BANNER (top on mobile, left column on desktop) ── */}
      <div className="bg-[#044e3f] text-white relative overflow-hidden
                      px-5 pt-8 pb-6
                      sm:px-8 sm:pt-10 sm:pb-8
                      lg:w-[45%] lg:min-h-screen lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14">

        {/* Ambient glow blobs */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo + badge */}
        <div className="relative z-10 flex flex-col gap-3">
          <HireHubLogo size="lg" textColor="text-white" accentColor="text-amber-400" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-600/40 text-emerald-300 text-[11px] font-bold uppercase tracking-wider w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            AI-Driven Biasless Recruitment
          </div>
        </div>

        {/* Headline — hidden on very small mobile to save space */}
        <div className="relative z-10 mt-5 mb-4 hidden sm:block lg:my-0 lg:flex-1 lg:flex lg:flex-col lg:justify-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.15] tracking-tight">
            AI-Powered <br />
            Recruitment <br />
            <span className="text-emerald-400">Made Simple</span>
          </h1>
          <p className="mt-3 text-emerald-100/75 text-sm lg:text-base max-w-sm leading-relaxed font-medium">
            Connect with top verified talent through multi-criteria matching and explainable resume analysis.
          </p>
        </div>

        {/* Stats row — only on sm+ screens */}
        <div className="relative z-10 pt-4 border-t border-emerald-800/50 hidden sm:grid grid-cols-3 gap-3">
          {[
            { icon: <TrendingUp className="w-4 h-4" />, val: '10K+', label: 'Active Jobs' },
            { icon: <Users className="w-4 h-4" />, val: '50K+', label: 'Job Seekers' },
            { icon: <Zap className="w-4 h-4" />, val: '95%', label: 'Match Rate' },
          ].map(({ icon, val, label }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <div className="text-emerald-400">{icon}</div>
              <p className="text-xl font-black text-white">{val}</p>
              <p className="text-[11px] text-emerald-200/70 font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FORM PANEL (below hero on mobile, right column on desktop) ── */}
      <div className="flex-1 flex items-center justify-center
                      px-5 py-8
                      sm:px-8 sm:py-10
                      lg:px-14 lg:py-14">
        <div className="w-full max-w-sm space-y-5">

          {/* Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Sign in to your account to continue</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-semibold">
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          <div className="flex justify-center">
            {googleClientId ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Authentication Failed.')}
                theme="outline"
                size="large"
                shape="pill"
                text="signin_with"
                width="320"
              />
            ) : (
              <button
                type="button"
                onClick={() => setError('Google Sign-In is not configured.')}
                className="w-full py-3 px-4 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2.5 transition-colors"
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

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full py-3 px-4 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/change-password" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
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
                  className="w-full py-3 px-4 pr-11 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition-all"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-extrabold text-emerald-700 hover:text-emerald-800">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

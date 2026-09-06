import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ShieldCheck, Sparkles, BarChart3, Users, LockKeyhole, Eye, EyeOff, Mail, AlertTriangle, Info } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

/** Map backend error codes / status → user-friendly UI config */
function parseLoginError(err) {
  const status  = err.response?.status;
  const message = err.response?.data?.message || '';
  const code    = err.response?.data?.code    || '';

  // Google-linked account — no password set
  if (code === 'no_password_set') {
    return {
      type: 'info',
      title: 'No password on this account',
      body: 'This account was created with Google. Use Google Sign-In below, or set a password first.',
      action: null,
    };
  }

  // Google-linked account — wrong password
  if (code === 'google_password_mismatch') {
    return {
      type: 'warning',
      title: 'Incorrect password',
      body: 'The password you entered is wrong for this account.',
      action: { label: 'Change Password', to: '/change-password' },
    };
  }

  // Locked out
  if (status === 429) {
    return {
      type: 'warning',
      title: 'Account temporarily locked',
      body: message || 'Too many failed attempts. Please wait 15 minutes before trying again.',
      action: null,
    };
  }

  // Deactivated
  if (status === 403) {
    return {
      type: 'danger',
      title: 'Account deactivated',
      body: 'Your account has been deactivated. Contact support to reactivate it.',
      action: null,
    };
  }

  // Wrong email or password (generic 401)
  if (status === 401) {
    return {
      type: 'danger',
      title: 'Incorrect email or password',
      body: 'Double-check your email and password and try again.',
      action: null,
    };
  }

  // Network / server error
  if (!err.response) {
    return {
      type: 'danger',
      title: 'Connection error',
      body: 'Could not reach the server. Check your internet connection.',
      action: null,
    };
  }

  // Fallback
  return {
    type: 'danger',
    title: 'Sign-in failed',
    body: message || 'Something went wrong. Please try again.',
    action: null,
  };
}

const ERROR_STYLES = {
  danger:  { wrap: 'bg-rose-50 border-rose-200',   icon: 'text-rose-500',   title: 'text-rose-800',   body: 'text-rose-700'   },
  warning: { wrap: 'bg-amber-50 border-amber-200', icon: 'text-amber-500', title: 'text-amber-800', body: 'text-amber-700' },
  info:    { wrap: 'bg-blue-50 border-blue-200',   icon: 'text-blue-500',   title: 'text-blue-800',   body: 'text-blue-700'   },
};

export default function Login() {
  const navigate = useNavigate();
  const { login, homePath, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null); // { type, title, body, action? }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const redirectIfAuthed = useCallback(() => {
    if (isAuthenticated()) navigate(homePath(), { replace: true });
  }, [isAuthenticated, homePath, navigate]);

  useEffect(() => { redirectIfAuthed(); }, [redirectIfAuthed]);

  /* ── response shape helper ── */
  const extractPayload = (d) => d;

  const finaliseLogin = async (rawData) => {
    const payload = rawData;
    let freshUser = payload.user;
    try {
      const { data: meRaw } = await api.get('/auth/me', {
        headers: { Authorization: 'Bearer ' + payload.token },
      });
      if (meRaw?.user) freshUser = meRaw.user;
    } catch (_) {}
    return { token: payload.token, user: freshUser };
  };

  /* ── unified sign-in ── */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      localStorage.removeItem('hirehub-auth');
      const { data } = await api.post('/auth/login', { email, password });
      const { token, user } = await finaliseLogin(data);
      login(token, user);
      navigate(homePath(user.role), { replace: true });
    } catch (err) {
      setError(parseLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── Google OAuth ── */
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError(null);
    try {
      localStorage.removeItem('hirehub-auth');
      const { data } = await api.post('/auth/google', { credential: credentialResponse.credential });
      const { token, user } = await finaliseLogin(data);
      login(token, user);
      navigate(homePath(user.role), { replace: true });
    } catch (err) {
      setError({ type: 'danger', title: 'Google sign-in failed', body: err.response?.data?.message || 'Please try again.' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const inputCls =
    'w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 ' +
    'placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 ' +
    'focus:ring-emerald-500/10 transition-all';

  return (
    <div className="min-h-screen w-full font-sans flex flex-col lg:flex-row overflow-hidden">

      {/* ══════════════ HERO PANEL — do not modify ══════════════ */}
      <div
        className="relative bg-gradient-to-br from-[#022a22] via-[#033d32] to-[#065f46] text-white overflow-hidden
                   px-5 py-6 sm:px-10 sm:pt-14 sm:pb-10
                   lg:w-[52%] lg:min-h-screen lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-12"
      >
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-400/[0.07] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal-300/[0.05] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-amber-400/[0.04] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-1.5">
            <img src="/Hirehub-logo.png" alt="HireHub" className="w-14 h-14 sm:w-16 sm:h-16 object-contain mix-blend-multiply" />
            <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
              Hire<span className="text-amber-400">Hub</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-8 lg:mt-0 lg:flex-1 lg:flex lg:flex-col lg:justify-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase tracking-[0.15em] mb-6 w-fit">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            Bias-Free Recruitment
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[2.8rem] font-black leading-[1.08] tracking-tight">
            <span className="text-white">Smart</span><br />
            <span className="text-white">Recruitment</span><br />
            <span className="text-white">Made Simple</span>
          </h1>
          <p className="mt-4 text-emerald-100/40 text-sm sm:text-base max-w-sm leading-relaxed">
            AI-powered resume screening with explainable scoring and zero bias.
          </p>
          <div className="flex flex-wrap gap-2 mt-6 sm:mt-8">
            {[
              { icon: <BarChart3 className="w-3.5 h-3.5" />, text: 'Multi-Criteria Scoring' },
              { icon: <Users className="w-3.5 h-3.5" />, text: 'Bias-Free Matching' },
              { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'AI-Powered Insights' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-emerald-100/60 text-[11px] font-semibold">
                {item.icon}{item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-8 lg:mt-0 hidden sm:flex items-center gap-8">
          <div><p className="text-2xl font-black text-white">98%</p><p className="text-[11px] text-emerald-100/40 font-semibold">Match Accuracy</p></div>
          <div className="w-px h-8 bg-white/10" />
          <div><p className="text-2xl font-black text-white">12+</p><p className="text-[11px] text-emerald-100/40 font-semibold">AI Score Criteria</p></div>
          <div className="w-px h-8 bg-white/10" />
          <div><p className="text-2xl font-black text-white">0 Bias</p><p className="text-[11px] text-emerald-100/40 font-semibold">EEOC Compliant</p></div>
        </div>
      </div>

      {/* ══════════════ FORM PANEL ══════════════ */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <img src="/Hirehub-logo.png" alt="HireHub" className="w-7 h-7 object-contain" />
            <span className="text-base font-black text-slate-900">Hire<span className="text-emerald-600">Hub</span></span>
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <h2 className="text-[1.6rem] font-bold text-slate-900 tracking-tight">Welcome to HireHub</h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Error banner — contextual with action link */}
          {error && (() => {
            const s = ERROR_STYLES[error.type] || ERROR_STYLES.danger;
            return (
              <div className={`mb-5 px-4 py-3 rounded-xl border ${s.wrap}`}>
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${s.icon}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${s.title}`}>{error.title}</p>
                    <p className={`text-xs mt-0.5 ${s.body}`}>{error.body}</p>
                    {error.action && (
                      <Link
                        to={error.action.to}
                        className={`inline-block mt-1.5 text-xs font-bold underline underline-offset-2 ${s.title}`}
                      >
                        {error.action.label} →
                      </Link>
                    )}
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className={`shrink-0 text-lg leading-none ${s.icon} hover:opacity-60`}
                    aria-label="Dismiss"
                  >×</button>
                </div>
              </div>
            );
          })()}

          {/* ── SIGN IN FORM ── */}
          <form onSubmit={handleSignIn} className="space-y-4 mb-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">Or continue with</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Google button — always uses custom button with inline SVG for reliable rendering */}
          <div className="flex justify-center mb-7">
            {googleClientId ? (
              <div className="relative">
                {/* Invisible GoogleLogin handles the actual OAuth flow */}
                <div className="opacity-0 absolute inset-0 w-full h-full z-10 overflow-hidden rounded-full cursor-pointer">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError({ type: 'danger', title: 'Google sign-in failed', body: 'Please try again or use email/password.' })}
                    prompt="select_account"
                    theme="outline"
                    size="large"
                    shape="circle"
                    type="icon"
                    width="44"
                  />
                </div>
                {/* Visible custom button */}
                <button
                  type="button"
                  className="w-11 h-11 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center transition-all shadow-sm pointer-events-none"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setError('Google Sign-In is not configured.')}
                className="w-11 h-11 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center transition-all shadow-sm"
                aria-label="Sign in with Google"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </button>
            )}
          </div>

          {/* Footer link */}
          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}

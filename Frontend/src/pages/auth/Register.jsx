import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  ShieldCheck,
  UserCheck,
  Briefcase,
  Sparkles,
  BarChart3,
  Users,
  LockKeyhole,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function Register() {
  const navigate = useNavigate();
  const { login, homePath, isAuthenticated } = useAuthStore();

  const [role, setRole] = useState('jobseeker');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const redirectIfAuthed = useCallback(() => {
    if (isAuthenticated()) navigate(homePath(), { replace: true });
  }, [isAuthenticated, homePath, navigate]);

  useEffect(() => { redirectIfAuthed(); }, [redirectIfAuthed]);

  const extractPayload = (d) => d;

  const finaliseLogin = async (rawData, token) => {
    const payload = rawData;
    const resolvedToken = token ?? payload.token;
    let freshUser = payload.user;
    try {
      const { data: meRaw } = await api.get('/auth/me', {
        headers: { Authorization: 'Bearer ' + resolvedToken },
      });
      if (meRaw?.user) freshUser = meRaw.user;
    } catch (_) {}
    return { token: resolvedToken, user: freshUser };
  };

  /* ── Email/Password Register ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      localStorage.removeItem('hirehub-auth');
      const { data } = await api.post('/auth/register', {
        full_name: fullName, email, password, role,
      });
      const { token, user } = await finaliseLogin(data);
      login(token, user);
      navigate(user.role === 'jobseeker' ? '/jobseeker/profile?onboarding=1' : homePath(user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── Google Sign-Up ── */
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');
    try {
      localStorage.removeItem('hirehub-auth');
      const { data } = await api.post('/auth/google', {
        credential: credentialResponse.credential, role, isSignUp: true,
      });
      const { token, user } = await finaliseLogin(data);
      login(token, user);
      navigate(user.role === 'jobseeker' ? '/jobseeker/profile?onboarding=1' : homePath(user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-up failed. Please try again.');
    } finally { setGoogleLoading(false); }
  };

  const inputCls =
    'w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 ' +
    'placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 ' +
    'focus:ring-emerald-500/10 transition-all';

  return (
    <div className="min-h-screen w-full font-sans flex flex-col lg:flex-row overflow-hidden">

      {/* ══════════════ HERO PANEL — unchanged ══════════════ */}
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
            Join thousands of professionals and employers using AI-powered hiring to find their perfect match.
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
          <div><p className="text-2xl font-black text-white">12+</p><p className="text-[11px] text-emerald-100/40 font-semibold">AI Scoring Criteria</p></div>
          <div className="w-px h-8 bg-white/10" />
          <div><p className="text-2xl font-black text-white">98%</p><p className="text-[11px] text-emerald-100/40 font-semibold">Match Accuracy</p></div>
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
          <div className="mb-6 text-center">
            <h2 className="text-[1.6rem] font-bold text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-500 mt-1.5">Join HireHub and start your journey</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Role picker */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">I am a</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { value: 'jobseeker', label: 'Job Seeker', sub: 'Find jobs with AI', icon: <UserCheck className="w-4 h-4" /> },
                { value: 'employer', label: 'Employer', sub: 'Hire top talent', icon: <Briefcase className="w-4 h-4" /> },
              ].map((r) => (
                <button
                  key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    role === r.value
                      ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${role === r.value ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {r.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-800 leading-tight">{r.label}</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">{r.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── REGISTER FORM — always visible, no accordion ── */}
          <form onSubmit={handleRegister} className="space-y-4 mb-5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base leading-none">👤</span>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  autoComplete="name"
                  className={inputCls}
                />
              </div>
            </div>

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
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
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
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</>
                : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">Or continue with</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Google button — visible SVG icon, invisible GoogleLogin overlay handles OAuth */}
          <div className="flex justify-center mb-7">
            {googleClientId ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Authentication Failed.')}
                prompt="select_account"
                theme="outline"
                size="large"
                shape="pill"
                text="signup_with"
                locale="en"
              />
            ) : (
              <p className="text-xs text-slate-400">Google Sign-In not configured.</p>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}

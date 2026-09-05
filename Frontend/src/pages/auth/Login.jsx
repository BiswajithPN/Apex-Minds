import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ShieldCheck, Sparkles, BarChart3, Users, LockKeyhole, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function Login() {
  const navigate = useNavigate();
  const { login, homePath, isAuthenticated } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(homePath(), { replace: true });
    }
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      localStorage.removeItem('hirehub-auth');

      // Step 1: Authenticate with backend
      const { data } = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });

      // Step 2: Fetch fresh user data
      let freshUser = data.user;
      try {
        const { data: meData } = await api.get('/auth/me', {
          headers: { Authorization: 'Bearer ' + data.token },
        });
        if (meData?.user) freshUser = meData.user;
      } catch (_) { }

      login(data.token, freshUser);
      navigate(homePath(freshUser.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setError('');
    try {
      localStorage.removeItem('hirehub-auth');
      const { data } = await api.post('/auth/admin-login', {
        email: adminEmail,
        password: adminPassword,
        adminPass,
      });
      let freshUser = data.user;
      try {
        const { data: meData } = await api.get('/auth/me', {
          headers: { Authorization: 'Bearer ' + data.token },
        });
        if (meData?.user) freshUser = meData.user;
      } catch (_) {}
      login(data.token, freshUser);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed. Check Admin Pass.');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white font-sans flex flex-col lg:flex-row overflow-hidden">
      {/* ── HERO PANEL ── */}
      <div
        className="relative bg-gradient-to-br from-[#022a22] via-[#033d32] to-[#065f46] text-white overflow-hidden
                      px-5 py-6 sm:px-10 sm:pt-14 sm:pb-10
                      lg:w-[48%] lg:min-h-screen lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-12"
      >
        {/* Decorative blurs */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-400/[0.07] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal-300/[0.05] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-amber-400/[0.04] rounded-full blur-[80px] pointer-events-none" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-1.5">
            <img src="/Hirehub-logo.png" alt="HireHub" className="w-14 h-14 sm:w-16 sm:h-16 object-contain mix-blend-multiply" />
            <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
              Hire<span className="text-amber-400">Hub</span>
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 mt-8 lg:mt-0 lg:flex-1 lg:flex lg:flex-col lg:justify-center lg:my-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase tracking-[0.15em] mb-6 w-fit">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            Bias-Free Recruitment
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-[2.8rem] font-black leading-[1.08] tracking-tight">
            <span className="text-white">Smart</span>
            <br />
            <span className="text-white">Recruitment</span>
            <br />
            <span className="text-white">Made Simple</span>
          </h1>
          <p className="mt-4 text-emerald-100/40 text-sm sm:text-base max-w-sm leading-relaxed">
            AI-powered resume screening with explainable scoring and zero bias.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-6 sm:mt-8">
            {[
              { icon: <BarChart3 className="w-3.5 h-3.5" />, text: 'Multi-Criteria Scoring' },
              { icon: <Users className="w-3.5 h-3.5" />, text: 'Bias-Free Matching' },
              { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'AI-Powered Insights' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-emerald-100/60 text-[11px] font-semibold"
              >
                {item.icon}
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Footer stats */}
        <div className="relative z-10 mt-8 lg:mt-0 hidden sm:flex items-center gap-8">
          <div>
            <p className="text-2xl font-black text-white">98%</p>
            <p className="text-[11px] text-emerald-100/40 font-semibold">Accuracy Rate</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-2xl font-black text-white">0.8s</p>
            <p className="text-[11px] text-emerald-100/40 font-semibold">Avg. Latency</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-2xl font-black text-white">EEOC</p>
            <p className="text-[11px] text-emerald-100/40 font-semibold">Compliant</p>
          </div>
        </div>
      </div>

      {/* ── FORM PANEL ── */}
      <div
        className="flex-1 flex items-center justify-center relative
                      px-6 py-10
                      sm:px-10 sm:py-12
                      lg:px-16 lg:py-14"
      >
        {/* Subtle bg pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #033d32 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="w-full max-w-full sm:max-w-[380px] space-y-8 relative z-10">
          {/* Heading */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 font-medium mt-2">Sign in with Google to continue to your dashboard</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl font-semibold flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Only */}
          <div>
            {googleClientId ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  prompt="select_account"
                  onError={() => setError('Google Authentication Failed.')}
                  theme="outline"
                  size="large"
                  shape="pill"
                  text="signin_with"
                  width="100%"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setError('Google Sign-In is not configured.')}
                className="w-full py-3.5 px-5 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <span className="relative bg-white px-3 text-xs font-bold text-slate-400 tracking-widest">OR</span>
          </div>

          {/* Admin Login Pass — ONLY on Sign In page to validate Admin Dashboard */}
          <div className="rounded-2xl border-2 border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdminMode(!isAdminMode)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-black text-slate-800">
                <span className="p-1.5 rounded-lg bg-slate-900 text-white"><ShieldAlert className="w-4 h-4" /></span>
                Admin Login Pass
                <span className="text-[10px] font-bold tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">ONLY ON SIGN IN</span>
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${isAdminMode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                {isAdminMode ? 'Hide' : 'Show'}
              </span>
            </button>

            {isAdminMode && (
              <form onSubmit={handleAdminLogin} className="p-4 space-y-3 bg-white border-t border-slate-200 animate-fade-in">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <LockKeyhole className="w-3.5 h-3.5 text-slate-400" />
                  Validate admin dashboard with Admin Pass. Not shown on Sign Up.
                </p>
                <div>
                  <label className="text-xs font-bold text-slate-700">Admin Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@hirehub.com"
                    required={isAdminMode}
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Admin Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    required={isAdminMode}
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <LockKeyhole className="w-3 h-3" /> Login Pass (Admin Pass)
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      placeholder="Enter Admin Pass"
                      required={isAdminMode}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border-2 border-amber-200 bg-amber-50/50 focus:border-amber-400 focus:outline-none text-sm font-bold tracking-wide"
                    />
                    <button type="button" onClick={() => setShowAdminPass(!showAdminPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Hint (dev): <span className="font-mono font-bold text-slate-600">HireHubAdmin@2026</span> or set ADMIN_PASS env</p>
                </div>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-black tracking-wide transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {adminLoading ? 'Validating…' : <><ShieldCheck className="w-4 h-4" /> Validate & Go to Admin Dashboard</>}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500 pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="font-extrabold text-emerald-600 hover:text-emerald-700 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

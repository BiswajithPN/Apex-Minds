import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { User, Building2, Eye, EyeOff, ShieldCheck, Zap, Users, TrendingUp } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';
import HireHubLogo from '../../components/ui/HireHubLogo';

export default function Register() {
  const navigate = useNavigate();
  const { login, isAuthenticated, homePath } = useAuthStore();
  const [role, setRole] = useState('jobseeker');
  const [fullName, setFullName] = useState('');
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

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', { full_name: fullName, email, password, role });
      login(data.token, data.user);
      if (data.user.role === 'jobseeker') {
        navigate('/jobseeker/profile?onboarding=1', { replace: true });
      } else {
        navigate(homePath(data.user.role), { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
        role,
        isSignUp: true,
      });
      login(data.token, data.user);
      if (data.user.role === 'jobseeker') {
        navigate('/jobseeker/profile?onboarding=1', { replace: true });
      } else {
        navigate(homePath(data.user.role), { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google registration failed. Please try with email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white font-sans flex flex-col lg:flex-row">

      {/* ── HERO BANNER ── */}
      <div className="bg-[#044e3f] text-white relative overflow-hidden
                      px-5 pt-8 pb-6
                      sm:px-8 sm:pt-10 sm:pb-8
                      lg:w-[45%] lg:min-h-screen lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14">

        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo + badge */}
        <div className="relative z-10 flex flex-col gap-3">
          <HireHubLogo size="lg" textColor="text-white" accentColor="text-amber-400" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-600/40 text-emerald-300 text-[11px] font-bold uppercase tracking-wider w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Bias-Free Recruitment
          </div>
        </div>

        {/* Headline — hidden on small mobile */}
        <div className="relative z-10 mt-5 mb-4 hidden sm:block lg:my-0 lg:flex-1 lg:flex lg:flex-col lg:justify-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.15] tracking-tight">
            <span className="text-emerald-400">Start Your</span> <br />
            <span className="text-emerald-400">Career Journey</span> <br />
            <span className="text-emerald-400">Today</span>
          </h1>
          <p className="mt-3 text-emerald-100/75 text-sm lg:text-base max-w-sm leading-relaxed font-medium">
            Get instant resume match scoring, personalized job recommendations, and seamless application tracking.
          </p>
        </div>

        {/* Stats row removed per user request */}
      </div>

      {/* ── FORM PANEL ── */}
      <div className="flex-1 flex items-start justify-center
                      px-5 py-8
                      sm:px-8 sm:py-10
                      lg:items-center lg:px-14 lg:py-14">
        <div className="w-full max-w-sm space-y-4">

          {/* Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create account</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Select your role &amp; sign up</p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-semibold">
              {error}
            </div>
          )}

          {/* Role picker */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { value: 'jobseeker', icon: <User className="w-3.5 h-3.5" />, label: 'Job Seeker', sub: 'Find jobs with AI scores' },
              { value: 'employer', icon: <Building2 className="w-3.5 h-3.5" />, label: 'Employer', sub: 'Hire pre-screened talent' },
            ].map(({ value, icon, label, sub }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  role === value
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`p-1 rounded-lg ${role === value ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {icon}
                  </div>
                  <span className="font-extrabold text-xs text-slate-900">{label}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold leading-tight">{sub}</p>
              </button>
            ))}
          </div>

          {/* Google Sign-Up */}
          <div className="flex justify-center">
            {googleClientId ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Authentication Failed.')}
                theme="outline"
                size="large"
                shape="pill"
                text="signup_with"
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
                Sign up with Google
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailRegister} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alexander Hamilton"
                className="w-full py-3 px-4 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Email Address
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

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Password <span className="text-slate-400 normal-case font-semibold">(min. 8 characters)</span>
              </label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Creating account…' : `Sign Up as ${role === 'employer' ? 'Employer' : 'Job Seeker'}`}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500 pb-6 lg:pb-0">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-emerald-700 hover:text-emerald-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

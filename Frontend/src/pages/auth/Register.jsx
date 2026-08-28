import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { User, Building2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

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
      setError(err.response?.data?.message || 'Google registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white font-sans flex flex-col lg:flex-row">

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-br from-[#033d32] via-[#044e3f] to-[#065f46] text-white relative overflow-hidden
                      px-5 py-6 sm:px-10 sm:pt-12 sm:pb-10
                      lg:w-[45%] lg:min-h-screen lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14">

        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-400/8 rounded-full blur-3xl pointer-events-none" />

        {/* Logo + badge */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#2d7a6a] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-white">Hire<span className="text-amber-400">Hub</span></span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/25 text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            Bias-Free Recruitment
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 mt-4 lg:mt-6 lg:my-0 lg:flex-1 lg:flex lg:flex-col lg:justify-center">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight text-white">
            Start Your <span className="text-white">Career Journey</span>
          </h1>
          <p className="mt-2 text-emerald-100/50 text-xs sm:text-sm lg:text-base max-w-sm leading-relaxed">
            AI-powered resume screening with explainable scoring and zero bias.
          </p>
        </div>

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
            <p className="text-sm text-slate-500 font-medium mt-1">Select your role & sign up</p>
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
                onClick={() => setError('Google Sign-Up is not configured.')}
                className="w-full py-3 px-4 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2.5 transition-colors"
              >
                Sign up with Google
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email / Password form */}
          <form onSubmit={async (e) => {
            e.preventDefault();
            const trimmedName = fullName.trim();
            const trimmedEmail = email.trim();
            if (!trimmedName || !trimmedEmail || !password) {
              setError('Please fill in all fields.');
              return;
            }
            if (password.length < 8) {
              setError('Password must be at least 8 characters.');
              return;
            }
            setLoading(true);
            setError('');
            try {
              const { data } = await api.post('/auth/register', {
                full_name: trimmedName,
                email: trimmedEmail,
                password,
                role,
              });
              login(data.token, data.user);
              if (role === 'jobseeker') {
                navigate('/jobseeker/profile?onboarding=1', { replace: true });
              } else {
                navigate(homePath(data.user.role), { replace: true });
              }
            } catch (err) {
              setError(err.response?.data?.message || 'Registration failed. Please try again.');
            } finally {
              setLoading(false);
            }
          }} className="space-y-3">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full py-3 px-4 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email address</label>
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
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password (min. 8 characters)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 px-4 pr-11 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
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
              {loading ? 'Creating account…' : 'Create Account'}
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

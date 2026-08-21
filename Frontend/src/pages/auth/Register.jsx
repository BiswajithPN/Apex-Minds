import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Briefcase, User, Building2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
      const { data } = await api.post('/auth/register', {
        full_name: fullName,
        email,
        password,
        role,
      });
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
            Start Your <br />
            Career Journey <br />
            <span className="text-emerald-400">With AI Match</span>
          </h1>

          <p className="text-emerald-100/80 text-xs sm:text-sm lg:text-base max-w-md leading-relaxed font-medium">
            Create an account to get instant AI resume match scoring, personalized job recommendations, and seamless application tracking.
          </p>
        </div>

        {/* Bottom: Metrics (Shown on tablets and desktops) */}
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

      {/* RIGHT COLUMN: Role Selection & Sign-Up Form */}
      <div className="lg:col-span-6 bg-white p-6 sm:p-10 lg:p-14 flex flex-col justify-center max-w-lg mx-auto w-full pb-20 lg:pb-14">
        <div className="space-y-5 animate-fade-in">
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Create account</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Select your role & sign up with Google or Email
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl font-bold animate-fade-in">
              {error}
            </div>
          )}

          {/* Role Selection Cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('jobseeker')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                role === 'jobseeker'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1 rounded-lg ${role === 'jobseeker' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-xs sm:text-sm text-slate-900">Job Seeker</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold leading-tight">
                Find jobs with AI match scores
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                role === 'employer'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1 rounded-lg ${role === 'employer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-xs sm:text-sm text-slate-900">Employer</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold leading-tight">
                Hire top pre-screened talent
              </p>
            </button>
          </div>

          {/* Google Sign-In / Sign-Up Button */}
          <div className="pt-1">
            <div className="flex justify-center">
              {googleClientId ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Authentication Failed.')}
                  theme="outline"
                  size="large"
                  shape="pill"
                  text="signup_with"
                  width="340"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setError('Google Client ID not configured. Please register with email below.')}
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

          {/* Email / Password Registration Form */}
          <form onSubmit={handleEmailRegister} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alexander Hamilton"
                className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-medium transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-medium transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-2.5 px-3.5 pr-11 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-medium transition-all shadow-2xs"
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
              className="w-full py-3.5 px-6 bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? 'Creating account...' : `Sign Up as ${role === 'employer' ? 'Employer' : 'Job Seeker'}`}
            </button>
          </form>

          {/* Bottom link */}
          <p className="text-center text-xs sm:text-sm font-medium text-slate-500 pt-1">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-emerald-700 hover:text-emerald-800 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

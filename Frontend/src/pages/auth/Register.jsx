import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Briefcase, UserCircle, Building2, Eye, EyeOff, AlertCircle, Sparkles, Check, X } from 'lucide-react';
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

  // Password validation checks
  const isMinLength = password.length >= 8;
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordValid = isMinLength && hasNumberOrSpecial;

  useEffect(() => {
    if (isAuthenticated()) {
      const target = homePath();
      if (target) {
        navigate(target, { replace: true });
      }
    }
  }, [isAuthenticated, homePath, navigate]);

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (!isMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!hasNumberOrSpecial) {
      setError('Password must contain at least one number or special character.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
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
      const msg = err.response?.data?.message;
      const status = err.response?.status;
      if (status === 400 && msg) {
        setError(msg);
      } else if (status === 422 || status === 400) {
        setError('Please check your registration details and try again.');
      } else if (!err.response) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        setError(msg || 'Registration failed. Please try again.');
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
      const msg = err.response?.data?.message;
      if (msg) {
        setError(msg);
      } else if (!err.response) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        setError('Google sign-up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: 'jobseeker',
      label: 'Job Seeker',
      description: 'Find jobs with AI match scores',
      icon: UserCircle,
    },
    {
      value: 'employer',
      label: 'Employer',
      description: 'Hire top pre-screened talent',
      icon: Building2,
    },
  ];

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
            <span>Join 50,000+ Job Seekers & Employers</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Start Your <br />
            Career Journey <br />
            <span className="text-emerald-400">With AI Match</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mt-6">
            Create an account to get instant AI resume match scoring, personalized job recommendations, and seamless application tracking.
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

      {/* ── RIGHT SIDE: Register Form Section ── */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Create account
            </h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Select your role & enter details to get started
            </p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setRole(r.value);
                    setError('');
                  }}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center cursor-pointer
                    ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <p className={`font-bold text-xs ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                    {r.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{r.description}</p>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {googleClientId && (
            <div className="mt-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-center my-4">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider absolute">
                  SIGN UP WITH GOOGLE
                </span>
              </div>
              <div className="flex justify-center pt-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-up failed.')}
                  theme="outline"
                  shape="pill"
                  size="large"
                  text="signup_with"
                  width="320"
                />
              </div>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

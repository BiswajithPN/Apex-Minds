import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Briefcase, UserCircle, Building2, Mail, Lock, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';
import Button from '../../components/ui/Button';

export default function Register() {
  const navigate = useNavigate();
  const { login, isAuthenticated, homePath } = useAuthStore();
  const [role, setRole] = useState('jobseeker');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      // isSignUp: true -> registers new user with role or returns error if account exists
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
      setError(err.response?.data?.message || 'Google registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: 'jobseeker',
      label: 'Job Seeker',
      description: 'Find your dream job with AI matching',
      icon: UserCircle,
    },
    {
      value: 'employer',
      label: 'Employer',
      description: 'Hire top talent powered by AI',
      icon: Building2,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-950 via-accent-900 to-accent-800 relative overflow-hidden p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in my-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-8 sm:p-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-accent shadow-lg shadow-accent-500/30 mb-4">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Join Hire<span className="text-accent-500">Hub</span>
            </h1>
            <p className="text-slate-500 mt-2 text-sm">Choose your role & create your account</p>
          </div>

          {/* Role selector */}
          <div className="space-y-3 mb-6">
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
                    w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all duration-200 text-left
                    ${
                      isSelected
                        ? 'border-accent-500 bg-accent-50 shadow-md shadow-accent-500/10'
                        : 'border-slate-200 hover:border-accent-300 hover:bg-slate-50'
                    }
                  `}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'gradient-accent shadow-sm shadow-accent-500/20'
                        : 'bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p
                      className={`font-semibold text-sm ${
                        isSelected ? 'text-accent-700' : 'text-slate-700'
                      }`}
                    >
                      {r.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-xl animate-fade-in font-medium">
              {error}
            </div>
          )}

          {/* Email / Password Registration Form */}
          <form onSubmit={handleEmailRegister} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 uppercase font-semibold absolute">OR</span>
          </div>

          {/* Google OAuth Button */}
          {googleClientId && (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-up failed. Please try again.')}
                theme="outline"
                shape="pill"
                size="large"
                text="signup_with"
                width="320"
              />
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-accent-600 hover:text-accent-700 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

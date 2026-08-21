import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Briefcase, Mail, Lock, Sparkles, User, Shield, Building2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';
import Button from '../../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login, homePath, isAuthenticated } = useAuthStore();
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

  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter both email and password.');
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
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // One-click quick login for demo and testing
  const handleQuickLogin = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    setError('');
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
      setError(err.response?.data?.message || 'No account found. Please sign up first.');
    } finally {
      setLoading(false);
    }
  };

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
              Welcome to Hire<span className="text-accent-500">Hub</span>
            </h1>
            <p className="text-slate-500 mt-1.5 text-xs">
              AI-powered job marketplace & bias-aware resume screener
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-danger-50 border border-danger-200 text-danger-700 text-xs rounded-xl animate-fade-in font-medium">
              {error}
            </div>
          )}

          {/* Quick Demo Fill Buttons */}
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent-500" />
              Quick Demo Login:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('employer@hirehub.com')}
                className="py-1.5 px-2 bg-white hover:bg-accent-50 text-slate-700 hover:text-accent-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-2xs"
              >
                <Building2 className="w-3.5 h-3.5 text-accent-600" />
                Employer
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('jobseeker@hirehub.com')}
                className="py-1.5 px-2 bg-white hover:bg-accent-50 text-slate-700 hover:text-accent-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-2xs"
              >
                <User className="w-3.5 h-3.5 text-accent-600" />
                Job Seeker
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@hirehub.com')}
                className="py-1.5 px-2 bg-white hover:bg-accent-50 text-slate-700 hover:text-accent-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-2xs"
              >
                <Shield className="w-3.5 h-3.5 text-accent-600" />
                Admin
              </button>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full font-bold shadow-md shadow-accent-500/20">
              Sign In
            </Button>
          </form>

          {/* Google OAuth (only if configured) */}
          {googleClientId && (
            <>
              <div className="relative flex items-center justify-center my-6">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs text-slate-400 uppercase font-semibold absolute">OR</span>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed. Please try again.')}
                  theme="outline"
                  shape="pill"
                  size="large"
                  text="continue_with"
                  width="320"
                />
              </div>
            </>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-accent-600 hover:text-accent-700 transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

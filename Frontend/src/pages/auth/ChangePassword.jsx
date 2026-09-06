import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { KeyRound, ArrowLeft, Eye, EyeOff, ShieldCheck, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { homePath, role, user, fetchCurrentUser } = useAuthStore();

  const [success, setSuccess]           = useState(false);
  const [serverError, setServerError]   = useState('');
  const [hasPassword, setHasPassword]   = useState(null); // null = loading
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // Google re-auth flow state
  const [useGoogleVerify, setUseGoogleVerify] = useState(false);
  const [googleVerified, setGoogleVerified]   = useState(false);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [googleError, setGoogleError]         = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleUser   = !!user?.google_id;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  // Fetch fresh /me to know if password is set
  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const u = data?.user ?? data;
        setHasPassword(u?.has_password === true);
      } catch {
        setHasPassword(user?.has_password === true);
      }
    };
    check();
  }, []);

  // True only when Google user has NEVER set a password → skip current-password field
  const isSettingFirstPassword = hasPassword === false && isGoogleUser;

  // ── Normal password change ───────────────────────────────────────────────
  const onSubmit = async (formData) => {
    setServerError('');
    try {
      if (useGoogleVerify && googleCredential) {
        // Path A: Google-verified reset (no current password needed)
        await api.post('/auth/reset-password-with-google', {
          credential: googleCredential,
          newPassword: formData.newPassword,
        });
      } else {
        // Path B: Normal change (requires current password unless first-time set)
        await api.post('/auth/change-password', {
          currentPassword: isSettingFirstPassword ? undefined : formData.currentPassword,
          newPassword: formData.newPassword,
        });
      }
      setSuccess(true);
      reset();
      setGoogleVerified(false);
      setGoogleCredential(null);
      setUseGoogleVerify(false);
      await fetchCurrentUser();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password. Please try again.';
      // If it's an account mismatch from the backend, show it in the Google section
      if (useGoogleVerify && (msg.includes('mismatch') || msg.includes('does not match') || err.response?.status === 403)) {
        setGoogleVerified(false);
        setGoogleCredential(null);
        setGoogleError(msg);
      } else {
        setServerError(msg);
      }
    }
  };

  // ── Google re-auth callback ──────────────────────────────────────────────
  const handleGoogleVerify = (credentialResponse) => {
    setGoogleError('');

    // Frontend pre-check: decode the Google JWT and verify the email matches
    // the currently logged-in user BEFORE sending to the backend.
    // This gives instant feedback if the wrong Google account was selected.
    try {
      // Google's ID token is a JWT — we can decode the payload (middle segment) safely
      // We're not verifying the signature here (backend does that); just reading the claim.
      const parts = credentialResponse.credential.split('.');
      const tokenPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const chosenEmail = tokenPayload.email?.toLowerCase();
      const myEmail = user?.email?.toLowerCase();

      if (chosenEmail && myEmail && chosenEmail !== myEmail) {
        setGoogleError(
          `Wrong account selected. You chose "${chosenEmail}" but you're logged in as "${myEmail}". Please select the correct Google account.`
        );
        return; // Don't proceed
      }
    } catch {
      // If decode fails, let backend handle it
    }

    setGoogleCredential(credentialResponse.credential);
    setGoogleVerified(true);
  };

  const inputCls =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow';

  const title = isSettingFirstPassword
    ? 'Set Password'
    : useGoogleVerify
      ? 'Reset via Google'
      : 'Change Password';

  const subtitle = isSettingFirstPassword
    ? 'Set a password so you can also sign in with your email'
    : useGoogleVerify
      ? 'Verify with Google to set a new password without your current one'
      : 'Update your account password';

  return (
    <div className="min-h-screen bg-[#f8fafb] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Back */}
        <button
          onClick={() => navigate(homePath(role))}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-accent-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <Card padding="lg">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-100 mb-3">
              {useGoogleVerify
                ? <ShieldCheck className="w-6 h-6 text-accent-600" />
                : <KeyRound className="w-6 h-6 text-accent-600" />
              }
            </div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">
              ✓ {isSettingFirstPassword
                ? 'Password set! You can now sign in with email.'
                : 'Password updated successfully!'}
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
              {serverError}
            </div>
          )}

          {/* Loading */}
          {hasPassword === null ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── Info banner for Google users with a password ── */}
              {isGoogleUser && hasPassword && !useGoogleVerify && (
                <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                  <div>
                    <p className="font-semibold">Don&apos;t know your current password?</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Since you signed up with Google, you can verify your identity with Google instead.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setUseGoogleVerify(true); setServerError(''); }}
                      className="mt-1.5 text-xs font-bold text-blue-700 underline underline-offset-2 hover:text-blue-900"
                    >
                      Use Google to reset password →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Google verification panel ── */}
              {useGoogleVerify && (
                <div className="mb-5 space-y-4">
                  {!googleVerified ? (
                    <div className="text-center space-y-3">
                      <p className="text-sm text-slate-600">
                        Click the button below to verify it&apos;s you via Google. No current password needed.
                      </p>
                      {googleClientId ? (
                        <div className="flex justify-center">
                          <div className="relative">
                            {/* Invisible real button — hint forces correct account */}
                            <div className="opacity-0 absolute inset-0 z-10 overflow-hidden rounded-full cursor-pointer">
                              <GoogleLogin
                                onSuccess={handleGoogleVerify}
                                onError={() => setGoogleError('Google verification failed. Please try again.')}
                                prompt="select_account"
                                login_hint={user?.email}
                                theme="outline"
                                size="large"
                                shape="circle"
                                type="icon"
                                width="44"
                              />
                            </div>
                            {/* Visible button */}
                            <button
                              type="button"
                              className="w-11 h-11 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm pointer-events-none"
                              tabIndex={-1}
                              aria-hidden="true"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-rose-600">Google Sign-In is not configured.</p>
                      )}
                      {googleError && <p className="text-xs text-rose-600">{googleError}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">Google identity verified — now set your new password below.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => { setUseGoogleVerify(false); setGoogleVerified(false); setGoogleCredential(null); setGoogleError(''); }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
                  >
                    ← Use current password instead
                  </button>
                </div>
              )}

              {/* ── Password form ── */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Current Password — only when not using Google verify and not first-time set */}
                {!isSettingFirstPassword && !useGoogleVerify && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        autoComplete="current-password"
                        {...register('currentPassword', { required: 'Current password is required' })}
                        className={`${inputCls} pr-10`}
                        placeholder="Enter your current password"
                      />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message}</p>
                    )}
                  </div>
                )}

                {/* New Password — always shown, but only enabled after Google verify if in that mode */}
                {(!useGoogleVerify || googleVerified) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                      <div className="relative">
                        <input
                          type={showNew ? 'text' : 'password'}
                          autoComplete="new-password"
                          {...register('newPassword', {
                            required: 'New password is required',
                            minLength: { value: 8, message: 'At least 8 characters required' },
                          })}
                          className={`${inputCls} pr-10`}
                          placeholder="Min. 8 characters"
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          autoComplete="new-password"
                          {...register('confirmPassword', {
                            required: 'Please confirm your password',
                            validate: (val) => val === watch('newPassword') || 'Passwords do not match',
                          })}
                          className={`${inputCls} pr-10`}
                          placeholder="Re-enter new password"
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      loading={isSubmitting}
                      disabled={useGoogleVerify && !googleVerified}
                      className="w-full mt-2"
                    >
                      {isSettingFirstPassword ? 'Set Password' : 'Update Password'}
                    </Button>
                  </>
                )}

                {/* Google verify mode — waiting for Google */}
                {useGoogleVerify && !googleVerified && (
                  <p className="text-center text-xs text-slate-400">
                    Verify with Google above to unlock the password fields.
                  </p>
                )}
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

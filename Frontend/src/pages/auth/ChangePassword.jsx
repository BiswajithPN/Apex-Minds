import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { homePath, role, user } = useAuthStore();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  // Google users without a password get the 'Set Password' flow
  const isGoogleUser = !!user?.google_id;
  const hasNoPassword = isGoogleUser; // Google users don't have a usable password

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      await api.post('/auth/change-password', {
        currentPassword: hasNoPassword ? undefined : formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to update password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <button
          onClick={() => navigate(homePath(role))}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-accent-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <Card padding="lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-100 mb-3">
              <KeyRound className="w-6 h-6 text-accent-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">{hasNoPassword ? 'Set Password' : 'Change Password'}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {hasNoPassword
                ? 'Set a password so you can also sign in with email'
                : 'Update your account password'}
            </p>
          </div>

          {success && (
            <div className="mb-6 px-4 py-3 bg-success-50 border border-success-200 text-success-700 text-sm rounded-xl animate-fade-in">
              {hasNoPassword ? 'Password set successfully! You can now sign in with email.' : 'Password updated successfully!'}
            </div>
          )}

          {serverError && (
            <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl animate-fade-in">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!hasNoPassword && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  {...register('currentPassword', { required: 'Current password is required' })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow"
                />
                {errors.currentPassword && (
                  <p className="text-xs text-danger-500 mt-1">{errors.currentPassword.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'At least 8 characters' },
                })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow"
              />
              {errors.newPassword && (
                <p className="text-xs text-danger-500 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === watch('newPassword') || 'Passwords do not match',
                })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-danger-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

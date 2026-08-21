import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function CompanyProfile() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/employer/company');
      const p = data.company || {};
      setValue('companyName', p.company_name || p.companyName || '');
      setValue('industry', p.industry || '');
      setValue('website', p.website || '');
      setValue('description', p.description || '');
      setValue('location', p.location || '');
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    try {
      await api.put('/employer/company', formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // Handled by interceptor
    }
  };

  if (loading) return <PageLoader />;

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow';

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-accent-100">
          <Building2 className="w-6 h-6 text-accent-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Profile</h1>
          <p className="text-sm text-slate-500">Manage your company information</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-success-50 border border-success-200 text-success-700 text-sm rounded-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          Company profile saved successfully!
        </div>
      )}

      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
            <input
              {...register('companyName', { required: 'Company name is required' })}
              className={inputClass}
              placeholder="Acme Inc."
            />
            {errors.companyName && <p className="text-xs text-danger-500 mt-1">{errors.companyName.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Industry</label>
              <input {...register('industry')} className={inputClass} placeholder="Technology" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
              <input {...register('website')} className={inputClass} placeholder="https://example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
            <input {...register('location')} className={inputClass} placeholder="San Francisco, CA" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              {...register('description')}
              rows={5}
              className={`${inputClass} resize-none`}
              placeholder="Tell candidates about your company..."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting}>Save Company Profile</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

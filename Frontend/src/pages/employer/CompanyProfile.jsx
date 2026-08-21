import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, CheckCircle2, Globe, MapPin, Mail, AlertCircle, Save } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';
import useAuthStore from '../../store/authStore';

export default function CompanyProfile() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const { user, setUser } = useAuthStore();

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
      let data;
      try {
        const res = await api.get('/employer/company');
        data = res.data;
      } catch {
        const res = await api.get('/users/profile');
        data = res.data;
      }

      const p = data.company || data.profile || {};
      setValue('companyName', p.company_name || p.companyName || user?.name || '');
      setValue('email', p.email || user?.email || '');
      setValue('industry', p.industry || '');
      setValue('website', p.website || '');
      setValue('description', p.description || '');
      setValue('location', p.location || '');
    } catch (err) {
      console.error('Failed to load company profile', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    setServerError('');
    setSuccess(false);

    try {
      const payload = {
        companyName: formData.companyName,
        company_name: formData.companyName,
        email: formData.email,
        industry: formData.industry,
        website: formData.website,
        description: formData.description,
        location: formData.location,
      };

      let res;
      try {
        res = await api.put('/employer/company', payload);
      } catch {
        res = await api.put('/users/profile', { company: payload });
      }

      if (res.data?.user) {
        setUser({ ...user, name: res.data.user.name, email: res.data.user.email });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setServerError(
        err.response?.data?.message || err.message || 'Failed to update company profile.'
      );
    }
  };

  if (loading) return <PageLoader />;

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow';

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-accent-100">
          <Building2 className="w-6 h-6 text-accent-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Profile</h1>
          <p className="text-sm text-slate-500">
            Manage your company information — visible to all job seekers across all job postings
          </p>
        </div>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-success-50 border border-success-200 text-success-700 text-sm rounded-xl animate-fade-in font-medium">
          <CheckCircle2 className="w-5 h-5 text-success-600" />
          Company profile saved and synced across all job listings!
        </div>
      )}

      {serverError && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-xl animate-fade-in font-medium">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
          {serverError}
        </div>
      )}

      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Company / Organization Name <span className="text-danger-500">*</span>
              </label>
              <input
                {...register('companyName', { required: 'Company name is required' })}
                className={inputClass}
                placeholder="e.g. Stripe, Acme Corp"
              />
              {errors.companyName && <p className="text-xs text-danger-500 mt-1">{errors.companyName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register('email')}
                  className={`${inputClass} pl-10`}
                  placeholder="recruiting@company.com"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Industry</label>
              <input {...register('industry')} className={inputClass} placeholder="e.g. Software & Technology, Healthcare" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Website</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  {...register('website')}
                  className={`${inputClass} pl-10`}
                  placeholder="https://company.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Headquarters / Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                {...register('location')}
                className={`${inputClass} pl-10`}
                placeholder="e.g. San Francisco, CA (or Fully Remote)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">About the Company</label>
            <textarea
              {...register('description')}
              rows={5}
              className={`${inputClass} resize-none`}
              placeholder="Tell candidates about your company culture, mission, team size, and benefits..."
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" loading={isSubmitting} className="shadow-md shadow-accent-500/20">
              <Save className="w-4 h-4 mr-2" />
              Save & Sync Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

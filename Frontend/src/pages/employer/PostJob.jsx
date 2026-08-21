import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PlusCircle, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../api/axiosInstance';

const jobTypeOptions = ['full-time', 'part-time', 'contract', 'remote', 'internship'];

export default function PostJob() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const onSubmit = async (formData) => {
    setApiError('');
    try {
      const payload = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      await api.post('/employer/jobs', payload);
      setSuccess(true);
      reset();
      setTimeout(() => {
        setSuccess(false);
        navigate('/employer/jobs');
      }, 2000);
    } catch (err) {
      setApiError(err.response?.data?.message || err.response?.data?.detail || 'Failed to create job posting.');
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow';

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-accent-100">
          <PlusCircle className="w-6 h-6 text-accent-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Post a Job</h1>
          <p className="text-sm text-slate-500">Create a new job listing</p>
        </div>
      </div>

      {apiError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {apiError}
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          Job posted successfully! Redirecting...
        </div>
      )}

      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Title</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className={inputClass}
              placeholder="Senior Frontend Developer"
            />
            {errors.title && <p className="text-xs text-danger-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={6}
              className={`${inputClass} resize-none`}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
            />
            {errors.description && <p className="text-xs text-danger-500 mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Requirements</label>
            <textarea
              {...register('requirements')}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="List the qualifications and requirements..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input {...register('location')} className={inputClass} placeholder="Remote / San Francisco, CA" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Type</label>
              <select
                {...register('type', { required: 'Select a job type' })}
                className={inputClass}
              >
                <option value="">Select type...</option>
                {jobTypeOptions.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-danger-500 mt-1">{errors.type.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Salary Range</label>
            <input {...register('salary')} className={inputClass} placeholder="$80,000 - $120,000 / year" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Skills Required <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              {...register('skills')}
              className={inputClass}
              placeholder="React, TypeScript, Node.js"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/employer/jobs')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <PlusCircle className="w-4 h-4" />
              Post Job
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

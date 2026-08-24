import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../api/axiosInstance';

const jobTypeOptions = ['full-time', 'part-time', 'contract', 'remote', 'internship'];
const experienceOptions = ['entry', 'mid', 'senior', 'lead'];

export default function PostJob() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      requirements: '',
      location: '',
      type: 'full-time',
      salary: '',
      skills: '',
      experience_level: 'mid',
    }
  });

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      const skillsArray = typeof formData.skills === 'string'
        ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : formData.skills;

      const payload = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements || '',
        location: formData.location || '',
        type: formData.type,
        salary: formData.salary || '',
        skills: skillsArray,
        experience_level: formData.experience_level || 'mid',
      };

      // Try employer jobs endpoint first, with fallback to general jobs endpoint
      try {
        await api.post('/employer/jobs', payload);
      } catch {
        await api.post('/jobs', payload);
      }

      setSuccess(true);
      reset();
      setTimeout(() => {
        setSuccess(false);
        navigate('/employer/jobs');
      }, 1200);
    } catch (err) {
      setServerError(
        err.response?.data?.message || err.message || 'Failed to post job. Please check all fields.'
      );
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow';

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-accent-100">
          <PlusCircle className="w-6 h-6 text-accent-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Post a Job</h1>
          <p className="text-sm text-slate-500">Create a new job listing with required skills and qualifications</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-success-50 border border-success-200 text-success-700 text-sm rounded-xl animate-fade-in font-medium">
          <CheckCircle2 className="w-5 h-5 text-success-600" />
          Job posted successfully! Redirecting to Manage Jobs...
        </div>
      )}

      {serverError && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-xl animate-fade-in font-medium">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
          {serverError}
        </div>
      )}

      <Card padding="md" className="border-2 border-slate-200/80 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Job Title <span className="text-danger-500">*</span>
            </label>
            <input
              {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Title must be at least 3 characters' } })}
              className={inputClass}
              placeholder="e.g. Senior Full Stack Engineer"
            />
            {errors.title && <p className="text-xs text-danger-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-danger-500">*</span>
            </label>
            <textarea
              {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Description must be at least 10 characters' } })}
              rows={5}
              className={`${inputClass} resize-none`}
              placeholder="Describe the role responsibilities, mission, and day-to-day work..."
            />
            {errors.description && <p className="text-xs text-danger-500 mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Qualifications & Requirements</label>
            <textarea
              {...register('requirements')}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="List specific qualifications, years of experience, or degree requirements..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input {...register('location')} className={inputClass} placeholder="e.g. San Francisco, CA (or Remote)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Type</label>
              <select {...register('type', { required: 'Select a job type' })} className={inputClass}>
                {jobTypeOptions.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience Level</label>
              <select {...register('experience_level')} className={inputClass}>
                {experienceOptions.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl.charAt(0).toUpperCase() + lvl.slice(1)} Level</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Salary Range</label>
              <input {...register('salary')} className={inputClass} placeholder="e.g. $120,000 - $150,000 / year" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Required Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              {...register('skills')}
              className={inputClass}
              placeholder="e.g. React, Node.js, MongoDB, TypeScript, AWS"
            />
            <p className="text-xs text-slate-400 mt-1">These skills are automatically evaluated by the Bias-Aware AI Screener against applicant resumes.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => navigate('/employer/jobs')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Publish Job Listing
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

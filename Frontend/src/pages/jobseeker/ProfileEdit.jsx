import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, ExternalLink, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import OnboardingStepper from '../../components/ui/OnboardingStepper';
import { PageLoader } from '../../components/ui/Spinner';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function ProfileEdit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isOnboarding = searchParams.get('onboarding') === '1';
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [certifications, setCertifications] = useState([]);

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
      const { data } = await api.get('/jobseeker/profile');
      const p = data.profile || data;
      setValue('name', p.full_name || user?.name || '');
      setValue('phone', p.phone || '');
      setValue('location', p.location || '');
      setValue('skills', (p.skills || []).join(', '));
      setValue('experience', p.experience || '');
      setValue('education', p.education || '');
      setCertifications(p.certifications || []);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        skills: formData.skills ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        experience: formData.experience,
        education: formData.education,
        certifications,
      };
      const { data } = await api.put('/jobseeker/profile', payload);
      setUser({ ...user, ...data.user, name: formData.name });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      if (isOnboarding) {
        setTimeout(() => navigate('/jobseeker/resume?onboarding=1'), 1500);
      }
    } catch {
      // Handled by interceptor
    }
  };

  const addCertification = () => {
    setCertifications([...certifications, { title: '', issuer: '', year: '', cert_url: '' }]);
  };

  const removeCertification = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const updateCertification = (index, field, value) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  if (loading) return <PageLoader />;

  const getInputClass = (hasError) =>
    `w-full px-4 py-2.5 bg-slate-50 border ${
      hasError ? 'border-rose-400' : 'border-slate-200'
    } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all`;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {isOnboarding && <OnboardingStepper currentStep={2} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isOnboarding ? 'Tell us about yourself to improve AI matching' : 'Keep your profile up to date'}
        </p>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          Profile saved successfully!
          {isOnboarding && ' Redirecting to resume upload...'}
        </div>
      )}

      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className={getInputClass(errors.name)}
              placeholder="John Doe"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Phone + Location */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input
                {...register('phone')}
                className={getInputClass(errors.phone)}
                placeholder="+1 (555) 000-0000"
              />
              {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input
                {...register('location')}
                className={getInputClass(errors.location)}
                placeholder="San Francisco, CA"
              />
              {errors.location && <p className="text-xs text-rose-500 mt-1">{errors.location.message}</p>}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              {...register('skills')}
              className={getInputClass(errors.skills)}
              placeholder="React, Node.js, Python, Machine Learning"
            />
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience</label>
            <textarea
              {...register('experience')}
              rows={4}
              className={`${getInputClass(errors.experience)} resize-none`}
              placeholder="Describe your work experience..."
            />
          </div>

          {/* Education */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Education</label>
            <textarea
              {...register('education')}
              rows={3}
              className={`${getInputClass(errors.education)} resize-none`}
              placeholder="Your educational background..."
            />
          </div>

          {/* Certifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700">Certifications</label>
              <Button type="button" variant="ghost" size="sm" onClick={addCertification}>
                <Plus className="w-4 h-4" />
                Add Certification
              </Button>
            </div>
            <div className="space-y-3">
              {certifications.map((cert, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      value={cert.title || cert.name || ''}
                      onChange={(e) => updateCertification(i, 'title', e.target.value)}
                      className={getInputClass(false)}
                      placeholder="Certification Title"
                    />
                    <input
                      value={cert.issuer || ''}
                      onChange={(e) => updateCertification(i, 'issuer', e.target.value)}
                      className={getInputClass(false)}
                      placeholder="Issuing Organization"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      value={cert.year || ''}
                      onChange={(e) => updateCertification(i, 'year', e.target.value)}
                      className={getInputClass(false)}
                      placeholder="Year (e.g. 2024)"
                    />
                    <div className="flex gap-2">
                      <input
                        value={cert.cert_url || ''}
                        onChange={(e) => updateCertification(i, 'cert_url', e.target.value)}
                        className={`${getInputClass(false)} flex-1`}
                        placeholder="Certificate URL"
                      />
                      {cert.cert_url && (
                        <a href={cert.cert_url} target="_blank" rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-accent-50 text-accent-600 hover:bg-accent-100 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCertification(i)}
                    className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-3">
            {isOnboarding && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/jobseeker/resume?onboarding=1')}
              >
                Skip for Now
              </Button>
            )}
            <Button type="submit" loading={isSubmitting}>
              {isOnboarding ? 'Save & Continue' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

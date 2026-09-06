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
  const [error, setError] = useState('');
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
      const { data } = await api.get('/users/profile');
      const p = data.profile || data;
      setValue('name', p.full_name || p.name || user?.name || user?.full_name || '');
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
    setError('');
    setSuccess(false);
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        experience: formData.experience,
        education: formData.education,
        certifications,
      };
      const { data } = await api.put('/users/profile', payload);
      const updatedUser = data?.user;
      if (updatedUser) {
        setUser({ ...user, ...updatedUser, name: formData.name });
      } else {
        setUser({ ...user, name: formData.name });
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate('/jobseeker/resume' + (isOnboarding ? '?onboarding=1' : ''), { replace: true });
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save profile. Please try again.';
      setError(msg);
    }
  };

  const [uploadingCertIndex, setUploadingCertIndex] = useState(null);

  const handleUploadCertFile = async (index, file) => {
    if (!file) return;
    setUploadingCertIndex(index);
    try {
      const formData = new FormData();
      formData.append('certificate', file);
      const { data } = await api.post('/jobseeker/certifications/upload', formData);
      const url = data.certUrl || data.cert_url;
      if (url) {
        updateCertification(index, 'cert_url', url);
        if (!certifications[index]?.name) {
          updateCertification(index, 'name', file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Certificate upload failed.');
    } finally {
      setUploadingCertIndex(null);
    }
  };

  const addCertification = () => {
    setCertifications([...certifications, { name: '', issuer: '', year: '', cert_url: '' }]);
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

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow';

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-12">
      {isOnboarding && <OnboardingStepper currentStep={2} />}

      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">{isOnboarding ? 'Complete Your Profile' : 'Edit Profile'}</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {isOnboarding ? 'Tell us about yourself to improve job matching' : 'Keep your profile up to date'}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-xl animate-fade-in">
          <span className="font-semibold">⚠️ {error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-success-50 border border-success-200 text-success-700 text-sm rounded-xl animate-fade-in">
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
              className={inputClass}
              placeholder="John Doe"
            />
            {errors.name && <p className="text-xs text-danger-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Phone & Location */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input {...register('phone', { required: 'Phone is required' })} className={inputClass} placeholder="+1 (555) 000-0000" />
            {errors.phone && <p className="text-xs text-danger-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input {...register('location', { required: 'Location is required' })} className={inputClass} placeholder="San Francisco, CA" />
            {errors.location && <p className="text-xs text-danger-500 mt-1">{errors.location.message}</p>}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Skills <span className="text-xs text-slate-400">(comma-separated)</span>
            </label>
            <input
              {...register('skills', { required: 'At least one skill is required' })}
              className={inputClass}
              placeholder="React, Node.js, Python, TypeScript, Docker"
            />
            {errors.skills && <p className="text-xs text-danger-500 mt-1">{errors.skills.message}</p>}
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience</label>
            <textarea
              {...register('experience', { required: 'Experience is required' })}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Brief summary of your work experience..."
            />
            {errors.experience && <p className="text-xs text-danger-500 mt-1">{errors.experience.message}</p>}
          </div>

          {/* Education */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Education</label>
            <input
              {...register('education', { required: 'Education is required' })}
              className={inputClass}
              placeholder="B.S. Computer Science, Stanford University (2020)"
            />
            {errors.education && <p className="text-xs text-danger-500 mt-1">{errors.education.message}</p>}
          </div>

          {/* Certifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-bold text-slate-800">Certifications & Credentials</label>
                <p className="text-xs text-slate-500">Upload certificate files (stored securely on Cloudinary)</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addCertification}>
                <Plus className="w-4 h-4 mr-1" />
                Add Certification
              </Button>
            </div>
            <div className="space-y-3">
              {certifications.map((cert, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fade-in">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      value={cert.name}
                      onChange={(e) => updateCertification(i, 'name', e.target.value)}
                      className={inputClass}
                      placeholder="Certification Name (e.g. AWS Solutions Architect)"
                    />
                    <input
                      value={cert.issuer}
                      onChange={(e) => updateCertification(i, 'issuer', e.target.value)}
                      className={inputClass}
                      placeholder="Issuing Organization (e.g. Amazon Web Services)"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      value={cert.year}
                      onChange={(e) => updateCertification(i, 'year', e.target.value)}
                      className={inputClass}
                      placeholder="Year (e.g. 2024)"
                    />
                    <div className="flex gap-2 items-center">
                      <input
                        value={cert.cert_url}
                        onChange={(e) => updateCertification(i, 'cert_url', e.target.value)}
                        className={`${inputClass} flex-1 text-xs`}
                        placeholder="Cloudinary URL or file link"
                      />
                      {cert.cert_url && (
                        <a
                          href={cert.cert_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-accent-50 text-accent-600 hover:bg-accent-100 transition-colors shrink-0"
                          title="View Certificate"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Upload to Cloudinary File Trigger */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all">
                        <span>{uploadingCertIndex === i ? 'Uploading to Cloudinary...' : '☁️ Upload Certificate (PDF/JPEG/PNG)'}</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
                          onChange={(e) => e.target.files[0] && handleUploadCertFile(i, e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {cert.cert_url && (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          ✓ Stored in Cloudinary
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCertification(i)}
                      className="flex items-center gap-1 text-xs text-danger-500 hover:text-danger-700 transition-colors font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-3">
            <Button type="submit" loading={isSubmitting}>
              Save & Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

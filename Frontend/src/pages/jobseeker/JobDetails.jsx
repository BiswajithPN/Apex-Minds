import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  CheckCircle2,
  Send,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      const { data } = await api.get(`/jobs/${id}`);
      setJob(data.job || data);
      setApplied(data.applied || false);
      setApplicationStatus(data.applicationStatus || null);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setApplyError('');
    try {
      await api.post('/applications', { jobId: id });
      setApplied(true);
      setApplicationStatus('pending');
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to apply. Please complete your profile first.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-slate-700">Job not found</p>
        <Link to="/jobseeker/jobs">
          <Button variant="secondary" size="sm" className="mt-4">Back to Search</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Link
        to="/jobseeker/jobs"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-accent-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Search
      </Link>

      {/* Header */}
      <Card padding="lg" className="mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-sm">
            <img src="/Hirehub-logo.png" alt="HireHub Logo" className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{job.company?.name || job.employer?.name || job.company || 'Employer'}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                {job.location || 'Remote'}
              </span>
              <Badge variant="accent" size="sm">{job.type || 'full-time'}</Badge>
              {job.salary && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <DollarSign className="w-3.5 h-3.5" />
                  {job.salary}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Skills */}
        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100">
            {job.skills.map((skill) => (
              <Badge key={skill} variant="neutral" size="md">{skill}</Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Apply Error */}
      {applyError && (
        <div className="mb-4 px-4 py-3 bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-xl font-semibold">
          ⚠️ {applyError}
        </div>
      )}

      {/* Apply / Status */}
      <Card padding="md" className="mb-6">
        {applied ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success-500" />
            <div>
              <p className="text-sm font-semibold text-success-800">Application Submitted</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Status: <Badge variant={applicationStatus === 'accepted' ? 'success' : applicationStatus === 'rejected' ? 'danger' : 'accent'} size="sm">{applicationStatus || 'pending'}</Badge>
              </p>
            </div>
          </div>
        ) : (
          <Button onClick={handleApply} loading={applying} className="w-full">
            <Send className="w-4 h-4" />
            Apply for this Position
          </Button>
        )}
      </Card>

      {/* Description */}
      <Card padding="lg" className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Job Description</h2>
        <div className="prose prose-sm prose-slate max-w-none">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>
      </Card>

      {/* Requirements */}
      {job.requirements && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Requirements</h2>
          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{job.requirements}</div>
        </Card>
      )}
    </div>
  );
}

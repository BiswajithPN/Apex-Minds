import { useState, useEffect } from 'react';
import { Flag, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function FlaggedPostings() {
  const [flaggedJobs, setFlaggedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlaggedJobs();
  }, []);

  const loadFlaggedJobs = async () => {
    try {
      const { data } = await api.get('/jobs/flagged');
      setFlaggedJobs(data.jobs || []);
    } catch {
      setFlaggedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (jobId, action) => {
    try {
      if (action === 'delete') {
        if (!window.confirm('Delete this job posting permanently?')) return;
        await api.delete(`/jobs/${jobId}`);
      } else {
        await api.patch(`/jobs/${jobId}/flag`, { status: action });
      }
      setFlaggedJobs(flaggedJobs.filter((j) => j._id !== jobId));
    } catch {
      // Error
    }
  };

  if (loading) return <CardSkeleton lines={4} />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Flagged Job Postings</h1>
        <p className="text-sm text-slate-500 mt-1">Review jobs reported by users or flagged by AI</p>
      </div>

      {flaggedJobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-3" />
          <p className="text-lg font-semibold text-slate-700">All clear!</p>
          <p className="text-sm text-slate-500 mt-1">No flagged job postings to review right now.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {flaggedJobs.map((job) => (
            <Card key={job._id} padding="md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    {job.title}
                    <Badge variant="danger" size="sm">Flagged</Badge>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Posted by: {job.employer?.name || job.company?.name} • Reason: {job.flagReason || 'Inappropriate content'}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{job.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => handleAction(job._id, 'open')}>
                    Approve / Remove Flag
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleAction(job._id, 'delete')}>
                    <Trash2 className="w-4 h-4" />
                    Delete Job
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

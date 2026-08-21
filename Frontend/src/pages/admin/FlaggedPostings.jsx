import { useState, useEffect } from 'react';
import { Flag, CheckCircle, Trash2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function FlaggedPostings() {
  const [flaggedJobs, setFlaggedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadFlaggedJobs();
  }, []);

  const loadFlaggedJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/flagged');
      setFlaggedJobs(res.data?.data?.jobs || res.data?.jobs || []);
    } catch {
      setFlaggedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (jobId, action) => {
    setActionLoading(true);
    try {
      if (action === 'delete') {
        if (!window.confirm('Are you sure you want to permanently delete this job posting?')) return;
        await api.delete(`/jobs/${jobId}`);
      } else {
        await api.patch(`/admin/flagged-jobs/${jobId}/flag`, { status: action });
      }
      setFlaggedJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <CardSkeleton lines={6} />;

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20 font-sans text-slate-800">
      {/* Light Emerald Fresh Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-3xl p-6 sm:p-10 !text-white relative overflow-hidden shadow-xl shadow-emerald-600/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white shadow-xs">
            <Flag className="w-4 h-4 text-rose-200" />
            Content Moderation & Integrity
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight !text-white leading-tight">
            Flagged Job Postings
          </h1>
          <p className="!text-emerald-50 text-xs sm:text-base max-w-2xl font-medium leading-relaxed">
            Review job postings reported by community members or flagged by automated keyword safety filters.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900">
          Flagged Queue ({flaggedJobs.length})
        </h2>
        <Button variant="secondary" size="sm" onClick={loadFlaggedJobs} className="font-bold text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh Queue
        </Button>
      </div>

      {flaggedJobs.length === 0 ? (
        <Card padding="lg" className="text-center py-16 border-2 border-slate-200/80 bg-white shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">All Clear & Compliant!</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 font-medium">
            There are currently zero flagged job listings. All live job postings have passed community and automated safety standards.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {flaggedJobs.map((job) => (
            <Card key={job._id} padding="md" className="border-2 border-rose-200 bg-white shadow-2xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">{job.title}</h3>
                    <Badge variant="danger" size="sm" className="font-extrabold uppercase text-[10px]">
                      Flagged Listing
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">
                    Company: <strong className="text-slate-800">{job.employerId?.full_name || job.company || 'Employer'}</strong> • Reason:{' '}
                    <span className="text-rose-700 font-bold">{job.flag_reason || job.flagReason || 'Reported for review'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleAction(job._id, 'open')}
                    className="font-bold text-xs"
                  >
                    <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
                    Approve / Remove Flag
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleAction(job._id, 'delete')}
                    className="font-bold text-xs"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Posting
                  </Button>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                {job.description}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Calendar,
  Video,
  Phone,
  MapPin,
  ExternalLink,
  XCircle,
  BarChart3,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

const statusConfig = {
  pending: { variant: 'warning', label: 'Pending' },
  reviewing: { variant: 'accent', label: 'Reviewing' },
  shortlisted: { variant: 'accent', label: 'Shortlisted' },
  interview: { variant: 'success', label: 'Interview' },
  accepted: { variant: 'success', label: 'Accepted' },
  rejected: { variant: 'danger', label: 'Rejected' },
  withdrawn: { variant: 'neutral', label: 'Withdrawn' },
};

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { data } = await api.get('/applications/mine');
      setApplications(data.applications || []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (appId) => {
    try {
      await api.patch(`/applications/${appId}/withdraw`);
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: 'withdrawn' } : a))
      );
    } catch {
      // Handled by interceptor
    }
  };

  const canWithdraw = (status) => !['shortlisted', 'interview', 'accepted', 'withdrawn', 'rejected'].includes(status);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} lines={2} />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <p className="text-sm text-slate-500 mt-1">{applications.length} applications total</p>
      </div>

      {applications.length === 0 ? (
        <Card padding="lg" className="text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-semibold text-slate-700">No applications yet</p>
          <p className="text-sm text-slate-500 mt-1">Start exploring jobs to apply</p>
          <Link to="/jobseeker/jobs">
            <Button size="sm" className="mt-4">Browse Jobs</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const status = statusConfig[app.status] || statusConfig.pending;

            return (
              <Card key={app._id} padding="md" className="animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/jobseeker/jobs/${app.job?._id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-accent-600 transition-colors"
                        >
                          {app.job?.title || 'Job Position'}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {app.job?.company?.name || app.job?.employer?.name} • Applied{' '}
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={status.variant} size="md">{status.label}</Badge>
                    </div>

                    {/* Match score */}
                    {app.matchScore != null && (
                      <div className="flex items-center gap-2 mt-2">
                        <BarChart3 className="w-3.5 h-3.5 text-accent-500" />
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-500 rounded-full animate-progress-fill"
                            style={{ width: `${app.matchScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-accent-600">{app.matchScore}%</span>
                      </div>
                    )}

                    {/* Interview card */}
                    {app.status === 'interview' && app.interview && (
                      <div className="mt-3 p-3 bg-success-50 border border-success-200 rounded-xl">
                        <p className="text-xs font-semibold text-success-800 mb-1.5">Interview Scheduled</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-success-700">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(app.interview.date).toLocaleDateString()}
                          </span>
                          <span>{app.interview.time}</span>
                          <span className="flex items-center gap-1">
                            {app.interview.type === 'video' ? (
                              <Video className="w-3 h-3" />
                            ) : app.interview.type === 'phone' ? (
                              <Phone className="w-3 h-3" />
                            ) : (
                              <MapPin className="w-3 h-3" />
                            )}
                            {app.interview.type}
                          </span>
                          {app.interview.location && (
                            <a
                              href={app.interview.location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-accent-600 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Join Link
                            </a>
                          )}
                        </div>
                        {app.interview.notes && (
                          <p className="text-xs text-success-600 mt-2 italic">{app.interview.notes}</p>
                        )}
                      </div>
                    )}

                    {/* Withdraw */}
                    {canWithdraw(app.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 !text-danger-500 hover:!bg-danger-50"
                        onClick={() => handleWithdraw(app._id)}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

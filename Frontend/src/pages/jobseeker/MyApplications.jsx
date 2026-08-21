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
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Target,
  Zap,
  Info,
  Award,
  ChevronRight,
  TrendingUp,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

const statusConfig = {
  pending: { variant: 'warning', label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  reviewing: { variant: 'accent', label: 'Under Review', bg: 'bg-accent-50', text: 'text-accent-800', border: 'border-accent-200' },
  shortlisted: { variant: 'success', label: 'Shortlisted', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  interview: { variant: 'success', label: 'Interview Scheduled', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  accepted: { variant: 'success', label: 'Accepted', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  rejected: { variant: 'danger', label: 'Not Shortlisted', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  withdrawn: { variant: 'neutral', label: 'Withdrawn', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // In-Page Expanded Feedback State (No Popups)
  const [expandedFeedbackAppId, setExpandedFeedbackAppId] = useState(null);

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
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
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
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
        {[1, 2, 3].map((i) => <CardSkeleton key={i} lines={3} />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-16 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Applications & AI Feedback</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Track application statuses, multi-criteria match scores, and personalized constructive AI growth advice
          </p>
        </div>

        <Link to="/jobseeker/jobs">
          <Button size="md" className="font-bold shadow-md shadow-accent-500/20 text-sm">
            Browse More Jobs
          </Button>
        </Link>
      </div>

      {applications.length === 0 ? (
        <Card padding="lg" className="text-center py-16">
          <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800">No applications submitted yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Explore job openings and apply to receive real-time multi-criteria AI screening, match scores, and constructive feedback.
          </p>
          <Link to="/jobseeker/jobs">
            <Button size="md" className="font-bold">Browse Open Positions</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => {
            const status = statusConfig[app.status] || statusConfig.pending;
            const isRejected = app.status === 'rejected';
            const isShortlisted = app.status === 'shortlisted' || app.status === 'interview';
            const isExpanded = expandedFeedbackAppId === app._id || isRejected;

            const score = (app.matchScore && app.matchScore > 10)
              ? app.matchScore
              : (app.rejectionExplanation?.matchScore || 79);
            const explanation = app.rejectionExplanation;

            return (
              <Card
                key={app._id}
                padding="lg"
                className={`animate-fade-in border-2 transition-all shadow-sm hover:shadow-md ${
                  isRejected
                    ? 'border-rose-300 bg-white'
                    : isShortlisted
                    ? 'border-emerald-300 bg-white'
                    : 'border-slate-200/90 bg-white'
                }`}
              >
                <div className="space-y-6">
                  {/* Top Bar: Title & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1.5">
                      <Link
                        to={`/jobseeker/jobs/${app.job?._id}`}
                        className="text-2xl font-black text-slate-900 hover:text-accent-600 transition-colors block"
                      >
                        {app.job?.title || 'Job Position'}
                      </Link>
                      <p className="text-sm sm:text-base text-slate-500 font-medium">
                        {app.job?.company?.name || app.job?.employer?.name || 'Hiring Company'} • Applied on{' '}
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm sm:text-base font-black border ${status.bg} ${status.text} ${status.border} shadow-2xs`}>
                        {isRejected && <XCircle className="w-4 h-4 text-rose-600" />}
                        {isShortlisted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {!isRejected && !isShortlisted && <Sparkles className="w-4 h-4 text-amber-500" />}
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Criteria Match Score Bar */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-base font-extrabold text-slate-800">
                      <span className="flex items-center gap-2.5">
                        <Sparkles className="w-5 h-5 text-accent-500" />
                        Multi-Criteria AI Match Score
                      </span>
                      <span className="text-2xl font-black text-slate-900">{score}%</span>
                    </div>

                    <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          score >= 70 ? 'bg-emerald-500' : 'bg-accent-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>

                  {/* REJECTION FEEDBACK & WHAT TO DO NEXT (IN-PAGE FULL VIEW) */}
                  {isRejected && explanation && (
                    <div className="p-5 bg-rose-50/70 border-2 border-rose-200 rounded-2xl space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-rose-950 font-black text-base border-b border-rose-200 pb-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                        Why Your Application Was Not Shortlisted
                      </div>

                      {/* Primary Reasons */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">Evaluation Factors & Gaps:</p>
                        <ul className="space-y-2">
                          {explanation.reasons?.map((reason, rIdx) => (
                            <li key={rIdx} className="text-sm text-slate-800 bg-white p-3 rounded-xl border border-rose-200 font-medium flex items-start gap-2.5 shadow-2xs">
                              <span className="text-rose-500 font-black text-base leading-none mt-0.5">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* WHAT SHOULD THE CANDIDATE DO NEXT? (AI GROWTH PLAN) */}
                      <div className="p-4 bg-white rounded-xl border border-rose-200 shadow-2xs space-y-2">
                        <h4 className="text-sm font-black text-accent-700 uppercase tracking-wider flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-accent-600" />
                          What Should You Do Next? (AI Remediation Guidance)
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {explanation.constructiveAdvice || 'Focus on building verified production projects and expanding practical tenure in core technical requirements.'}
                        </p>
                      </div>

                      {/* Candidate Strong Points */}
                      {explanation.strengths?.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Your Strong Qualified Areas:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {explanation.strengths.map((st, sIdx) => (
                              <span key={sIdx} className="px-2.5 py-1 bg-emerald-100/80 text-emerald-900 font-bold text-xs rounded-lg border border-emerald-300">
                                ✓ {st}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* INTERVIEW SCHEDULED CARD */}
                  {app.status === 'interview' && app.interview && (
                    <div className="p-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl space-y-3 animate-fade-in">
                      <h4 className="text-base font-black text-emerald-950 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                        Interview Scheduled by Recruiter!
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-700">
                        <div className="p-3 bg-white rounded-xl border border-emerald-200">
                          <p className="text-xs font-bold text-slate-400 uppercase">Date & Time</p>
                          <p className="font-extrabold text-slate-900 mt-0.5">
                            {new Date(app.interview.date).toLocaleDateString()} at {app.interview.time}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-emerald-200">
                          <p className="text-xs font-bold text-slate-400 uppercase">Medium</p>
                          <p className="font-extrabold text-slate-900 mt-0.5 capitalize">{app.interview.type}</p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-emerald-200">
                          <p className="text-xs font-bold text-slate-400 uppercase">Location / Link</p>
                          <p className="font-extrabold text-accent-600 mt-0.5 truncate">
                            {app.interview.location || 'Pending link'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACTION TOOLBAR (IN-PAGE) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Full-Page Detailed Report Link */}
                      <Link to={`/jobseeker/applications/${app._id}/analysis`}>
                        <Button size="sm" className="font-bold text-sm shadow-xs flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          View Full AI Evaluation Report
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>

                    {/* Withdraw Option */}
                    {canWithdraw(app.status) && (
                      <button
                        onClick={() => handleWithdraw(app._id)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Withdraw Application
                      </button>
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

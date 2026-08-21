import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Sparkles, Eye } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

const statusVariants = {
  pending: 'warning',
  reviewing: 'accent',
  shortlisted: 'accent',
  interview: 'success',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

export default function Applicants() {
  const { id: jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Interview modal form
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewType, setInterviewType] = useState('video');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [submittingInterview, setSubmittingInterview] = useState(false);

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      const [jobRes, appsRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/employer/jobs/${jobId}/applicants`),
      ]);
      setJob(jobRes.data.job || jobRes.data);
      setApplicants(appsRes.data.applications || []);
    } catch {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, rawStatus) => {
    const newStatus = rawStatus === 'shortlist' ? 'shortlisted' : rawStatus;
    try {
      await api.patch(`/employer/applications/${appId}/status`, { status: newStatus });
      setApplicants((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: newStatus } : a))
      );
    } catch {
      // Error handling
    }
  };

  const openInterviewModal = (app) => {
    setSelectedApp(app);
    setInterviewDate(app.interview?.date ? app.interview.date.split('T')[0] : '');
    setInterviewTime(app.interview?.time || '');
    setInterviewType(app.interview?.type || 'video');
    setInterviewLocation(app.interview?.location || '');
    setInterviewNotes(app.interview?.notes || '');
    setModalOpen(true);
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setSubmittingInterview(true);
    try {
      const interviewData = {
        date: interviewDate,
        time: interviewTime,
        type: interviewType,
        location: interviewLocation,
        notes: interviewNotes,
      };
      await api.put(`/employer/applications/${selectedApp._id}/interview`, interviewData);
      setApplicants((prev) =>
        prev.map((a) =>
          a._id === selectedApp._id
            ? { ...a, status: 'interview', interview: interviewData }
            : a
        )
      );
      setModalOpen(false);
    } catch {
      // Error
    } finally {
      setSubmittingInterview(false);
    }
  };

  if (loading) return <CardSkeleton lines={5} />;

  return (
    <div className="animate-fade-in">
      <Link
        to="/employer/jobs"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-accent-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Applicants for {job?.title || 'Job'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Ranked by AI match score ({applicants.length} total)
        </p>
      </div>

      {applicants.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No applicants yet for this job posting.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {applicants.map((app) => (
            <Card key={app._id} padding="md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Match Score Badge */}
                  <div className="w-12 h-12 rounded-xl gradient-accent flex flex-col items-center justify-center text-white shrink-0 shadow-md shadow-accent-500/20">
                    <span className="text-sm font-bold">{app.matchScore ?? 0}%</span>
                    <span className="text-[9px] uppercase tracking-tighter opacity-80">Match</span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      {app.applicant?.name || 'Candidate'}
                      <Badge variant={statusVariants[app.status]} size="sm">
                        {app.status}
                      </Badge>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Applied {new Date(app.createdAt).toLocaleDateString()} • {app.applicant?.email}
                    </p>

                    {/* Matched skills */}
                    {app.matchedSkills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {app.matchedSkills.map((skill) => (
                          <Badge key={skill} variant="neutral" size="sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app._id, e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <Button variant="ghost" size="sm" onClick={() => openInterviewModal(app)}>
                    <Calendar className="w-4 h-4" />
                    Interview
                  </Button>

                  <Link to={`/employer/candidates/${app.applicant?._id || app.applicant}`}>
                    <Button variant="secondary" size="sm">
                      <Eye className="w-4 h-4" />
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Schedule Interview — ${selectedApp?.applicant?.name || 'Candidate'}`}
      >
        <form onSubmit={handleScheduleInterview} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Time</label>
              <input
                type="time"
                required
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
              <option value="in-person">In Person</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Location / Meeting Link</label>
            <input
              type="text"
              placeholder="e.g. Google Meet link or office address"
              value={interviewLocation}
              onChange={(e) => setInterviewLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={3}
              placeholder="Instructions or agenda..."
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingInterview}>
              Schedule Interview
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

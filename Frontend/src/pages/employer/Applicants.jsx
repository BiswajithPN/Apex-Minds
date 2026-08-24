import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Calendar,
  Sparkles,
  Eye,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Award,
  Filter,
  Check,
  Flame,
  FileText,
  Mail,
  MapPin,
  Copy,
  Sliders,
  TrendingUp,
  Target,
  BarChart3,
  HelpCircle,
  AlertTriangle,
  FolderOpen,
  Zap,
  Info,
  Clock,
  ArrowRight,
  Download,
  ExternalLink
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function Applicants() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'shortlisted' | 'not_shortlisted'

  // In-Page Action State
  const [activeActionApp, setActiveActionApp] = useState(null); // { app, action: 'reject' | 'interview' }
  const [rejectionReason, setRejectionReason] = useState('');
  const [constructiveAdvice, setConstructiveAdvice] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // In-Page Interview Form State
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewType, setInterviewType] = useState('video');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  // In-Page Rubric & Threshold Configuration State
  const [showRubricPanel, setShowRubricPanel] = useState(false);
  const [threshold, setThreshold] = useState(70);
  const [rubricWeights, setRubricWeights] = useState({
    skillWeight: 0.40,
    experienceWeight: 0.25,
    semanticWeight: 0.20,
    projectWeight: 0.10,
    educationWeight: 0.05
  });
  const [savingRubric, setSavingRubric] = useState(false);

  // In-Page Fairness Audit State
  const [showFairnessPanel, setShowFairnessPanel] = useState(false);
  const [fairnessData, setFairnessData] = useState(null);
  const [fairnessLoading, setFairnessLoading] = useState(false);

  useEffect(() => {
    loadJobAndRankings();
  }, [jobId]);

  const loadJobAndRankings = async () => {
    try {
      setLoading(true);
      const [jobRes, rankRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/analysis/jobs/${jobId}/rankings`)
      ]);

      const jobData = jobRes.data.job || jobRes.data;
      setJob(jobData);
      setThreshold(jobData.threshold || 70);
      if (jobData.rubricWeights) {
        setRubricWeights(jobData.rubricWeights);
      }

      setRankings(rankRes.data.data?.rankings || rankRes.data?.rankings || []);
    } catch (err) {
      console.error('Failed to load job rankings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShortlistCandidate = async (cand) => {
    try {
      await api.patch(`/employer/applications/${cand.applicationId}/status`, {
        status: 'shortlisted'
      });
      setRankings((prev) =>
        prev.map((c) =>
          c.applicationId === cand.applicationId ? { ...c, status: 'shortlisted' } : c
        )
      );
    } catch (err) {
      console.error('Failed to shortlist', err);
    }
  };

  const handleOpenRejectPanel = (cand) => {
    setActiveActionApp({ app: cand, action: 'reject' });
    setRejectionReason(
      cand.missingSkills?.length
        ? `Lacks demonstrated proficiency in required role technologies: [${cand.missingSkills.join(', ')}].`
        : 'Candidate evaluation score did not meet the minimum role threshold for this position.'
    );
    setConstructiveAdvice(
      cand.missingSkills?.length
        ? `Strengthen verified production experience in ${cand.missingSkills.slice(0, 3).join(', ')} to qualify for future openings.`
        : 'Gain additional hands-on tenure in related software engineering domains.'
    );
  };

  const handleOpenInterviewPanel = (cand) => {
    setActiveActionApp({ app: cand, action: 'interview' });
    setInterviewDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
    setInterviewTime('14:00');
    setInterviewType('video');
    setInterviewLocation('https://meet.google.com/xyz-recruiter');
    setInterviewNotes('');
  };

  const handleConfirmReject = async () => {
    if (!activeActionApp?.app) return;
    setSubmittingAction(true);
    try {
      await api.patch(`/employer/applications/${activeActionApp.app.applicationId}/status`, {
        status: 'rejected',
        rejectionReason,
        constructiveAdvice
      });
      setRankings((prev) =>
        prev.map((c) =>
          c.applicationId === activeActionApp.app.applicationId ? { ...c, status: 'rejected' } : c
        )
      );
      setActiveActionApp(null);
    } catch (err) {
      console.error('Failed to reject candidate', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!activeActionApp?.app) return;
    setSubmittingAction(true);

    try {
      await api.post(`/employer/applications/${activeActionApp.app.applicationId}/interview`, {
        date: interviewDate,
        time: interviewTime,
        type: interviewType,
        location: interviewLocation,
        notes: interviewNotes,
      });

      setRankings((prev) =>
        prev.map((a) =>
          a.applicationId === activeActionApp.app.applicationId
            ? { ...a, status: 'interview' }
            : a
        )
      );

      setActiveActionApp(null);
    } catch (err) {
      console.error('Failed to schedule interview', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSaveRubric = async () => {
    setSavingRubric(true);
    try {
      await api.patch(`/analysis/jobs/${jobId}/rubric`, {
        threshold: Number(threshold),
        rubricWeights,
        reanalyzeAll: true
      });
      setShowRubricPanel(false);
      await loadJobAndRankings();
    } catch (err) {
      console.error('Failed to save rubric', err);
    } finally {
      setSavingRubric(false);
    }
  };

  const handleToggleFairnessPanel = async () => {
    if (!showFairnessPanel && !fairnessData) {
      setFairnessLoading(true);
      try {
        const res = await api.get(`/analysis/jobs/${jobId}/fairness`);
        setFairnessData(res.data.data?.fairnessAudit || res.data?.fairnessAudit);
      } catch (err) {
        console.error('Failed to load fairness audit', err);
      } finally {
        setFairnessLoading(false);
      }
    }
    setShowFairnessPanel(!showFairnessPanel);
  };

  const getConfidenceBadge = (level) => {
    if (level === 'High') {
      return <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">High Confidence</span>;
    }
    if (level === 'Medium') {
      return <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">Medium Confidence</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">Moderate Evidence</span>;
  };

  const filteredRankings = rankings.filter((c) => {
    if (filterMode === 'shortlisted') return c.matchScore >= threshold || c.status === 'shortlisted';
    if (filterMode === 'not_shortlisted') return c.matchScore < threshold || c.status === 'rejected';
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in w-full pb-16">
        <CardSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full pb-20 font-sans text-slate-800">
      {/* Top Breadcrumb */}
      <Link
        to="/employer/jobs"
        className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-600 hover:text-accent-600 transition-colors font-extrabold"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Manage Jobs
      </Link>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl gradient-accent p-6 sm:p-8 text-white shadow-xl shadow-accent-500/10">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              Candidate Ranking & Decision Suite
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{job?.title || 'Job Applicants'}</h1>
            <p className="text-white/80 max-w-3xl text-xs sm:text-sm sm:leading-relaxed font-medium">
              Multi-criteria candidate evaluation across Technical Skills, Experience, Semantic Context, Projects, and Education.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRubricPanel(!showRubricPanel)}
              className="bg-white/15 hover:bg-white/25 text-white border-white/20 font-bold backdrop-blur-md text-xs sm:text-sm"
            >
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {showRubricPanel ? 'Hide Rubric' : `Rubric (${threshold}%)`}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleFairnessPanel}
              className="bg-white/15 hover:bg-white/25 text-white border-white/20 font-bold backdrop-blur-md text-xs sm:text-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-emerald-300" />
              {showFairnessPanel ? 'Hide Audit' : 'Fairness & Bias Audit'}
            </Button>
          </div>
        </div>
      </div>

      {/* IN-PAGE RUBRIC CONFIGURATOR PANEL */}
      {showRubricPanel && (
        <Card padding="md" className="border-2 border-accent-300 bg-white space-y-5 shadow-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-accent-500" />
              Configure Screening Rubric & Acceptance Threshold
            </h3>
            <button
              onClick={() => setShowRubricPanel(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕ Close
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                Minimum Acceptance Threshold ({threshold}%)
              </label>
              <input
                type="range"
                min="30"
                max="95"
                step="5"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-accent-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 font-bold mt-1.5">
                <span>30% (Inclusive)</span>
                <span>70% (Standard Benchmark)</span>
                <span>95% (Strict Senior)</span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                Multi-Criteria Weights (Total: 100%)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-700 mb-1 text-[11px] sm:text-xs">Technical Skills (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(rubricWeights.skillWeight * 100)}
                    onChange={(e) =>
                      setRubricWeights({ ...rubricWeights, skillWeight: Number(e.target.value) / 100 })
                    }
                    className="w-full p-1.5 sm:p-2 border border-slate-200 rounded-lg text-sm font-black text-slate-800"
                  />
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-700 mb-1 text-[11px] sm:text-xs">Experience (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(rubricWeights.experienceWeight * 100)}
                    onChange={(e) =>
                      setRubricWeights({ ...rubricWeights, experienceWeight: Number(e.target.value) / 100 })
                    }
                    className="w-full p-1.5 sm:p-2 border border-slate-200 rounded-lg text-sm font-black text-slate-800"
                  />
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-700 mb-1 text-[11px] sm:text-xs">Semantic (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(rubricWeights.semanticWeight * 100)}
                    onChange={(e) =>
                      setRubricWeights({ ...rubricWeights, semanticWeight: Number(e.target.value) / 100 })
                    }
                    className="w-full p-1.5 sm:p-2 border border-slate-200 rounded-lg text-sm font-black text-slate-800"
                  />
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-700 mb-1 text-[11px] sm:text-xs">Projects (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(rubricWeights.projectWeight * 100)}
                    onChange={(e) =>
                      setRubricWeights({ ...rubricWeights, projectWeight: Number(e.target.value) / 100 })
                    }
                    className="w-full p-1.5 sm:p-2 border border-slate-200 rounded-lg text-sm font-black text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setShowRubricPanel(false)}>
                Cancel
              </Button>
              <Button size="sm" loading={savingRubric} onClick={handleSaveRubric} className="font-bold text-xs sm:text-sm">
                Save & Re-Rank
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* IN-PAGE FAIRNESS AUDIT PANEL */}
      {showFairnessPanel && (
        <Card padding="md" className="border-2 border-emerald-300 bg-white space-y-4 shadow-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base sm:text-lg font-black text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Fairness & Anti-Bias Audit Dashboard
            </h3>
            <button
              onClick={() => setShowFairnessPanel(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕ Close
            </button>
          </div>

          {fairnessLoading ? (
            <div className="py-6 text-center">
              <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : fairnessData ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                <ShieldCheck className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm sm:text-base">{fairnessData.status}</h4>
                  <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                    Zero-demographic bias verified: candidate names, contact details, pronouns, and graduation years were scrubbed prior to scoring.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Selection Rate</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{fairnessData.overallSelectionRate}%</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Average Score</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{fairnessData.averageScore} pts</p>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="flex items-center gap-3 p-3.5 sm:p-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase truncate">Total Applicants</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{rankings.length}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-3.5 sm:p-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase truncate">Shortlisted (≥{threshold}%)</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700">
              {rankings.filter((c) => c.matchScore >= threshold || c.status === 'shortlisted').length}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-3.5 sm:p-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase truncate">Below Threshold</p>
            <p className="text-xl sm:text-2xl font-black text-rose-700">
              {rankings.filter((c) => c.matchScore < threshold && c.status !== 'shortlisted').length}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-3.5 sm:p-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Target className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase truncate">Active Threshold</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{threshold} pts</p>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-accent-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Applicants ({rankings.length})
          </button>
          <button
            onClick={() => setFilterMode('shortlisted')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
              filterMode === 'shortlisted'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Shortlisted (≥{threshold}%)
          </button>
          <button
            onClick={() => setFilterMode('not_shortlisted')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
              filterMode === 'not_shortlisted'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Below Threshold (&lt;{threshold}%)
          </button>
        </div>

        <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">Ranked by Composite AI Match Score & Evidence Index</p>
      </div>

      {/* IN-PAGE REJECT CANDIDATE ACTION PANEL */}
      {activeActionApp?.action === 'reject' && (
        <Card padding="md" className="border-2 border-rose-300 bg-rose-50/40 space-y-4 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between border-b border-rose-200 pb-3">
            <h3 className="text-base sm:text-lg font-black text-rose-950 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Reject Candidate & Send Feedback: {activeActionApp.app.name}</span>
            </h3>
            <button
              onClick={() => setActiveActionApp(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕ Close
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            The candidate will immediately receive this constructive feedback explaining why they were not shortlisted and what areas they should focus on.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Rejection Reason (Delivered to Candidate)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-400 text-slate-800 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Constructive Remediation & Growth Advice (Delivered to Candidate)
              </label>
              <textarea
                rows={3}
                value={constructiveAdvice}
                onChange={(e) => setConstructiveAdvice(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-400 text-slate-800 shadow-2xs font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-rose-200">
            <Button variant="secondary" size="sm" onClick={() => setActiveActionApp(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={submittingAction}
              onClick={handleConfirmReject}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md"
            >
              Confirm Rejection & Send Feedback
            </Button>
          </div>
        </Card>
      )}

      {/* IN-PAGE SCHEDULE INTERVIEW ACTION PANEL */}
      {activeActionApp?.action === 'interview' && (
        <Card padding="md" className="border-2 border-accent-300 bg-white space-y-4 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent-500 shrink-0" />
              <span>Schedule Interview: {activeActionApp.app.name}</span>
            </h3>
            <button
              onClick={() => setActiveActionApp(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleScheduleInterview} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Interview Date</label>
                <input
                  type="date"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Interview Time</label>
                <input
                  type="time"
                  required
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Interview Medium</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
              >
                <option value="video">Video Conference (Google Meet / Zoom)</option>
                <option value="phone">Phone Screening</option>
                <option value="in-person">In-Person Office Assessment</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Meeting Link or Location</label>
              <input
                type="text"
                value={interviewLocation}
                onChange={(e) => setInterviewLocation(e.target.value)}
                placeholder="https://meet.google.com/xyz or Office address"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" type="button" onClick={() => setActiveActionApp(null)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" loading={submittingAction} className="font-bold text-xs sm:text-sm">
                Send Invitation
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Candidate Ranking Leaderboard */}
      {filteredRankings.length === 0 ? (
        <Card padding="lg" className="text-center py-16">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">No applicants found for this filter.</p>
        </Card>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-4 text-center w-16">Rank</th>
                    <th className="py-4 px-4">Candidate Profile</th>
                    <th className="py-4 px-4">Resume</th>
                    <th className="py-4 px-4">Match Score</th>
                    <th className="py-4 px-4">Confidence</th>
                    <th className="py-4 px-4">Threshold</th>
                    <th className="py-4 px-4">Decision</th>
                    <th className="py-4 px-4 text-right">Recruiter Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRankings.map((c) => (
                    <tr key={c.applicationId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Rank */}
                      <td className="py-4 px-4 text-center font-bold">
                        {c.rank === 1 && <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black">🥇 #1</span>}
                        {c.rank === 2 && <span className="inline-block px-2.5 py-1 bg-slate-200 text-slate-800 rounded-lg text-xs font-black">🥈 #2</span>}
                        {c.rank === 3 && <span className="inline-block px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-black">🥉 #3</span>}
                        {c.rank > 3 && <span className="text-slate-500 font-bold text-xs">#{c.rank}</span>}
                      </td>

                      {/* Candidate Name & Contact */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{c.name}</div>
                        <div className="text-xs text-slate-400 font-medium">{c.email}</div>
                      </td>

                      {/* Candidate Resume Link */}
                      <td className="py-4 px-4">
                        {c.resumeUrl ? (
                          <a
                            href={c.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-700 hover:text-emerald-700 text-xs font-extrabold transition-all shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Resume</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ) : (
                          <Link
                            to={`/employer/applications/${c.applicationId}/analysis`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold hover:text-slate-700"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Profile Text</span>
                          </Link>
                        )}
                      </td>

                      {/* Match Score */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                c.matchScore >= threshold ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${c.matchScore}%` }}
                            />
                          </div>
                          <span className="font-black text-sm text-slate-900">{c.matchScore}%</span>
                        </div>
                      </td>

                      {/* Confidence */}
                      <td className="py-4 px-4">{getConfidenceBadge(c.confidenceLevel)}</td>

                      {/* Threshold */}
                      <td className="py-4 px-4">
                        {c.matchScore >= threshold ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Passed (+{c.scoreDifference})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl shadow-2xs">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Shortfall ({c.scoreDifference})
                          </span>
                        )}
                      </td>

                      {/* Decision Status */}
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            c.status === 'shortlisted'
                              ? 'success'
                              : c.status === 'interview'
                              ? 'success'
                              : c.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {c.status === 'interview' ? 'Interview' : c.status?.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Detailed AI Report */}
                          <Link to={`/employer/applications/${c.applicationId}/analysis`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="font-bold text-xs shadow-2xs py-1.5 px-2.5"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-accent-600" />
                              AI Report
                            </Button>
                          </Link>

                          {/* Shortlist Action */}
                          <button
                            onClick={() => handleShortlistCandidate(c)}
                            title="Shortlist Candidate"
                            className="px-2.5 py-1.5 text-xs font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl transition-all shadow-2xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Shortlist
                          </button>

                          {/* Interview Action */}
                          <button
                            onClick={() => handleOpenInterviewPanel(c)}
                            title="Schedule Interview"
                            className="px-2.5 py-1.5 text-xs font-extrabold bg-accent-50 hover:bg-accent-100 text-accent-800 border border-accent-300 rounded-xl transition-all shadow-2xs flex items-center gap-1"
                          >
                            <Calendar className="w-3.5 h-3.5 text-accent-600" />
                            Interview
                          </button>

                          {/* Reject Action */}
                          <button
                            onClick={() => handleOpenRejectPanel(c)}
                            title="Reject and Send Feedback"
                            className="px-2.5 py-1.5 text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl transition-all shadow-2xs flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="block md:hidden space-y-4">
            {filteredRankings.map((c) => (
              <Card
                key={c.applicationId}
                padding="md"
                className="border-2 border-slate-200 bg-white space-y-3.5 shadow-2xs"
              >
                {/* Header: Rank + Name + Decision Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">
                      {c.rank === 1 && <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black">🥇 #1</span>}
                      {c.rank === 2 && <span className="px-2 py-1 bg-slate-200 text-slate-800 rounded-lg text-xs font-black">🥈 #2</span>}
                      {c.rank === 3 && <span className="px-2 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-black">🥉 #3</span>}
                      {c.rank > 3 && <span className="text-slate-500 font-bold text-xs">#{c.rank}</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 text-sm truncate">{c.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium truncate">{c.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      c.status === 'shortlisted'
                        ? 'success'
                        : c.status === 'interview'
                        ? 'success'
                        : c.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                    className="shrink-0 text-[10px]"
                  >
                    {c.status === 'interview' ? 'Interview' : c.status?.toUpperCase()}
                  </Badge>
                </div>

                {/* Match Score & Status Info */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">AI Match Score</span>
                    <span className="font-black text-slate-900">{c.matchScore}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.matchScore >= threshold ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${c.matchScore}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    {getConfidenceBadge(c.confidenceLevel)}
                    {c.matchScore >= threshold ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Passed (+{c.scoreDifference})
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Shortfall ({c.scoreDifference})
                      </span>
                    )}
                  </div>
                </div>

                {/* Resume & Details Button Row */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {c.resumeUrl ? (
                    <a
                      href={c.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      View Resume
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : (
                    <Link
                      to={`/employer/applications/${c.applicationId}/analysis`}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Profile Text
                    </Link>
                  )}

                  <Link
                    to={`/employer/applications/${c.applicationId}/analysis`}
                    className="w-full"
                  >
                    <Button variant="secondary" size="sm" className="w-full font-bold text-xs py-2">
                      <Eye className="w-3.5 h-3.5 mr-1 text-accent-600" />
                      AI Report
                    </Button>
                  </Link>
                </div>

                {/* Recruiter Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleShortlistCandidate(c)}
                    className="py-2 px-1 text-[11px] font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Shortlist
                  </button>

                  <button
                    onClick={() => handleOpenInterviewPanel(c)}
                    className="py-2 px-1 text-[11px] font-extrabold bg-accent-50 hover:bg-accent-100 text-accent-800 border border-accent-300 rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <Calendar className="w-3 h-3 text-accent-600" />
                    Interview
                  </button>

                  <button
                    onClick={() => handleOpenRejectPanel(c)}
                    className="py-2 px-1 text-[11px] font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3 h-3 text-rose-600" />
                    Reject
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

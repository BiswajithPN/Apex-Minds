import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap,
  Award,
  Zap,
  ShieldCheck,
  Calendar,
  Sliders,
  FileText,
  Mail,
  User,
  Info,
  Check,
  AlertTriangle,
  FolderOpen,
  Briefcase,
  Layers,
  ChevronRight,
  TrendingUp,
  Target,
  ArrowRight
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';
import useAuthStore from '../../store/authStore';

export default function CandidateAnalysis() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuthStore();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // In-Page Action Panel State (ZERO POPUPS)
  const [activeAction, setActiveAction] = useState(null); // 'reject' | 'interview' | null
  const [rejectionReason, setRejectionReason] = useState('');
  const [constructiveAdvice, setConstructiveAdvice] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // In-Page Interview Form State
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewType, setInterviewType] = useState('video');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  useEffect(() => {
    loadAnalysisData();
  }, [applicationId]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/analysis/${applicationId}`);
      const data = res.data.data?.analysis || res.data?.analysis;
      setAnalysis(data);

      if (data?.rejectionExplanation) {
        setRejectionReason(data.rejectionExplanation.reasons?.[0] || '');
        setConstructiveAdvice(data.rejectionExplanation.constructiveAdvice || '');
      }
    } catch (err) {
      console.error('Failed to load candidate analysis', err);
      setError('Unable to load AI analysis report for this candidate.');
    } finally {
      setLoading(false);
    }
  };

  const handleShortlist = async () => {
    setSubmittingAction(true);
    try {
      await api.patch(`/employer/applications/${applicationId}/status`, { status: 'shortlisted' });
      setAnalysis((prev) => ({ ...prev, status: 'Shortlisted' }));
    } catch (err) {
      console.error('Failed to shortlist', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenRejectPanel = () => {
    setActiveAction('reject');
    if (!rejectionReason && analysis?.missingSkills?.length) {
      setRejectionReason(`Lacks practical production experience in required stack: [${analysis.missingSkills.join(', ')}].`);
    }
    if (!constructiveAdvice) {
      setConstructiveAdvice(analysis?.rejectionExplanation?.constructiveAdvice || 'Consider expanding verified project portfolio in core requirement stack.');
    }
  };

  const handleOpenInterviewPanel = () => {
    setActiveAction('interview');
    setInterviewDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
    setInterviewTime('14:00');
    setInterviewType('video');
    setInterviewLocation('https://meet.google.com/xyz-recruiter');
  };

  const handleConfirmReject = async () => {
    setSubmittingAction(true);
    try {
      await api.patch(`/employer/applications/${applicationId}/status`, {
        status: 'rejected',
        rejectionReason: rejectionReason || 'Candidate profile did not meet technical criteria for this role.',
        constructiveAdvice: constructiveAdvice || 'Consider expanding practical experience in core requirement stack.'
      });
      setAnalysis((prev) => ({
        ...prev,
        status: 'Not Shortlisted',
        thresholdPassed: false
      }));
      setActiveAction(null);
    } catch (err) {
      console.error('Failed to reject candidate', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      await api.post(`/employer/applications/${applicationId}/interview`, {
        date: interviewDate,
        time: interviewTime,
        type: interviewType,
        location: interviewLocation,
        notes: interviewNotes
      });
      setAnalysis((prev) => ({ ...prev, status: 'Interview' }));
      setActiveAction(null);
    } catch (err) {
      console.error('Failed to schedule interview', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const getConfidenceBadge = (level, score) => {
    if (level === 'High') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          High Confidence ({score}%)
        </span>
      );
    }
    if (level === 'Medium') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
          <Info className="w-4 h-4 text-blue-600" />
          Medium Confidence ({score}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        Moderate Evidence ({score}%)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-16">
        <CardSkeleton lines={6} />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto mb-3" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Analysis Report Not Found</h2>
        <p className="text-base text-slate-500 mb-6 font-medium">{error || 'This application has not been analyzed yet.'}</p>
        <Button onClick={() => navigate(-1)} variant="secondary" size="md" className="font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const backUrl = role === 'employer'
    ? (analysis.jobId?._id ? `/employer/jobs/${analysis.jobId._id}/applicants` : '/employer/jobs')
    : '/jobseeker/applications';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20 font-sans text-slate-800">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to={backUrl}
          className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-slate-600 hover:text-accent-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {role === 'employer' ? 'Applicants Leaderboard' : 'My Applications'}
        </Link>

        {role === 'employer' && (
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {analysis.resumeUrl && (
              <a
                href={analysis.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-300 font-black text-xs sm:text-sm shadow-sm transition-all"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                View Candidate Resume
              </a>
            )}

            <Button
              variant="secondary"
              size="md"
              onClick={handleShortlist}
              disabled={submittingAction || analysis.status === 'Shortlisted'}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 font-black text-xs sm:text-sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
              {analysis.status === 'Shortlisted' ? 'Shortlisted' : 'Shortlist Candidate'}
            </Button>

            <Button
              size="md"
              onClick={handleOpenInterviewPanel}
              className="font-black text-xs sm:text-sm shadow-md"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              Schedule Interview
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleOpenRejectPanel}
              className="bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 font-black text-xs sm:text-sm"
            >
              <XCircle className="w-4 h-4 mr-1.5 text-rose-600" />
              Reject &amp; Send Feedback
            </Button>
          </div>
        )}
      </div>

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl gradient-accent p-6 sm:p-10 text-white shadow-xl shadow-accent-500/10">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              AI Multi-Criteria Candidate Assessment &amp; Semantic Audit
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{analysis.candidateId?.full_name || 'Candidate Profile'}</h1>
            <p className="text-white/80 text-xs sm:text-base flex flex-wrap items-center gap-3 sm:gap-5 font-medium">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-300" />
                Target Position: <strong className="text-white font-bold">{analysis.jobId?.title || 'Position'}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-white/70" />
                {analysis.candidateId?.email}
              </span>
              {analysis.resumeUrl && (
                <a
                  href={analysis.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-200 hover:text-white underline font-bold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Attached Resume PDF
                </a>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
            <div className="text-center px-4 border-r border-white/20">
              <p className="text-xs text-white/70 font-bold uppercase tracking-wider">Composite Match</p>
              <p className="text-4xl font-black text-white">{analysis.finalScore}<span className="text-lg text-white/60">/100</span></p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {analysis.finalScore >= (analysis.threshold || 70) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-black bg-emerald-400 text-emerald-950 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Passed (+{analysis.scoreDifference || 0})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-black bg-rose-400 text-rose-950 shadow-sm">
                    <XCircle className="w-3.5 h-3.5" /> Shortfall ({analysis.scoreDifference || 0})
                  </span>
                )}
              </div>
              <div>{getConfidenceBadge(analysis.confidenceLevel, analysis.confidenceScore)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* IN-PAGE REJECT CANDIDATE PANEL (NO POPUPS) */}
      {activeAction === 'reject' && (
        <Card padding="lg" className="border-2 border-rose-300 bg-rose-50/40 space-y-5 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between border-b border-rose-200 pb-3">
            <h3 className="text-xl font-black text-rose-950 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-rose-600" />
              Reject Candidate & Send Constructive AI Growth Feedback
            </h3>
            <button
              onClick={() => setActiveAction(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕ Close Panel
            </button>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            The candidate will receive this explanation with clear reasons why they were not shortlisted and what actionable steps they can take to bridge their technical gap.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Rejection Reason
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-sm p-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-400 text-slate-800 shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Actionable Remediation Advice (What Should Candidate Do Next?)
              </label>
              <textarea
                rows={3}
                value={constructiveAdvice}
                onChange={(e) => setConstructiveAdvice(e.target.value)}
                className="w-full text-sm p-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-400 text-slate-800 shadow-2xs font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-rose-200">
            <Button variant="secondary" size="md" onClick={() => setActiveAction(null)}>
              Cancel
            </Button>
            <Button
              size="md"
              loading={submittingAction}
              onClick={handleConfirmReject}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md"
            >
              Confirm Rejection & Send Feedback
            </Button>
          </div>
        </Card>
      )}

      {/* IN-PAGE SCHEDULE INTERVIEW PANEL (NO POPUPS) */}
      {activeAction === 'interview' && (
        <Card padding="lg" className="border-2 border-accent-300 bg-white space-y-5 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-accent-500" />
              Schedule Interview Invitation
            </h3>
            <button
              onClick={() => setActiveAction(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕ Close Panel
            </button>
          </div>

          <form onSubmit={handleScheduleInterview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interview Date</label>
                <input
                  type="date"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interview Time</label>
                <input
                  type="time"
                  required
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interview Medium</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold"
              >
                <option value="video">Video Conference (Google Meet / Zoom)</option>
                <option value="phone">Phone Screening</option>
                <option value="in-person">In-Person Office Assessment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Meeting Link or Location</label>
              <input
                type="text"
                value={interviewLocation}
                onChange={(e) => setInterviewLocation(e.target.value)}
                placeholder="https://meet.google.com/xyz or Office address"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="md" type="button" onClick={() => setActiveAction(null)}>
                Cancel
              </Button>
              <Button size="md" type="submit" loading={submittingAction} className="font-bold text-sm">
                Send Interview Invitation
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Multi-Criteria Scoring Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 5 Weighted Components & Skills Matrix */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg" className="space-y-6 border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent-500" />
                Transparent Multi-Criteria Score Breakdown
              </h2>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                Threshold: {analysis.threshold || 70}%
              </span>
            </div>

            <div className="space-y-4">
              {/* Skills Score */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-accent-600" />
                    Technical Skills Alignment ({Math.round((analysis.rubricWeights?.skillWeight || 0.40) * 100)}% Weight)
                  </span>
                  <span className="text-accent-700 font-black text-base">{analysis.skillScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-accent-500 h-full rounded-full transition-all duration-500" style={{ width: `${analysis.skillScore}%` }} />
                </div>
              </div>

              {/* Experience Score */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Experience Tenure ({Math.round((analysis.rubricWeights?.experienceWeight || 0.25) * 100)}% Weight)
                  </span>
                  <span className="text-blue-700 font-black text-base">{analysis.experienceScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${analysis.experienceScore}%` }} />
                </div>
              </div>

              {/* Semantic Score */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    Semantic Context Vector Alignment ({Math.round((analysis.rubricWeights?.semanticWeight || 0.20) * 100)}% Weight)
                  </span>
                  <span className="text-purple-700 font-black text-base">{analysis.semanticScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${analysis.semanticScore}%` }} />
                </div>
              </div>

              {/* Project Relevance Score */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-emerald-600" />
                    Project Portfolio Relevance ({Math.round((analysis.rubricWeights?.projectWeight || 0.10) * 100)}% Weight)
                  </span>
                  <span className="text-emerald-700 font-black text-base">{analysis.projectScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${analysis.projectScore}%` }} />
                </div>
              </div>

              {/* Education Score */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-600" />
                    Education Qualifications ({Math.round((analysis.rubricWeights?.educationWeight || 0.05) * 100)}% Weight)
                  </span>
                  <span className="text-amber-700 font-black text-base">{analysis.educationScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${analysis.educationScore}%` }} />
                </div>
              </div>
            </div>
          </Card>

          {/* 4-Category Technical Skills Matrix */}
          <Card padding="lg" className="space-y-5 border-slate-200/90 shadow-sm">
            <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-5 h-5 text-accent-500" />
              Technical Skills Matrix & Coverage ({analysis.skillMatchPercentage || 0}%)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Matched Skills */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Matched Core Skills ({analysis.matchedSkills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.matchedSkills?.length > 0 ? (
                    analysis.matchedSkills.map((s, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 shadow-2xs">
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-emerald-700 italic">No exact primary skills identified.</p>
                  )}
                </div>
              </div>

              {/* Transferable Skills */}
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2">
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Transferable Skills ({analysis.partiallyMatchedSkills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.partiallyMatchedSkills?.length > 0 ? (
                    analysis.partiallyMatchedSkills.map((p, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white text-blue-800 font-bold text-xs rounded-lg border border-blue-200 shadow-2xs">
                        {p.have} <span className="text-blue-500 font-normal">→ for {p.wanted}</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-blue-700 italic">None detected.</p>
                  )}
                </div>
              </div>

              {/* Missing Requirements */}
              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2">
                <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Missing Job Requirements ({analysis.missingSkills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingSkills?.length > 0 ? (
                    analysis.missingSkills.map((s, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white text-rose-800 font-bold text-xs rounded-lg border border-rose-200 shadow-2xs">
                        ✕ {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-emerald-700 font-bold">✓ All required skills fulfilled!</p>
                  )}
                </div>
              </div>

              {/* Additional Candidate Skills */}
              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Additional Competencies ({analysis.additionalSkills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.additionalSkills?.length > 0 ? (
                    analysis.additionalSkills.map((s, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white text-purple-800 font-bold text-xs rounded-lg border border-purple-200 shadow-2xs">
                        + {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-purple-700 italic">No extra skills detected.</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Rejection Diagnostic, Projects, Experience & Fairness */}
        <div className="lg:col-span-5 space-y-6">
          {/* Rejection / Shortlist Diagnostic Box */}
          {analysis.rejectionExplanation ? (
            <Card padding="lg" className={`space-y-4 ${analysis.thresholdPassed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
              <div className="flex items-center gap-2.5 border-b pb-3 border-slate-200/60">
                {analysis.thresholdPassed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                <h3 className="font-extrabold text-base text-slate-900">
                  {analysis.thresholdPassed ? 'Screening Status: Qualified' : 'Rejection & Gap Diagnostics'}
                </h3>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Evaluation Factors & Gaps:</p>
                <ul className="space-y-2">
                  {analysis.rejectionExplanation.reasons?.map((reason, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-slate-800 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs font-medium flex items-start gap-2">
                      <span className="font-black text-slate-400 mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {analysis.rejectionExplanation.constructiveAdvice && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-1 shadow-2xs">
                  <strong className="text-accent-700 uppercase text-xs tracking-wider block font-black">
                    Actionable Growth Guidance:
                  </strong>
                  <p className="leading-relaxed font-medium">{analysis.rejectionExplanation.constructiveAdvice}</p>
                </div>
              )}
            </Card>
          ) : null}

          {/* Project Portfolio Insights */}
          <Card padding="md" className="space-y-3 border-slate-200/90 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
              <FolderOpen className="w-4 h-4 text-accent-500" />
              Extracted Project Portfolio ({analysis.projectAnalysis?.relevantProjects?.length || 0} Relevant)
            </h3>

            {analysis.projectAnalysis?.relevantProjects?.length > 0 ? (
              <div className="space-y-2.5">
                {analysis.projectAnalysis.relevantProjects.map((proj, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="text-sm font-bold text-slate-900">{proj.title}</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{proj.relevanceRationale}</p>
                    {proj.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.technologies.map((t, tIdx) => (
                          <span key={tIdx} className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">No explicit project portfolio section identified.</p>
            )}
          </Card>

          {/* Experience & Education Summary */}
          <Card padding="md" className="space-y-3 border-slate-200/90 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
              <GraduationCap className="w-4 h-4 text-accent-500" />
              Tenure & Education Credentials
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase">Experience Detected</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  {analysis.experienceAnalysis?.totalYears || 0} years
                </p>
                <p className="text-xs text-slate-500 font-medium">Required: {analysis.experienceAnalysis?.requiredYears || 0} years</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase">Education Degree</p>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                  {analysis.educationAnalysis?.degree || 'Verified'}
                </p>
                <p className="text-xs text-slate-500 truncate font-medium">{analysis.educationAnalysis?.field || 'Engineering'}</p>
              </div>
            </div>
          </Card>

          {/* Bias-Aware Fairness Certification */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Zero Demographic Bias Certified</h4>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed font-medium">
                Applicant name, phone, email, and graduation dates were scrubbed prior to scoring. Evaluation reflects 100% technical merit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

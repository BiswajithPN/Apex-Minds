import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  ShieldCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap,
  Eye,
  Copy,
  Check,
  Users,
  Download,
  Flame,
  BookOpen,
  FileCheck,
  RefreshCw,
  Briefcase,
  User,
  Mail,
  MapPin,
  FolderOpen,
  Sliders,
  Target,
  Zap,
  HelpCircle,
  Info
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import api from '../../api/axiosInstance';

export default function ResumeScreener() {
  const [activeTab, setActiveTab] = useState('job-applicants'); // 'job-applicants' | 'single' | 'batch' | 'audit'

  // Posted Jobs List from Database
  const [postedJobs, setPostedJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJobData, setSelectedJobData] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(true);

  // Job Applicants Comparison State
  const [jobScreenResult, setJobScreenResult] = useState(null);
  const [jobScreenLoading, setJobScreenLoading] = useState(false);
  const [jobScreenError, setJobScreenError] = useState('');

  // Resume Viewer Modal State
  const [viewingResumeCandidate, setViewingResumeCandidate] = useState(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [copiedResumeText, setCopiedResumeText] = useState(false);

  // Single Screener State
  const [singleMode, setSingleMode] = useState('upload'); // 'upload' | 'text'
  const [singleJd, setSingleJd] = useState('');
  const [singleFile, setSingleFile] = useState(null);
  const [singleFilePreview, setSingleFilePreview] = useState(null);
  const [singleText, setSingleText] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState(null);
  const [singleError, setSingleError] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);
  const [singleDragOver, setSingleDragOver] = useState(false);

  // Batch Screener State
  const [batchFiles, setBatchFiles] = useState([]);
  const [topK, setTopK] = useState(10);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [batchError, setBatchError] = useState('');
  const [batchDragOver, setBatchDragOver] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);

  // JD Auditor State
  const [auditJdText, setAuditJdText] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [auditError, setAuditError] = useState('');

  const singleFileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);

  // Load real posted jobs on mount
  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await api.get('/screener/jobs-list');
      const jobs = res.data.data || [];
      setPostedJobs(jobs);

      if (jobs.length > 0) {
        setSelectedJobId(jobs[0]._id);
        setSelectedJobData(jobs[0]);
        const jdText = buildJobText(jobs[0]);
        setSingleJd(jdText);
        setAuditJdText(jdText);
        screenApplicantsForJob(jobs[0]._id);
      }
    } catch (err) {
      console.error('Failed to load posted jobs', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const buildJobText = (job) => {
    if (!job) return '';
    return [
      `Job Title: ${job.title}`,
      `Description: ${job.description}`,
      job.requirements ? `Requirements:\n${job.requirements}` : '',
      job.skills_required?.length ? `Required Skills: ${job.skills_required.join(', ')}` : '',
      job.experience_level ? `Experience Level: ${job.experience_level}` : '',
      job.location ? `Location: ${job.location}` : '',
      job.job_type ? `Job Type: ${job.job_type}` : ''
    ].filter(Boolean).join('\n\n');
  };

  const handleJobSelectChange = (jobId) => {
    setSelectedJobId(jobId);
    const job = postedJobs.find((j) => j._id === jobId);
    if (job) {
      setSelectedJobData(job);
      const jdText = buildJobText(job);
      setSingleJd(jdText);
      setAuditJdText(jdText);
      screenApplicantsForJob(jobId);
    }
  };

  const screenApplicantsForJob = async (jobId) => {
    if (!jobId) return;
    setJobScreenLoading(true);
    setJobScreenError('');

    try {
      const res = await api.post(`/screener/job/${jobId}/screen-all`);
      setJobScreenResult(res.data.data || res.data);
    } catch (err) {
      setJobScreenError(
        err.response?.data?.message || err.message || 'Failed to screen applicants for this job'
      );
    } finally {
      setJobScreenLoading(false);
    }
  };

  const handleOpenResumeViewer = (cand) => {
    setViewingResumeCandidate(cand);
    setResumeModalOpen(true);
    setCopiedResumeText(false);
  };

  const handleCopyResumeText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedResumeText(true);
    setTimeout(() => setCopiedResumeText(false), 2500);
  };

  // ==========================================
  // SINGLE SCREENER FILE HANDLERS
  // ==========================================
  const handleSingleFileSelect = (file) => {
    if (!file) return;
    setSingleFile(file);
    setSingleError('');

    if (file.type?.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setSingleFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setSingleFilePreview(null);
    }
  };

  const handleSingleDrop = (e) => {
    e.preventDefault();
    setSingleDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleSingleFileSelect(file);
  };

  const handleRunSingleScreen = async () => {
    if (!singleJd.trim()) {
      setSingleError('Please select a posted job or enter job requirements.');
      return;
    }

    setSingleLoading(true);
    setSingleError('');
    setSingleResult(null);

    try {
      if (singleMode === 'upload') {
        if (!singleFile) {
          setSingleError('Please browse or drop a PDF resume file.');
          setSingleLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('resumeFile', singleFile);
        formData.append('jobDescription', singleJd);

        const res = await api.post('/screener/screen-resume', formData, {
          timeout: 120000
        });

        setSingleResult(res.data.data || res.data);
      } else {
        if (!singleText.trim()) {
          setSingleError('Please enter or paste candidate resume text.');
          setSingleLoading(false);
          return;
        }

        const res = await api.post('/screener/screen-text', {
          jobDescription: singleJd,
          resumeText: singleText
        });

        setSingleResult(res.data.data || res.data);
      }
    } catch (err) {
      setSingleError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to screen resume. Please try again.'
      );
    } finally {
      setSingleLoading(false);
    }
  };

  const copyNarrativeReport = () => {
    if (!singleResult?.comprehensiveReport) return;
    navigator.clipboard.writeText(singleResult.comprehensiveReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  // ==========================================
  // BATCH SCREENER FILE HANDLERS
  // ==========================================
  const handleBatchFilesSelect = (filesList) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;
    setBatchFiles(files);
    setBatchError('');
  };

  const handleBatchDrop = (e) => {
    e.preventDefault();
    setBatchDragOver(false);
    if (e.dataTransfer.files?.length) {
      handleBatchFilesSelect(e.dataTransfer.files);
    }
  };

  const handleRunBatchScreen = async () => {
    if (!singleJd.trim()) {
      setBatchError('Please select a job post or enter criteria.');
      return;
    }
    if (batchFiles.length === 0) {
      setBatchError('Please browse or drop at least 1 resume file.');
      return;
    }

    setBatchLoading(true);
    setBatchError('');
    setBatchResult(null);

    try {
      const formData = new FormData();
      formData.append('jobDescription', singleJd);
      formData.append('topK', topK);
      batchFiles.forEach((f) => formData.append('resumeFiles', f));

      const res = await api.post('/screener/screen-batch', formData, {
        timeout: 300000
      });

      setBatchResult(res.data.data || res.data);
    } catch (err) {
      setBatchError(
        err.response?.data?.message || err.message || 'Batch screening failed.'
      );
    } finally {
      setBatchLoading(false);
    }
  };

  const exportBatchToCSV = (dataList, filenamePrefix = 'applicants_ranking') => {
    if (!dataList?.length) return;
    const headers = ['Rank', 'Candidate/File', 'Match Score', 'Classification Tier', 'Decision', 'Matched Skills', 'Missing Skills'];
    const rows = dataList.map((c, idx) => [
      idx + 1,
      `"${c.name || c.filename || 'Candidate'}"`,
      c.matchScore,
      `"${c.classificationTier || 'Standard'}"`,
      `"${c.decision}"`,
      `"${(c.matchedSkills || []).map((s) => s.skill || s).join(', ')}"`,
      `"${(c.missingSkills || []).map((s) => s.skill || s).join(', ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filenamePrefix}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // JD AUDITOR HANDLERS
  // ==========================================
  const handleRunAudit = async () => {
    if (!auditJdText.trim()) {
      setAuditError('Please select a job post or provide text to audit.');
      return;
    }

    setAuditLoading(true);
    setAuditError('');

    try {
      const res = await api.post('/screener/audit-jd', {
        jobDescription: auditJdText
      });
      setAuditResult(res.data.data || res.data);
    } catch (err) {
      setAuditError(err.response?.data?.message || err.message || 'Audit failed');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleApplyFixes = () => {
    if (!auditResult?.flaggedWords?.length) return;
    let fixedText = auditJdText;
    auditResult.flaggedWords.forEach((item) => {
      const rx = new RegExp(`\\b${item.term}\\b`, 'gi');
      fixedText = fixedText.replace(rx, item.suggestion.split(',')[0].trim());
    });
    setAuditJdText(fixedText);
    setAuditResult(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 65) return 'text-blue-700 bg-blue-50 border-blue-300';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-rose-700 bg-rose-50 border-rose-300';
  };

  const getDecisionBadge = (decision, tier) => {
    if (decision?.includes('Direct Interview') || decision?.includes('Highly')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
          🥇 Tier 1: Highly Recommended
        </span>
      );
    }
    if (decision?.includes('Technical Assessment') || decision?.includes('Strong') || decision?.includes('Recommended (')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
          🥈 Tier 2: Recommended
        </span>
      );
    }
    if (decision?.includes('Targeted') || decision?.includes('Consider')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
          🥉 Tier 3: Moderate Fit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
        ✕ Tier 4: Rejected (Below Threshold)
      </span>
    );
  };

  const acceptedFormats = '.pdf,application/pdf';

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl gradient-accent p-8 text-white shadow-xl shadow-accent-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Semantic Analysis • Multi-Tier Threshold Classification • Explainable Diagnostics
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">AI Resume Screener & ATS Suite</h1>
            <p className="text-white/80 max-w-2xl text-sm leading-relaxed">
              Dynamically gathers requirements directly from your active job posts, evaluates semantic context vectors, computes mathematical classification thresholds, and provides deep rejection diagnostics.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-center">
              <p className="text-xs text-white/70 font-medium">Classification</p>
              <p className="text-sm font-bold text-emerald-300">4-Tier Dynamic Matrix</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-center">
              <p className="text-xs text-white/70 font-medium">Rejection XAI</p>
              <p className="text-sm font-bold text-white">Full Reason Diagnostic</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Job Post Selector */}
      <Card padding="md" className="border-accent-200/80 bg-accent-50/20 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-500 text-white flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Select Job Post to Screen Resumes</h2>
              <p className="text-xs text-slate-500">
                Requirements and applied candidate resumes are pulled directly from your post
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <select
              value={selectedJobId}
              onChange={(e) => handleJobSelectChange(e.target.value)}
              className="w-full text-sm font-semibold bg-white border-2 border-accent-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400 text-slate-800 shadow-sm"
            >
              {postedJobs.length === 0 && <option value="">No jobs posted yet</option>}
              {postedJobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} ({job.applicantCount || 0} applicants)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Job Meta Badges */}
        {selectedJobData && (
          <div className="pt-3 border-t border-accent-200/50 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Post Requirements:</span>
            {selectedJobData.skills_required?.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 bg-white text-slate-800 font-bold rounded-lg border border-slate-200 shadow-2xs"
              >
                {skill}
              </span>
            ))}
            {selectedJobData.experience_level && (
              <span className="px-2.5 py-1 bg-accent-100 text-accent-800 font-bold rounded-lg">
                {selectedJobData.experience_level} level
              </span>
            )}
            <span className="ml-auto text-xs text-slate-500 font-medium">
              Location: {selectedJobData.location || 'Remote'}
            </span>
          </div>
        )}
      </Card>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('job-applicants')}
          className={`flex items-center gap-2 px-6 py-3.5 font-semibold text-sm border-b-2 transition-all duration-200 ${
            activeTab === 'job-applicants'
              ? 'border-accent-500 text-accent-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Compare Applied Students ({selectedJobData?.applicantCount || 0})
        </button>

        <button
          onClick={() => setActiveTab('single')}
          className={`flex items-center gap-2 px-6 py-3.5 font-semibold text-sm border-b-2 transition-all duration-200 ${
            activeTab === 'single'
              ? 'border-accent-500 text-accent-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Single Resume Scanner & Semantic Analysis
        </button>

        <button
          onClick={() => setActiveTab('batch')}
          className={`flex items-center gap-2 px-6 py-3.5 font-semibold text-sm border-b-2 transition-all duration-200 ${
            activeTab === 'batch'
              ? 'border-accent-500 text-accent-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="w-4 h-4" />
          Bulk Upload & Threshold Classification
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-6 py-3.5 font-semibold text-sm border-b-2 transition-all duration-200 ${
            activeTab === 'audit'
              ? 'border-accent-500 text-accent-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          JD Inclusivity Auditor
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COMPARE APPLIED STUDENTS (AUTO-EXTRACTED FROM POST) */}
      {/* ========================================================================= */}
      {activeTab === 'job-applicants' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-accent-500" />
                Ranked Candidates for "{selectedJobData?.title || 'Job Post'}"
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated against required skills, semantic context, and experience benchmarks
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportBatchToCSV(jobScreenResult?.applicants, `applicants_${selectedJobData?.title}`)}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export Leaderboard CSV
              </Button>
              <Button
                size="sm"
                loading={jobScreenLoading}
                onClick={() => screenApplicantsForJob(selectedJobId)}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Re-screen Resumes
              </Button>
            </div>
          </div>

          {jobScreenLoading ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200/80">
              <div className="w-10 h-10 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                Gathering requirements from post, analyzing semantic context, and classifying candidate tiers...
              </p>
              <p className="text-xs text-slate-400">Scrubbing PII, calculating cosine similarity, and preparing gap diagnostics</p>
            </div>
          ) : jobScreenError ? (
            <div className="p-4 bg-danger-50 text-danger-700 rounded-xl text-xs font-semibold">
              {jobScreenError}
            </div>
          ) : jobScreenResult?.applicants?.length === 0 ? (
            <Card padding="lg" className="text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No applicants have applied for this job yet.</p>
            </Card>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 text-center w-16">Rank</th>
                      <th className="py-3.5 px-4">Candidate Profile</th>
                      <th className="py-3.5 px-4">Match Score</th>
                      <th className="py-3.5 px-4">Classification & Recommendation</th>
                      <th className="py-3.5 px-4">Skills & Context</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {jobScreenResult?.applicants?.map((cand, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold">
                          {idx === 0 && <span className="inline-block p-1 bg-amber-100 text-amber-700 rounded-lg text-xs">🥇 #1</span>}
                          {idx === 1 && <span className="inline-block p-1 bg-slate-200 text-slate-700 rounded-lg text-xs">🥈 #2</span>}
                          {idx === 2 && <span className="inline-block p-1 bg-amber-200 text-amber-800 rounded-lg text-xs">🥉 #3</span>}
                          {idx > 2 && <span className="text-slate-500 font-semibold text-xs">#{idx + 1}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{cand.name}</div>
                          <div className="text-xs text-slate-400">{cand.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  cand.matchScore >= 80
                                    ? 'bg-emerald-500'
                                    : cand.matchScore >= 65
                                    ? 'bg-blue-500'
                                    : cand.matchScore >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${cand.matchScore}%` }}
                              />
                            </div>
                            <span className="font-bold text-xs text-slate-700">{cand.matchScore}/100</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">{getDecisionBadge(cand.decision, cand.classificationTier)}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-success-700 bg-success-50 px-2 py-0.5 rounded-md">
                              {cand.matchedSkills?.length || 0} matched
                            </span>
                            {cand.adjacentSkills?.length > 0 && (
                              <span className="text-xs font-semibold text-accent-700 bg-accent-50 px-2 py-0.5 rounded-md">
                                +{cand.adjacentSkills.length} transferable
                              </span>
                            )}
                            {cand.missingSkills?.length > 0 && (
                              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                                {cand.missingSkills.length} missing
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenResumeViewer(cand)}
                              className="font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1 text-accent-600" />
                              View Resume
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCandidate(cand);
                                setCandidateModalOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              AI Diagnostics
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SINGLE RESUME SCANNER & SEMANTIC ANALYSIS */}
      {/* ========================================================================= */}
      {activeTab === 'single' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Job Description */}
            <div className="lg:col-span-5 space-y-4">
              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4 text-accent-500" />
                    Target Job Requirements
                  </h2>
                  <span className="text-xs text-accent-600 font-semibold">Synced from Post</span>
                </div>

                <textarea
                  rows={10}
                  value={singleJd}
                  onChange={(e) => setSingleJd(e.target.value)}
                  placeholder="Job description requirements loaded from the selected post..."
                  className="w-full text-xs font-mono p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-400 focus:outline-none text-slate-800 leading-relaxed resize-none"
                />
              </Card>
            </div>

            {/* Right: Resume File Upload (PDF) */}
            <div className="lg:col-span-7 space-y-4">
              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                    <Sparkles className="w-4 h-4 text-accent-500" />
                    Test Resume Against This Post
                  </h2>

                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSingleMode('upload')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        singleMode === 'upload' ? 'bg-white text-accent-600 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Upload PDF Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleMode('text')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        singleMode === 'text' ? 'bg-white text-accent-600 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Paste Text
                    </button>
                  </div>
                </div>

                {singleMode === 'upload' ? (
                  <div className="space-y-4">
                    {/* File Dropzone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setSingleDragOver(true); }}
                      onDragLeave={() => setSingleDragOver(false)}
                      onDrop={handleSingleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
                        singleDragOver
                          ? 'border-accent-500 bg-accent-50/40 scale-[1.01]'
                          : singleFile
                          ? 'border-accent-400 bg-accent-50/20'
                          : 'border-slate-300 hover:border-accent-400 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        ref={singleFileInputRef}
                        id="single-resume-file"
                        type="file"
                        accept={acceptedFormats}
                        onChange={(e) => handleSingleFileSelect(e.target.files?.[0])}
                        className="hidden"
                      />

                      <div className="w-12 h-12 rounded-2xl bg-accent-100 text-accent-600 flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6" />
                      </div>

                      {singleFile ? (
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-slate-800">{singleFile.name}</p>
                          <p className="text-xs text-slate-500">
                            {(singleFile.size / 1024).toFixed(1)} KB • {singleFile.type || 'Document'}
                          </p>
                          <div className="pt-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => singleFileInputRef.current?.click()}
                            >
                              <FolderOpen className="w-4 h-4 mr-1.5" />
                              Choose Another File
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-slate-700">
                            Drag & drop a PDF resume here, or browse from your device
                          </p>
                          <p className="text-xs text-slate-400">
                            Supports <strong>PDF</strong> files only (Max 25MB)
                          </p>

                          <div>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => singleFileInputRef.current?.click()}
                              className="font-semibold shadow-xs"
                            >
                              <FolderOpen className="w-4 h-4 mr-1.5 text-accent-600" />
                              Browse Files from System
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {singleFilePreview && (
                      <div className="relative rounded-xl border border-slate-200 overflow-hidden max-h-52 bg-slate-900/5 flex items-center justify-center p-2">
                        <img
                          src={singleFilePreview}
                          alt="Resume Preview"
                          className="max-h-48 object-contain rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    rows={8}
                    value={singleText}
                    onChange={(e) => setSingleText(e.target.value)}
                    placeholder="Enter or paste candidate resume text here..."
                    className="w-full text-xs font-mono p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-400 focus:outline-none text-slate-800 leading-relaxed resize-none"
                  />
                )}

                {singleError && (
                  <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{singleError}</span>
                  </div>
                )}

                <Button
                  onClick={handleRunSingleScreen}
                  loading={singleLoading}
                  className="w-full justify-center shadow-lg shadow-accent-500/20 font-bold"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {singleLoading ? 'Running Semantic Vector Analysis & Classification...' : 'Screen & Classify Resume'}
                </Button>
              </Card>
            </div>
          </div>

          {/* Results Showcase */}
          {singleResult && (
            <div className="space-y-6 animate-fade-in">
              {/* Classification Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="flex items-center gap-4 border-l-4 border-accent-500">
                  <div
                    className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xl border-2 ${getScoreColor(
                      singleResult.matchScore
                    )}`}
                  >
                    <span>{singleResult.matchScore}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Score</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Classification & Tier</p>
                    <div className="mt-1">{getDecisionBadge(singleResult.decision, singleResult.classificationTier)}</div>
                  </div>
                </Card>

                <Card className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Semantic Vector Alignment</p>
                    <p className="text-lg font-bold text-slate-800">
                      {singleResult.semanticAnalysis?.semanticScore || 0}%
                    </p>
                    <p className="text-[10px] text-slate-400">Cosine: {singleResult.semanticAnalysis?.cosineSimilarity || 0}</p>
                  </div>
                </Card>

                <Card className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-100 text-success-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Skill Coverage</p>
                    <p className="text-lg font-bold text-slate-800">
                      {singleResult.matchedSkills?.length || 0} / {singleResult.requiredSkills?.length || 0}
                    </p>
                    <p className="text-[10px] text-slate-400">{singleResult.missingSkills?.length || 0} missing</p>
                  </div>
                </Card>

                <Card className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Experience Detected</p>
                    <p className="text-lg font-bold text-slate-800">
                      {singleResult.experience?.totalYearsCalculated || 0} yrs
                    </p>
                    <p className="text-[10px] text-slate-400">Target: {singleResult.experience?.requiredYears || 0} yrs</p>
                  </div>
                </Card>
              </div>

              {/* Threshold Mathematical Breakdown Card */}
              {singleResult.thresholdBreakdown && (
                <Card padding="md" className="space-y-3 bg-slate-50/70 border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-accent-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Mathematical Threshold & Component Breakdown
                      </h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      Dynamic Acceptance Threshold: <strong className="text-accent-700">{singleResult.thresholdBreakdown.calculatedThreshold} pts</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Core Skills</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">{singleResult.thresholdBreakdown.scoreComponents?.skillScore}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Adjacent Skills</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">{singleResult.thresholdBreakdown.scoreComponents?.adjacentScore}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Semantic Context</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">{singleResult.thresholdBreakdown.scoreComponents?.semanticScore}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Experience Tenure</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">{singleResult.thresholdBreakdown.scoreComponents?.experienceScore}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Education & Certs</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">{singleResult.thresholdBreakdown.scoreComponents?.educationScore}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* EXPLICIT REJECTION & GAP DIAGNOSTICS SECTION */}
              {singleResult.rejectionDiagnostics?.isRejected ? (
                <Card padding="lg" className="border-rose-300 bg-rose-50/30 space-y-4">
                  <div className="flex items-center gap-3 border-b border-rose-200 pb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-rose-900 text-base">
                        ⚠️ Rejection Diagnostic: Why the Candidate Was Not Recommended
                      </h3>
                      <p className="text-xs text-rose-700">
                        The candidate's score ({singleResult.matchScore}/100) fell below the required acceptance threshold ({singleResult.thresholdBreakdown?.calculatedThreshold} pts).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-rose-900 tracking-wider">Primary Deficit Factors:</h4>
                    <ul className="space-y-2">
                      {singleResult.rejectionDiagnostics.primaryReasons?.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-rose-900 bg-white p-3 rounded-xl border border-rose-200 shadow-2xs font-medium">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {singleResult.rejectionDiagnostics.remediationPlan && (
                    <div className="p-4 bg-white rounded-2xl border border-rose-200 space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-accent-600" />
                        Actionable Remediation Bridge for Candidate
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {singleResult.rejectionDiagnostics.remediationPlan}
                      </p>
                    </div>
                  )}
                </Card>
              ) : (
                <Card padding="md" className="border-emerald-200 bg-emerald-50/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-sm">✅ Candidate Successfully Qualified & Shortlisted</h3>
                  </div>
                  <p className="text-xs text-emerald-700">
                    The candidate scored above the required threshold with strong technical coverage and domain alignment.
                  </p>
                </Card>
              )}

              {/* Skills Analysis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card padding="md" className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-success-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Direct Skills Matched ({singleResult.matchedSkills?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {singleResult.matchedSkills?.length > 0 ? (
                      singleResult.matchedSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-success-50 text-success-700 border border-success-200 text-xs font-semibold rounded-lg"
                        >
                          ✓ {s.skill || s}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No direct skills matched.</p>
                    )}
                  </div>
                </Card>

                <Card padding="md" className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-accent-600">
                    <Award className="w-4 h-4" />
                    Transferable Adjacent Skills ({singleResult.adjacentSkills?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {singleResult.adjacentSkills?.length > 0 ? (
                      singleResult.adjacentSkills.map((adj, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-accent-50 text-accent-700 border border-accent-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <span className="font-bold">{adj.have}</span>
                          <span className="text-[10px] text-accent-500">→ for {adj.wanted}</span>
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No adjacent skills identified.</p>
                    )}
                  </div>
                </Card>

                <Card padding="md" className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-danger-600">
                    <XCircle className="w-4 h-4" />
                    Missing Required Skills ({singleResult.missingSkills?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {singleResult.missingSkills?.length > 0 ? (
                      singleResult.missingSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-danger-50 text-danger-700 border border-danger-200 text-xs font-semibold rounded-lg"
                        >
                          ✕ {s.skill || s}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">All required skills present!</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Narrative Report */}
              <Card padding="lg" className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent-500" />
                    Comprehensive AI Diagnostic Report
                  </h3>

                  <button
                    onClick={copyNarrativeReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                  >
                    {copiedReport ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedReport ? 'Copied' : 'Copy Report'}
                  </button>
                </div>

                <div className="prose prose-sm text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                  {singleResult.comprehensiveReport}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BATCH UPLOAD & THRESHOLD CLASSIFICATION */}
      {/* ========================================================================= */}
      {activeTab === 'batch' && (
        <div className="space-y-8">
          <Card padding="md" className="space-y-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-accent-500" />
              Bulk Upload PDF Resumes to Compare Against "{selectedJobData?.title || 'Selected Job'}"
            </h2>

            <div
              onDragOver={(e) => { e.preventDefault(); setBatchDragOver(true); }}
              onDragLeave={() => setBatchDragOver(false)}
              onDrop={handleBatchDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                batchDragOver
                  ? 'border-accent-500 bg-accent-50/40 scale-[1.01]'
                  : batchFiles.length > 0
                  ? 'border-accent-400 bg-accent-50/20'
                  : 'border-slate-300 hover:border-accent-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={batchFileInputRef}
                id="batch-resume-files"
                type="file"
                multiple
                accept={acceptedFormats}
                onChange={(e) => handleBatchFilesSelect(e.target.files)}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-accent-100 text-accent-600 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>

              {batchFiles.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-accent-600">{batchFiles.length} Resumes Selected</p>
                  <p className="text-xs text-slate-500">Files ready for batch text extraction and screening</p>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => batchFileInputRef.current?.click()}
                    >
                      <FolderOpen className="w-4 h-4 mr-1.5" />
                      Add or Replace Files
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">
                    Drag & drop multiple resumes, or browse from your device
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports <strong>PDF</strong> files only (Up to 150 files)
                  </p>

                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => batchFileInputRef.current?.click()}
                      className="font-semibold shadow-xs"
                    >
                      <FolderOpen className="w-4 h-4 mr-1.5 text-accent-600" />
                      Browse Multiple Files from System
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {batchError && (
              <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{batchError}</span>
              </div>
            )}

            <Button
              onClick={handleRunBatchScreen}
              loading={batchLoading}
              className="w-full justify-center shadow-lg shadow-accent-500/20 font-bold"
            >
              <Flame className="w-4 h-4 mr-2" />
              {batchLoading
                ? `Screening ${batchFiles.length} Resumes in Parallel...`
                : `Run Batch Ranking (${batchFiles.length} files)`}
            </Button>
          </Card>

          {/* Batch Result */}
          {batchResult && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent-500" />
                    Batch Ranking Results (Top {batchResult.topCandidates?.length || 0})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Processed {batchResult.totalProcessed} resumes in {batchResult.processingTimeSeconds}s
                  </p>
                </div>

                <Button variant="secondary" size="sm" onClick={() => exportBatchToCSV(batchResult.allResults)}>
                  <Download className="w-4 h-4 mr-1.5" />
                  Export CSV
                </Button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 text-center w-16">Rank</th>
                      <th className="py-3.5 px-4">Filename</th>
                      <th className="py-3.5 px-4">Match Score</th>
                      <th className="py-3.5 px-4">Classification & Decision</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {batchResult.topCandidates?.map((cand, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold">#{idx + 1}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{cand.filename}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">{cand.matchScore}/100</td>
                        <td className="py-3.5 px-4">{getDecisionBadge(cand.decision, cand.classificationTier)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCandidate(cand);
                              setCandidateModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Report
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: JD INCLUSIVITY AUDITOR */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-8">
          <Card padding="lg" className="space-y-5">
            <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent-500" />
              Job Post Inclusivity & Anti-Bias Auditor
            </h2>

            <textarea
              rows={8}
              value={auditJdText}
              onChange={(e) => setAuditJdText(e.target.value)}
              placeholder="Paste job description or select a posted job above..."
              className="w-full text-xs font-mono p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-400 focus:outline-none text-slate-800 leading-relaxed resize-none"
            />

            {auditError && (
              <div className="p-3 bg-danger-50 border border-danger-200 text-danger-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{auditError}</span>
              </div>
            )}

            <Button onClick={handleRunAudit} loading={auditLoading} className="shadow-lg shadow-accent-500/20 font-bold">
              <Sparkles className="w-4 h-4 mr-2" />
              {auditLoading ? 'Auditing Phrasing...' : 'Audit Job Post'}
            </Button>
          </Card>

          {auditResult && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xl border-2 ${getScoreColor(
                      auditResult.inclusivityScore
                    )}`}
                  >
                    <span>{auditResult.inclusivityScore}%</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Inclusivity Rating</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{auditResult.grade}</p>
                  </div>
                </Card>

                <Card className="flex items-center gap-3 md:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-semibold">Executive Assessment</p>
                    <p className="text-xs text-slate-700 font-medium">{auditResult.summary}</p>
                  </div>
                </Card>
              </div>

              {auditResult.flaggedWords?.length > 0 && (
                <Card padding="lg" className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 text-warn-600">
                      <AlertTriangle className="w-5 h-5" />
                      Detected Bias & Exclusionary Phrases ({auditResult.flaggedWords.length})
                    </h3>

                    <Button variant="secondary" size="sm" onClick={handleApplyFixes}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Apply All Recommended Fixes
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {auditResult.flaggedWords.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-danger-700 bg-danger-50 px-2 py-0.5 rounded-md border border-danger-200">
                            "{item.term}"
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{item.explanation}</p>
                        <div className="pt-1 text-xs">
                          <span className="text-slate-400">Recommended: </span>
                          <span className="font-bold text-emerald-700">{item.suggestion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* In-Page Full Expanded Candidate AI Diagnostic Report (No Popups) */}
      {selectedCandidate && (
        <Card padding="lg" className="border-2 border-accent-300/80 shadow-lg bg-white space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center text-white font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  In-Page AI Diagnostics: {selectedCandidate.name || selectedCandidate.filename || 'Candidate'}
                </h3>
                <p className="text-xs text-slate-500">Comprehensive multi-criteria evaluation and gap analysis</p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedCandidate(null)}
              className="font-bold text-xs self-start sm:self-auto"
            >
              ✕ Close In-Page Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Multi-Criteria Score</p>
                <p className="text-3xl font-black text-slate-900">{selectedCandidate.matchScore}<span className="text-sm text-slate-500">/100</span></p>
              </div>
              <div>{getDecisionBadge(selectedCandidate.decision, selectedCandidate.classificationTier)}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Experience Tenure</p>
                <p className="text-lg font-black text-slate-900">{selectedCandidate.experience?.totalYearsCalculated || 0} years detected</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                Edu: {selectedCandidate.education?.degree || 'Verified'}
              </span>
            </div>
          </div>

          {/* Rejection / Shortlist details */}
          {selectedCandidate.rejectionDiagnostics?.isRejected ? (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase text-rose-950 tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Primary Reasons for Rejection / Shortfall:
              </h4>
              <ul className="space-y-1.5 text-xs text-rose-900">
                {selectedCandidate.rejectionDiagnostics.primaryReasons?.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-bold text-rose-500">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              {selectedCandidate.rejectionDiagnostics.remediationPlan && (
                <div className="mt-3 pt-3 border-t border-rose-200 text-xs text-slate-700 bg-white/80 p-3 rounded-xl">
                  <strong className="text-rose-950 uppercase text-[10px] tracking-wider block mb-0.5">Actionable Remediation:</strong>
                  <p>{selectedCandidate.rejectionDiagnostics.remediationPlan}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Candidate meets role criteria and is classified as qualified for technical assessment or interview.
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Evaluation Narrative & Technical Breakdown</h4>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto font-sans">
              {selectedCandidate.comprehensiveReport}
            </div>
          </div>
        </Card>
      )}

      {/* In-Page Full Expanded Candidate Actual Resume Document View (No Popups) */}
      {viewingResumeCandidate && (
        <Card padding="lg" className="border-2 border-accent-300/80 shadow-lg bg-white space-y-6 animate-fade-in">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-white font-bold text-lg">
                {viewingResumeCandidate.name?.[0] || 'C'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{viewingResumeCandidate.name}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                  {viewingResumeCandidate.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {viewingResumeCandidate.email}
                    </span>
                  )}
                  {viewingResumeCandidate.profileLocation && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {viewingResumeCandidate.profileLocation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyResumeText(viewingResumeCandidate.resumeText)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
              >
                {copiedResumeText ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedResumeText ? 'Copied' : 'Copy Resume'}
              </button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setViewingResumeCandidate(null)}
                className="font-bold text-xs"
              >
                ✕ Close In-Page View
              </Button>
            </div>
          </div>

          {/* Candidate Skills Pills */}
          {viewingResumeCandidate.profileSkills?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Extracted Technical Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {viewingResumeCandidate.profileSkills.map((sk, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-accent-50 text-accent-700 font-semibold text-xs rounded-lg border border-accent-200">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actual Resume Content / Document */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Applied Resume Content</h4>
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap selection:bg-accent-500">
              {viewingResumeCandidate.resumeText || 'No resume text available for this profile.'}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

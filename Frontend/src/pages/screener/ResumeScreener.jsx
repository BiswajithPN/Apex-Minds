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
  Image,
  FolderOpen
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

    if (file.type.startsWith('image/')) {
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
          setSingleError('Please browse or drop a resume file (JPEG, PNG, or PDF).');
          setSingleLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('resumeFile', singleFile);
        formData.append('jobDescription', singleJd);

        const res = await api.post('/screener/screen-resume', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
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
        headers: { 'Content-Type': 'multipart/form-data' },
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
    const headers = ['Rank', 'Candidate/File', 'Match Score', 'Decision', 'Matched Skills', 'Missing Skills'];
    const rows = dataList.map((c, idx) => [
      idx + 1,
      `"${c.name || c.filename || 'Candidate'}"`,
      c.matchScore,
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
    if (score >= 75) return 'text-success-600 bg-success-50 border-success-200';
    if (score >= 50) return 'text-warn-600 bg-warn-50 border-warn-200';
    return 'text-danger-600 bg-danger-50 border-danger-200';
  };

  const getDecisionBadge = (decision) => {
    if (decision?.includes('Highly')) return <Badge variant="success">Highly Recommended</Badge>;
    if (decision?.includes('Consider')) return <Badge variant="warning">Consider with Screen</Badge>;
    return <Badge variant="danger">Not Recommended</Badge>;
  };

  const acceptedFormats = '.jpg,.jpeg,.png,.webp,.bmp,.pdf,image/jpeg,image/png,image/webp,image/bmp,application/pdf';

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl gradient-accent p-8 text-white shadow-xl shadow-accent-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              JPEG, PNG, WEBP & PDF Multi-Pass OCR Resume Screener Suite
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">AI Resume Screener & ATS Suite</h1>
            <p className="text-white/80 max-w-2xl text-sm leading-relaxed">
              Dynamically gathers requirements directly from your active job posts, compares all applied candidate resumes, and evaluates technical depth with zero demographic bias.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-center">
              <p className="text-xs text-white/70 font-medium">Formats Supported</p>
              <p className="text-sm font-bold text-emerald-300">JPEG • PNG • PDF</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-center">
              <p className="text-xs text-white/70 font-medium">Demographic Scrub</p>
              <p className="text-sm font-bold text-white">100% Blind Evaluation</p>
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
          Compare Applied Job Seekers ({selectedJobData?.applicantCount || 0})
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
          Single Resume Scanner (JPEG, PNG & PDF)
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
          Bulk Upload Resumes (10–150+)
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
      {/* TAB 1: COMPARE APPLIED JOB SEEKERS (AUTO-EXTRACTED FROM POST) */}
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
                Evaluated against the job's required skills ({selectedJobData?.skills_required?.join(', ') || 'N/A'})
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
                Gathering requirements from post and screening candidate resumes...
              </p>
              <p className="text-xs text-slate-400">Scrubbing PII, matching skills, and computing adjacent scores</p>
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
                      <th className="py-3.5 px-4">Recommendation</th>
                      <th className="py-3.5 px-4">Skills Coverage</th>
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
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  cand.matchScore >= 70
                                    ? 'bg-success-500'
                                    : cand.matchScore >= 50
                                    ? 'bg-warn-500'
                                    : 'bg-danger-500'
                                }`}
                                style={{ width: `${cand.matchScore}%` }}
                              />
                            </div>
                            <span className="font-bold text-xs text-slate-700">{cand.matchScore}/100</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">{getDecisionBadge(cand.decision)}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold text-success-700 bg-success-50 px-2 py-0.5 rounded-md">
                            {cand.matchedSkills?.length || 0} matched
                          </span>
                          {cand.adjacentSkills?.length > 0 && (
                            <span className="ml-1 text-xs font-semibold text-accent-700 bg-accent-50 px-2 py-0.5 rounded-md">
                              +{cand.adjacentSkills.length} transferable
                            </span>
                          )}
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
                              AI Report
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
      {/* TAB 2: SINGLE RESUME SCANNER (JPEG, PNG & PDF) */}
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

            {/* Right: Resume File Upload (JPEG / PNG / PDF) */}
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
                      Upload File (JPEG / PNG / PDF)
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
                    {/* Robust File Dropzone with Native Input and Explicit Browse Button */}
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
                        {singleFile?.type?.startsWith('image/') ? (
                          <Image className="w-6 h-6" />
                        ) : (
                          <Upload className="w-6 h-6" />
                        )}
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
                            Drag & drop resume here, or browse from your device
                          </p>
                          <p className="text-xs text-slate-400">
                            Supports <strong>JPEG (.jpg, .jpeg)</strong>, <strong>PNG (.png)</strong>, <strong>WEBP</strong>, and <strong>PDF</strong> (Max 25MB)
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
                  {singleLoading ? 'Running Multi-Pass OCR & Evaluation...' : 'Screen Against Selected Job Post'}
                </Button>
              </Card>
            </div>
          </div>

          {/* Results Showcase */}
          {singleResult && (
            <div className="space-y-6 animate-fade-in">
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
                    <p className="text-xs text-slate-500 font-semibold">Recommendation</p>
                    <div className="mt-1">{getDecisionBadge(singleResult.decision)}</div>
                  </div>
                </Card>

                <Card className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-100 text-success-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Matched Skills</p>
                    <p className="text-lg font-bold text-slate-800">
                      {singleResult.matchedSkills?.length || 0} / {singleResult.requiredSkills?.length || 0}
                    </p>
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
                  </div>
                </Card>

                <Card className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Education</p>
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {singleResult.education?.degree || 'Verified'}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Skills Analysis */}
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
                    Comprehensive Evaluation Report
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
      {/* TAB 3: BATCH UPLOAD (10–150+) */}
      {/* ========================================================================= */}
      {activeTab === 'batch' && (
        <div className="space-y-8">
          <Card padding="md" className="space-y-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-accent-500" />
              Bulk Upload Resumes (JPEG, PNG & PDF) to Compare Against "{selectedJobData?.title || 'Selected Job'}"
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
                  <p className="text-xs text-slate-500">Files ready for parallel OCR batch processing</p>
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
                    Supports <strong>JPEG (.jpg, .jpeg)</strong>, <strong>PNG (.png)</strong>, <strong>WEBP</strong>, and <strong>PDF</strong> (Up to 150 files)
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
                      <th className="py-3.5 px-4">Decision</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {batchResult.topCandidates?.map((cand, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold">#{idx + 1}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{cand.filename}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">{cand.matchScore}/100</td>
                        <td className="py-3.5 px-4">{getDecisionBadge(cand.decision)}</td>
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

      {/* Candidate AI Evaluation Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={candidateModalOpen}
          onClose={() => setCandidateModalOpen(false)}
          title={`AI Evaluation: ${selectedCandidate.name || selectedCandidate.filename || 'Candidate'}`}
          size="lg"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Match Score</p>
                <p className="text-2xl font-black text-slate-900">{selectedCandidate.matchScore}/100</p>
              </div>
              <div>{getDecisionBadge(selectedCandidate.decision)}</div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Evaluation Narrative</h4>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto">
                {selectedCandidate.comprehensiveReport}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Candidate Actual Resume Viewer Modal */}
      {viewingResumeCandidate && (
        <Modal
          isOpen={resumeModalOpen}
          onClose={() => setResumeModalOpen(false)}
          title={`Applied Resume: ${viewingResumeCandidate.name || 'Candidate'}`}
          size="lg"
        >
          <div className="space-y-5">
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
              </div>
            </div>

            {/* Candidate Skills Pills */}
            {viewingResumeCandidate.profileSkills?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Technical Skills</h4>
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
              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap selection:bg-accent-500">
                {viewingResumeCandidate.resumeText || 'No resume text available for this profile.'}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

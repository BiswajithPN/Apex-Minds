import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Briefcase,
  Mail,
  ExternalLink,
  ChevronDown,
  CircleX,
  Calendar,
  Star,
  Inbox,
} from 'lucide-react';
import { CardSkeleton } from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import api from '../../api/axiosInstance';

/* ── status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  reviewing:   { label: 'Reviewing',   color: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-400' },
  shortlisted: { label: 'Shortlisted', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  interview:   { label: 'Interview',   color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  accepted:    { label: 'Accepted',    color: 'bg-teal-100 text-teal-700 border-teal-200',      dot: 'bg-teal-500' },
  rejected:    { label: 'Rejected',    color: 'bg-rose-100 text-rose-700 border-rose-200',      dot: 'bg-rose-400' },
};

const STATUS_TABS = ['all', 'pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected'];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ScorePill({ score }) {
  if (score == null) return <span className="text-xs text-slate-400 font-medium">Not scored</span>;
  const color =
    score >= 75 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
    score >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  'text-rose-700 bg-rose-50 border-rose-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${color}`}>
      <Star className="w-3 h-3" />
      {score}%
    </span>
  );
}

function Avatar({ name = '' }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500'];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-sm shrink-0`}>
      {initials}
    </div>
  );
}

export default function AllApplicants() {
  const [applicants, setApplicants] = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // Filters
  const [search, setSearch]         = useState('');
  const [statusTab, setStatusTab]   = useState('all');
  const [jobFilter, setJobFilter]   = useState('all');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [appsRes, jobsRes] = await Promise.all([
        api.get('/employer/applicants'),
        api.get('/employer/jobs'),
      ]);
      setApplicants(appsRes.data?.applicants || []);
      setJobs(jobsRes.data?.jobs || []);
    } catch (err) {
      setError('Failed to load applicants. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return applicants.filter((a) => {
      const matchStatus = statusTab === 'all' || a.status === statusTab;
      const matchJob    = jobFilter === 'all' || String(a.job?._id) === jobFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.applicant?.name?.toLowerCase().includes(q) ||
        a.applicant?.email?.toLowerCase().includes(q) ||
        a.job?.title?.toLowerCase().includes(q);
      return matchStatus && matchJob && matchSearch;
    });
  }, [applicants, statusTab, jobFilter, search]);

  /* ── counts per status tab ─────────────────────────────────────────── */
  const counts = useMemo(() => {
    const c = { all: applicants.length };
    STATUS_TABS.slice(1).forEach((s) => {
      c[s] = applicants.filter((a) => a.status === s).length;
    });
    return c;
  }, [applicants]);

  /* ── update status optimistically ─────────────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in w-full pb-16">
        <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse" />
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20 font-sans text-slate-800">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100">
              <Users className="w-6 h-6 text-emerald-600" />
            </span>
            All Applicants
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {applicants.length} total applicant{applicants.length !== 1 ? 's' : ''} across {jobs.length} job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={loadAll}
          className="self-start sm:self-auto text-xs font-semibold text-slate-500 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 px-3 py-2 rounded-lg transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          <CircleX className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Search & Job filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or job title…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 transition-all"
          />
        </div>

        {/* Job filter */}
        <div className="relative min-w-[190px]">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-medium appearance-none focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 transition-all cursor-pointer"
          >
            <option value="all">All Jobs</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>{j.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Status tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => {
          const active = statusTab === s;
          const cfg = s === 'all' ? null : STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setStatusTab(s)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all
                ${active
                  ? s === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : `${cfg?.color} border-current font-bold shadow-sm`
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'}
              `}
            >
              {cfg && active && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${active ? 'bg-white/20' : 'bg-slate-100'}`}>
                {counts[s] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Applicant list ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-slate-100">
            <Inbox className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-bold text-slate-600">No applicants found</p>
          <p className="text-sm text-slate-400">
            {search || statusTab !== 'all' || jobFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Applicants will appear here once candidates apply to your jobs.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table header — desktop */}
          <div className="hidden lg:grid grid-cols-[2.5fr_1.8fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <span>Applicant</span>
            <span>Job</span>
            <span>Status</span>
            <span>AI Score</span>
            <span>Applied</span>
            <span>Resume</span>
          </div>

          {filtered.map((app) => (
            <ApplicantRow
              key={app._id}
              app={app}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Single applicant row ───────────────────────────────────────────────── */
function ApplicantRow({ app }) {
  const appliedDate = app.appliedAt
    ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1.8fr_1fr_1fr_1fr_auto] gap-3 lg:gap-4 items-center px-4 py-4">
        {/* Applicant */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={app.applicant?.name} />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{app.applicant?.name || 'Unknown'}</p>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1">
              <Mail className="w-3 h-3 shrink-0" />
              {app.applicant?.email || '—'}
            </p>
          </div>
        </div>

        {/* Job */}
        <div className="flex items-center gap-2 min-w-0">
          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-sm text-slate-600 font-medium truncate">{app.job?.title || '—'}</span>
        </div>

        {/* Status */}
        <div>
          <StatusBadge status={app.status} />
        </div>

        {/* Score */}
        <div>
          <ScorePill score={app.matchScore} />
        </div>

        {/* Applied date */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          {appliedDate}
        </div>

        {/* View Resume — only action shown */}
        <div className="flex justify-end">
          {app.applicant?.resumeUrl ? (
            <a
              href={app.applicant.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Resume
            </a>
          ) : (
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">No resume</span>
          )}
        </div>
      </div>
    </div>
  );
}

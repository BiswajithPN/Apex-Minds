import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Briefcase, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

const jobTypes = ['All', 'full-time', 'part-time', 'contract', 'remote', 'internship'];

export default function JobSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || 'All');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    loadJobs();
  }, [page, type]);

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 9 };
      if (search) params.search = search;
      if (type !== 'All') params.type = type;
      if (location) params.location = location;

      const { data } = await api.get('/jobs', { params });
      setJobs(data.jobs || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setJobs([]);
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to fetch job listings. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (loading) return;
    const params = {};
    if (search) params.q = search;
    if (type !== 'All') params.type = type;
    if (location) params.location = location;
    params.page = '1';
    setSearchParams(params);
    loadJobs();
  };

  const goToPage = (p) => {
    if (loading || p === page) return;
    const params = Object.fromEntries(searchParams.entries());
    params.page = String(p);
    setSearchParams(params);
  };

  const timeAgo = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Search Jobs</h1>
        <p className="text-sm text-slate-500 mt-1">Find your next opportunity</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={loadJobs}>Retry</Button>
        </div>
      )}

      {/* Search + Filters */}
      <Card padding="md" className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Job title, skills, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
            />
          </div>
          <div className="relative flex-1 sm:max-w-[200px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
            />
          </div>
          <Button type="submit" size="md" loading={loading}>
            <Search className="w-4 h-4" />
            Search
          </Button>
        </form>

        {/* Type filter pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {jobTypes.map((t) => (
            <button
              key={t}
              disabled={loading}
              onClick={() => {
                setType(t);
                const params = Object.fromEntries(searchParams.entries());
                if (t === 'All') delete params.type;
                else params.type = t;
                params.page = '1';
                setSearchParams(params);
              }}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                ${type === t
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Job Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} lines={3} />)}
        </div>
      ) : jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-semibold text-slate-700">No jobs found</p>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Link key={job._id} to={`/jobseeker/jobs/${job._id}`}>
                <Card hover padding="md" className="h-full flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-accent-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{job.title}</h3>
                      <p className="text-xs text-slate-500 truncate">{job.company?.name || job.employer?.name}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3 h-3" />
                      {job.location || 'Remote'}
                    </span>
                    <Badge variant="accent" size="sm">{job.type || 'full-time'}</Badge>
                  </div>
                  {job.salary && (
                    <p className="text-xs text-slate-500 mb-2">{job.salary}</p>
                  )}
                  <div className="mt-auto flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {timeAgo(job.createdAt)}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => goToPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  disabled={loading}
                  onClick={() => goToPage(i + 1)}
                  className={`
                    w-9 h-9 rounded-lg text-sm font-medium transition-all
                    ${page === i + 1
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {i + 1}
                </button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => goToPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle,
  Users,
  UserPlus,
  PlusCircle,
  Settings,
  ArrowRight,
  Eye,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function EmployerDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.allSettled([
        api.get('/jobs/employer/stats'),
        api.get('/jobs/employer/mine?limit=5'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (jobsRes.status === 'fulfilled') setRecentJobs(jobsRes.value.data.jobs || []);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in w-full pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} lines={2} />)}
        </div>
        <CardSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20 font-sans text-slate-800">
      {/* Light Emerald Fresh Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-3xl p-6 sm:p-10 !text-white relative overflow-hidden shadow-xl shadow-emerald-600/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-100" />
            Employer Recruiting Command Center
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight !text-white leading-tight">
            Hello, {user?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Employer'} 👋
          </h1>
          <p className="!text-emerald-50 text-xs sm:text-base max-w-2xl font-medium leading-relaxed">
            Manage your open jobs, review candidate applications, and rank applicants with explainable AI models.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/employer/post-job">
              <Button size="md" className="!bg-white hover:!bg-emerald-50 !text-emerald-900 font-black shadow-lg shadow-emerald-950/20 text-xs sm:text-sm">
                <PlusCircle className="w-4 h-4 mr-2 text-emerald-700" />
                Post New Job
              </Button>
            </Link>
            <Link to="/employer/jobs">
              <Button variant="secondary" size="md" className="!bg-white/20 hover:!bg-white/30 !text-white !border-white/30 font-extrabold backdrop-blur-md text-xs sm:text-sm">
                <Briefcase className="w-4 h-4 mr-2 text-emerald-100" />
                View Postings & Applicants
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          { label: 'Total Jobs', value: stats?.totalJobs || recentJobs.length || 0, icon: Briefcase, color: 'text-accent-600', bg: 'bg-accent-100' },
          { label: 'Active Openings', value: stats?.activeJobs || recentJobs.filter(j => j.status === 'open').length || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Total Applicants', value: stats?.totalApplicants || 0, icon: Users, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Recent Submissions', value: stats?.newApplicants || 0, icon: UserPlus, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border-2 border-slate-200/80 p-4 sm:p-6 shadow-sm hover:border-accent-300 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider leading-tight">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{stat.value}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { to: '/employer/post-job', icon: PlusCircle, label: 'Post New Job', desc: 'Create job listing & rubric' },
          { to: '/employer/jobs', icon: Settings, label: 'Manage Jobs', desc: 'Active postings & applicants' },
          { to: '/employer/company', icon: Sparkles, label: 'Company Profile', desc: 'Brand & organization setup' },
        ].map((action) => (
          <Link key={action.label} to={action.to}>
            <Card padding="lg" className="hover:border-accent-400 group transition-all shadow-sm bg-white border-2 border-slate-200/80">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-accent-50 group-hover:bg-accent-100 transition-colors">
                  <action.icon className="w-6 h-6 text-accent-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-extrabold text-slate-900 group-hover:text-accent-600 transition-colors">{action.label}</p>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{action.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Job Postings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">Your Active Job Postings</h2>
          <Link to="/employer/jobs" className="text-sm font-extrabold text-accent-600 hover:text-accent-700">
            View All Job Postings →
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <Card padding="lg" className="text-center py-16">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">No job postings created yet</p>
            <Link to="/employer/post-job">
              <Button size="sm" className="mt-3 font-bold">Post Your First Job</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <Card key={job._id} padding="lg" className="hover:border-slate-300 transition-all border-2 border-slate-200/80 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Link to={`/employer/jobs/${job._id}/applicants`} className="text-lg font-black text-slate-900 hover:text-accent-600 transition-colors">
                        {job.title}
                      </Link>
                      <Badge variant={job.status === 'open' ? 'success' : 'neutral'} size="sm">
                        {job.status === 'open' ? 'Active' : 'Closed'}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      {job.location || 'Remote'} • Posted {new Date(job.createdAt).toLocaleDateString()} • {job.skills_required?.slice(0, 4).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link to={`/employer/jobs/${job._id}/applicants`}>
                      <Button variant="secondary" size="sm" className="font-extrabold text-xs">
                        <Users className="w-4 h-4 mr-1.5 text-accent-600" />
                        Applicants ({job.applicantCount || 0})
                      </Button>
                    </Link>
                    <Link to={`/employer/jobs/${job._id}/applicants`}>
                      <Button size="sm" className="font-extrabold text-xs shadow-2xs">
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        AI Screen & Rank
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

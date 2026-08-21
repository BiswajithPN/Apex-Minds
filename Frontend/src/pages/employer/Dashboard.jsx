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
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} lines={1} />)}
        </div>
        <CardSkeleton lines={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="gradient-hero rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Hello, {user?.name?.split(' ')[0] || 'Employer'} 👋
          </h1>
          <p className="text-accent-200 mt-2 text-sm sm:text-base max-w-lg">
            Manage your job postings and find top candidates with AI matching
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Jobs', value: stats?.totalJobs || 0, icon: Briefcase, color: 'accent' },
          { label: 'Active Jobs', value: stats?.activeJobs || 0, icon: CheckCircle, color: 'success' },
          { label: 'Total Applicants', value: stats?.totalApplicants || 0, icon: Users, color: 'warn' },
          { label: 'New (7 days)', value: stats?.newApplicants || 0, icon: UserPlus, color: 'accent' },
        ].map((stat) => (
          <Card key={stat.label} hover padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl bg-${stat.color}-100`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/employer/post-job', icon: PlusCircle, label: 'Post Job', desc: 'Create a new listing' },
          { to: '/employer/jobs', icon: Settings, label: 'Manage Jobs', desc: 'View all postings' },
          { to: '/employer/jobs', icon: Eye, label: 'View Applicants', desc: 'Review candidates' },
        ].map((action) => (
          <Link key={action.label} to={action.to}>
            <Card hover padding="md" className="group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent-50 group-hover:bg-accent-100 transition-colors">
                  <action.icon className="w-5 h-5 text-accent-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                  <p className="text-xs text-slate-500">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Jobs Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Job Listings</h2>
          <Link to="/employer/jobs" className="text-sm text-accent-600 hover:text-accent-700 font-medium">
            View All
          </Link>
        </div>
        {recentJobs.length === 0 ? (
          <Card padding="lg" className="text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No jobs posted yet</p>
            <Link to="/employer/post-job">
              <Button size="sm" className="mt-3">Post Your First Job</Button>
            </Link>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicants</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5">
                        <Link to={`/employer/jobs/${job._id}/applicants`} className="font-medium text-slate-900 hover:text-accent-600 transition-colors">
                          {job.title}
                        </Link>
                      </td>
                      <td className="py-3 px-5">
                        <Badge variant={job.status === 'open' ? 'success' : job.status === 'closed' ? 'neutral' : 'warning'} size="sm">
                          {job.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-slate-600">{job.applicantCount || 0}</td>
                      <td className="py-3 px-5 text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

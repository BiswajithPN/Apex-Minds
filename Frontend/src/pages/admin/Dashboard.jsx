import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  FileCheck,
  Shield,
  UserCheck,
  Flag,
  BarChart3,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, usersRes] = await Promise.allSettled([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/users'),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data?.data || statsRes.value.data);
      }
      if (usersRes.status === 'fulfilled') {
        const uList = usersRes.value.data?.data?.users || usersRes.value.data?.users || [];
        setRecentUsers(uList.slice(0, 5));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in w-full pb-16">
        <CardSkeleton lines={3} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} lines={2} />)}
        </div>
        <CardSkeleton lines={6} />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || recentUsers.length || 0, icon: Users, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { label: 'Job Seekers', value: stats?.jobseekers || recentUsers.filter(u => u.role === 'jobseeker').length || 0, icon: UserCheck, color: 'text-teal-700', bg: 'bg-teal-100' },
    { label: 'Employers', value: stats?.employers || recentUsers.filter(u => u.role === 'employer').length || 0, icon: Briefcase, color: 'text-accent-700', bg: 'bg-accent-100' },
    { label: 'Active Jobs', value: stats?.activeJobs || stats?.totalJobs || 0, icon: FileCheck, color: 'text-amber-700', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20 font-sans text-slate-800">
      {/* Light Emerald Fresh Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-3xl p-6 sm:p-10 !text-white relative overflow-hidden shadow-xl shadow-emerald-600/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white shadow-xs">
            <Shield className="w-4 h-4 text-emerald-100" />
            Super Administrator Command Hub
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight !text-white leading-tight">
            Platform Governance & User Oversight
          </h1>
          <p className="!text-emerald-50 text-xs sm:text-base max-w-2xl font-medium leading-relaxed">
            Monitor real-time candidate registrations, employer postings, AI fairness metrics, and manage user accounts with full authority.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/admin/users">
              <Button size="md" className="!bg-white hover:!bg-emerald-50 !text-emerald-900 font-black shadow-lg shadow-emerald-950/20 text-xs sm:text-sm">
                <Users className="w-4 h-4 mr-2 text-emerald-700" />
                Manage User Directory
              </Button>
            </Link>
            <Link to="/admin/analytics">
              <Button variant="secondary" size="md" className="!bg-white/20 hover:!bg-white/30 !text-white !border-white/30 font-extrabold backdrop-blur-md text-xs sm:text-sm">
                <BarChart3 className="w-4 h-4 mr-2 text-emerald-100" />
                System & Fairness Audits
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border-2 border-slate-200/80 p-3.5 sm:p-6 shadow-sm hover:border-emerald-300 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider leading-tight">{s.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{s.value}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${s.bg} ${s.color}`}>
                <s.icon className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Quick Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {[
          { to: '/admin/users', icon: Users, label: 'User Directory & Control', desc: 'Inspect, promote, or suspend accounts' },
          { to: '/admin/flagged', icon: Flag, label: 'Flagged Job Postings', desc: 'Review & moderate reported jobs' },
          { to: '/admin/analytics', icon: BarChart3, label: 'AI Fairness & Analytics', desc: 'Demographic parity & trends' },
        ].map((action) => (
          <Link key={action.label} to={action.to}>
            <div className="bg-white rounded-2xl border-2 border-slate-200/80 p-4 sm:p-6 hover:border-emerald-400 group transition-all shadow-sm">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors shrink-0">
                  <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">{action.label}</p>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent User Registrations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Recent User Registrations</h2>
          <Link to="/admin/users" className="text-xs sm:text-sm font-extrabold text-emerald-600 hover:text-emerald-700">
            View All in User Directory →
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <Card padding="lg" className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-bold text-slate-700">No users registered yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <Card key={u._id} padding="md" className="hover:border-slate-300 transition-all border-2 border-slate-200/80 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {(u.full_name || u.name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                        {u.full_name || u.name}
                      </p>
                      <p className="text-xs text-slate-500 font-medium truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Badge
                      variant={u.role === 'admin' ? 'danger' : u.role === 'employer' ? 'success' : 'accent'}
                      size="sm"
                      className="uppercase text-[11px] font-extrabold"
                    >
                      {u.role}
                    </Badge>
                    <Link to="/admin/users">
                      <Button variant="secondary" size="sm" className="font-bold text-xs">
                        Inspect Profile
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

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Users,
  BarChart3,
  Sparkles,
  Search,
  ArrowRight,
  Calendar,
  Video,
  Phone,
  MapPin,
  Briefcase,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

const statusVariant = {
  pending: 'warning',
  reviewing: 'accent',
  shortlisted: 'success',
  interview: 'success',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

export default function JobSeekerDashboard() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, appsRes, matchesRes] = await Promise.allSettled([
        api.get('/users/profile'),
        api.get('/applications/mine?limit=4'),
        api.get('/recommendations?limit=3'),
      ]);

      if (statsRes.status === 'fulfilled') {
        const profile = statsRes.value.data;
        setStats({
          applications: profile.applicationCount || 0,
          interviews: profile.interviewCount || 0,
          profileScore: profile.profileScore || 0,
          aiMatches: profile.aiMatchCount || 0,
        });
      }

      if (appsRes.status === 'fulfilled') {
        const apps = appsRes.value.data.applications || [];
        setRecentApps(apps);
        setInterviews(apps.filter((a) => a.status === 'interview' && a.interview));
      }

      if (matchesRes.status === 'fulfilled') {
        setTopMatches(matchesRes.value.data.recommendations || []);
      }
    } catch {
      // Silently handle errors — show empty states
    } finally {
      setLoading(false);
    }
  };

  const profileScore = stats?.profileScore || 0;

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in w-full pb-16">
        <CardSkeleton lines={3} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} lines={2} />)}
        </div>
        <CardSkeleton lines={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20 font-sans text-slate-800">
      {/* Light Emerald Fresh Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-3xl p-6 sm:p-10 !text-white relative overflow-hidden shadow-xl shadow-emerald-600/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          {isWelcome && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-100" />
              <span>Profile setup complete!</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight !text-white leading-tight">
            Welcome back, {user?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="!text-emerald-50 text-xs sm:text-base max-w-2xl font-medium leading-relaxed">
            Your AI-assisted recruitment portal is active with explainable multi-criteria job matching.
          </p>
          <div className="pt-2">
            <Link to="/jobseeker/jobs">
              <Button size="md" className="!bg-white hover:!bg-emerald-50 !text-emerald-900 font-black shadow-lg shadow-emerald-950/20 text-xs sm:text-sm">
                <Search className="w-4 h-4 mr-2 text-emerald-700" />
                Find Open Positions
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Applications', value: stats?.applications || recentApps.length || 0, icon: ClipboardList, color: 'text-accent-600', bg: 'bg-accent-100' },
          { label: 'Interviews', value: stats?.interviews || interviews.length || 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Profile Score', value: `${profileScore || 85}%`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'AI Matches', value: stats?.aiMatches || topMatches.length || 3, icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((stat) => (
          <Card key={stat.label} padding="lg" className="hover:border-accent-300 transition-all shadow-sm bg-white border-2 border-slate-200/80">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-extrabold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              </div>
              <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Profile completion notice */}
      {profileScore < 100 && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-extrabold text-amber-950">Complete your profile for higher AI accuracy</p>
              <p className="text-sm text-amber-800 font-medium mt-0.5">
                Your profile is {profileScore || 85}% complete. Upload your verified certifications to maximize recruiter visibility.
              </p>
            </div>
          </div>
          <Link to="/jobseeker/profile">
            <Button variant="secondary" size="md" className="!bg-white hover:!bg-amber-100/60 !border-amber-300 !text-amber-900 font-bold text-sm shrink-0 shadow-2xs">
              Complete Profile
            </Button>
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { to: '/jobseeker/jobs', icon: Search, label: 'Search Jobs', desc: 'Browse all open positions' },
          { to: '/jobseeker/applications', icon: ClipboardList, label: 'My Applications', desc: 'View AI scores & feedback' },
          { to: '/jobseeker/recommendations', icon: Sparkles, label: 'AI Recommendations', desc: 'Semantic role matches' },
        ].map((action) => (
          <Link key={action.to} to={action.to}>
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

      {/* Recent Applications + Top Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">Recent Applications</h2>
            <Link to="/jobseeker/applications" className="text-sm font-extrabold text-accent-600 hover:text-accent-700">
              View All Applications →
            </Link>
          </div>

          {recentApps.length === 0 ? (
            <Card padding="lg" className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-700">No applications yet</p>
              <Link to="/jobseeker/jobs">
                <Button size="sm" className="mt-3 font-bold">Browse Jobs</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentApps.map((app) => (
                <Card key={app._id} padding="md" className="hover:border-slate-300 transition-all border-2 border-slate-200/80 bg-white">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-accent-50 flex items-center justify-center shrink-0">
                        <Briefcase className="w-6 h-6 text-accent-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-extrabold text-slate-900 truncate">{app.job?.title || 'Position'}</p>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">{app.job?.company?.name || 'Hiring Company'}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant[app.status] || 'warning'} size="md" className="font-extrabold text-xs">
                      {app.status?.toUpperCase()}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Top AI Matches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">Top Semantic Job Matches</h2>
            <Link to="/jobseeker/recommendations" className="text-sm font-extrabold text-accent-600 hover:text-accent-700">
              View All Matches →
            </Link>
          </div>

          {topMatches.length === 0 ? (
            <Card padding="lg" className="text-center py-12">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-700">Add profile skills for AI matches</p>
              <Link to="/jobseeker/profile">
                <Button size="sm" className="mt-3 font-bold">Edit Profile</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {topMatches.map((match, i) => (
                <Link key={match._id || i} to={`/jobseeker/jobs/${match._id}`} className="block">
                  <Card padding="md" className="hover:border-accent-300 transition-all border-2 border-slate-200/80 bg-white group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center text-white font-black text-base shrink-0 shadow-sm">
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-extrabold text-slate-900 group-hover:text-accent-600 transition-colors truncate">
                          {match.title}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">
                          {match.company?.name || 'Company'} • {match.location || 'Remote'}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

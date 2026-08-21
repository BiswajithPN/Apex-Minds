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
  shortlisted: 'accent',
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
      <div className="space-y-6 animate-fade-in">
        <CardSkeleton lines={2} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} lines={1} />)}
        </div>
        <CardSkeleton lines={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="gradient-hero rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          {isWelcome && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm mb-3 backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-accent-300" />
              <span className="text-accent-100">Profile setup complete!</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-accent-200 mt-2 text-sm sm:text-base max-w-lg">
            Your AI-powered job search assistant is ready. Let's find your next opportunity.
          </p>
          <Link to="/jobseeker/jobs">
            <Button variant="secondary" size="md" className="mt-5 !border-white/30 !text-white hover:!bg-white/10">
              <Search className="w-4 h-4" />
              Find Jobs
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Applications', value: stats?.applications || 0, icon: ClipboardList, color: 'accent' },
          { label: 'Interviews', value: stats?.interviews || 0, icon: Users, color: 'success' },
          { label: 'Profile Score', value: `${profileScore}%`, icon: BarChart3, color: 'warn' },
          { label: 'AI Matches', value: stats?.aiMatches || 0, icon: Sparkles, color: 'accent' },
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

      {/* Profile completeness warning */}
      {profileScore < 80 && (
        <div className="flex items-start gap-3 px-5 py-4 bg-warn-50 border border-warn-200 rounded-xl animate-fade-in">
          <AlertCircle className="w-5 h-5 text-warn-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-warn-800">Complete your profile</p>
            <p className="text-xs text-warn-700 mt-0.5">
              Your profile is {profileScore}% complete. A complete profile gets 3x more visibility to employers.
            </p>
          </div>
          <Link to="/jobseeker/profile">
            <Button variant="ghost" size="sm" className="!text-warn-700 hover:!bg-warn-100 shrink-0">
              Complete Now
            </Button>
          </Link>
        </div>
      )}

      {/* Upcoming interviews */}
      {interviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Interviews</h2>
          <div className="grid gap-3">
            {interviews.map((app) => (
              <Card key={app._id} padding="md" hover>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-success-100">
                    {app.interview?.type === 'video' ? (
                      <Video className="w-5 h-5 text-success-600" />
                    ) : app.interview?.type === 'phone' ? (
                      <Phone className="w-5 h-5 text-success-600" />
                    ) : (
                      <MapPin className="w-5 h-5 text-success-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {app.job?.title || 'Interview'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(app.interview?.date).toLocaleDateString()}
                      </span>
                      <span>{app.interview?.time}</span>
                      <Badge variant="success" size="sm">{app.interview?.type}</Badge>
                    </div>
                    {app.interview?.notes && (
                      <p className="text-xs text-slate-500 mt-1 truncate">{app.interview.notes}</p>
                    )}
                  </div>
                  {app.interview?.location && (
                    <a
                      href={app.interview.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-600 hover:underline shrink-0"
                    >
                      Join →
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/jobseeker/jobs', icon: Search, label: 'Search Jobs', desc: 'Browse all openings' },
          { to: '/jobseeker/applications', icon: ClipboardList, label: 'My Applications', desc: 'Track your progress' },
          { to: '/jobseeker/recommendations', icon: Sparkles, label: 'AI Recommendations', desc: 'Jobs matched for you' },
        ].map((action) => (
          <Link key={action.to} to={action.to}>
            <Card hover padding="md" className="group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent-50 group-hover:bg-accent-100 transition-colors">
                  <action.icon className="w-5 h-5 text-accent-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                  <p className="text-xs text-slate-500">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Applications + Top Matches */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Applications</h2>
            <Link to="/jobseeker/applications" className="text-sm text-accent-600 hover:text-accent-700 font-medium">
              View All
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <Card padding="lg" className="text-center">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No applications yet</p>
              <Link to="/jobseeker/jobs">
                <Button size="sm" className="mt-3">Browse Jobs</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentApps.map((app) => (
                <Card key={app._id} padding="sm" hover>
                  <div className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{app.job?.title}</p>
                      <p className="text-xs text-slate-500 truncate">{app.job?.company?.name}</p>
                    </div>
                    <Badge variant={statusVariant[app.status]} size="sm">
                      {app.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Top AI Matches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Top AI Matches</h2>
            <Link to="/jobseeker/recommendations" className="text-sm text-accent-600 hover:text-accent-700 font-medium">
              View All
            </Link>
          </div>
          {topMatches.length === 0 ? (
            <Card padding="lg" className="text-center">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Complete your profile for AI matches</p>
              <Link to="/jobseeker/profile">
                <Button size="sm" className="mt-3">Edit Profile</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {topMatches.map((match, i) => (
                <Link key={match._id || i} to={`/jobseeker/jobs/${match._id}`}>
                  <Card padding="sm" hover>
                    <div className="flex items-center gap-3 p-2">
                      <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center text-white font-bold text-sm shrink-0">
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{match.title}</p>
                        <p className="text-xs text-slate-500 truncate">{match.company?.name} • {match.location}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
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

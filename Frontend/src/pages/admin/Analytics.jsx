import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { ShieldCheck, BarChart3, TrendingUp, CheckCircle2, Award, Zap } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function Analytics() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setTrends(res.data?.data || res.data);
    } catch {
      try {
        const fallbackRes = await api.get('/analytics/trends');
        setTrends(fallbackRes.data);
      } catch {
        setTrends(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const statusData = [
    { status: 'Pending', count: trends?.statusCounts?.pending || 0 },
    { status: 'Reviewing', count: trends?.statusCounts?.reviewing || 0 },
    { status: 'Shortlisted', count: trends?.statusCounts?.shortlisted || 0 },
    { status: 'Interview', count: trends?.statusCounts?.interview || 0 },
    { status: 'Accepted', count: trends?.statusCounts?.accepted || 0 },
    { status: 'Rejected', count: trends?.statusCounts?.rejected || 0 },
  ];

  const growthData = (trends?.growthData || []).map(d => ({
    month: d.month,
    users: d.users || 0,
    applications: d.applications || 0,
  }));

  if (loading) return <CardSkeleton lines={8} />;

  return (
    <div className="space-y-8 animate-fade-in w-full pb-20 font-sans text-slate-800">
      {/* Light Emerald Fresh Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-3xl p-6 sm:p-10 !text-white relative overflow-hidden shadow-xl shadow-emerald-600/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white shadow-xs">
            <BarChart3 className="w-4 h-4 text-emerald-100" />
            Recruitment Intelligence & Fair AI Audits
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight !text-white leading-tight">
            System Analytics & Bias Audit Dashboard
          </h1>
          <p className="!text-emerald-50 text-xs sm:text-base max-w-2xl font-medium leading-relaxed">
            Verify four-fifths disparate impact compliance, candidate conversion funnels, and demographic parity across all AI evaluations.
          </p>
        </div>
      </div>

      {/* AI Bias & Fairness Audit Summary Cards — Real Data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="border-2 border-emerald-300 bg-white rounded-2xl p-3.5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-extrabold text-emerald-700 uppercase tracking-wider truncate">Anonymization Rate</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{trends?.fairnessMetric?.anonymizationRate ?? 0}%</p>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 font-bold mt-0.5 truncate">PII Fields Redacted</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="border-2 border-accent-300 bg-white rounded-2xl p-3.5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-extrabold text-accent-700 uppercase tracking-wider truncate">Selection Rate</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{trends?.fairnessMetric?.selectionRate ?? 0}%</p>
              <p className="text-[10px] sm:text-[11px] text-accent-700 font-bold mt-0.5 truncate">Above Threshold</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-accent-100 text-accent-700 shrink-0">
              <Award className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="border-2 border-purple-300 bg-white rounded-2xl p-3.5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-extrabold text-purple-700 uppercase tracking-wider truncate">Avg Score</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{trends?.fairnessMetric?.avgScore ?? 0}</p>
              <p className="text-[10px] sm:text-[11px] text-purple-700 font-bold mt-0.5 truncate">Out of 100</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-purple-100 text-purple-700 shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="border-2 border-amber-300 bg-white rounded-2xl p-3.5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-extrabold text-amber-700 uppercase tracking-wider truncate">Total Analyses</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{trends?.fairnessMetric?.totalAnalyses ?? 0}</p>
              <p className="text-[10px] sm:text-[11px] text-amber-700 font-bold mt-0.5 truncate">Candidates Evaluated</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Zap className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <Card padding="lg" className="border-2 border-slate-200/80 bg-white shadow-2xs">
          {trends?.totalApplications === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400 font-medium">No application data yet. Data will appear as candidates apply to jobs.</p>
            </div>
          )}
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900">Application Pipeline Funnel</h2>
            <p className="text-xs text-slate-500 font-medium">Distribution across application stages</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#0d9e8a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Growth Trends */}
        <Card padding="lg" className="border-2 border-slate-200/80 bg-white shadow-2xs">
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900">Platform User & Application Growth</h2>
            <p className="text-xs text-slate-500 font-medium">Real growth data over the last 6 months</p>
          </div>
          {growthData.length === 0 ? (
            <div className="h-72 w-full flex items-center justify-center">
              <p className="text-sm text-slate-400 font-medium">No growth data yet. Data will populate as users register and apply.</p>
            </div>
          ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff' }}
                />
                <Line type="monotone" dataKey="users" stroke="#0d9e8a" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="applications" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          )}
        </Card>
      </div>
    </div>
  );
}

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
import Card from '../../components/ui/Card';
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
      const { data } = await api.get('/analytics/trends');
      setTrends(data);
    } catch {
      setTrends(null);
    } finally {
      setLoading(false);
    }
  };

  const statusData = [
    { status: 'Pending', count: trends?.statusCounts?.pending || 12 },
    { status: 'Reviewing', count: trends?.statusCounts?.reviewing || 18 },
    { status: 'Shortlisted', count: trends?.statusCounts?.shortlisted || 8 },
    { status: 'Interview', count: trends?.statusCounts?.interview || 5 },
    { status: 'Accepted', count: trends?.statusCounts?.accepted || 4 },
    { status: 'Rejected', count: trends?.statusCounts?.rejected || 10 },
  ];

  const growthData = [
    { month: 'Jan', users: 120, jobs: 45 },
    { month: 'Feb', users: 190, jobs: 60 },
    { month: 'Mar', users: 310, jobs: 85 },
    { month: 'Apr', users: 480, jobs: 130 },
    { month: 'May', users: 650, jobs: 180 },
    { month: 'Jun', users: 890, jobs: 240 },
  ];

  if (loading) return <CardSkeleton lines={6} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Application status breakdown & growth metrics</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card padding="lg">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Applications by Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9e8a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Growth Trends */}
        <Card padding="lg">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Platform Growth Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#0d9e8a" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="jobs" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Users, Briefcase, FileCheck, AlertTriangle, UserCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/analytics/dashboard');
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in">
        {[1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} lines={1} />)}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'accent' },
    { label: 'Jobseekers', value: stats?.jobseekers || 0, icon: UserCheck, color: 'success' },
    { label: 'Employers', value: stats?.employers || 0, icon: Users, color: 'warn' },
    { label: 'Active Jobs', value: stats?.activeJobs || 0, icon: Briefcase, color: 'accent' },
    { label: 'Total Applications', value: stats?.totalApplications || 0, icon: FileCheck, color: 'success' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
              </div>
              <div className={`p-2 rounded-xl bg-${s.color}-100`}>
                <s.icon className={`w-4 h-4 text-${s.color}-600`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

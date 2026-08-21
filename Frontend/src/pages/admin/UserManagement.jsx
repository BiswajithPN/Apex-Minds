import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      setUsers([]);
      setError(err.response?.data?.message || 'Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentIsActive) => {
    const nextStatus = currentIsActive ? 'inactive' : 'active';
    setError('');
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      setUsers(users.map((u) => (u._id === userId ? { ...u, is_active: nextStatus === 'active' } : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const nameStr = u.full_name || u.name || '';
    const emailStr = u.email || '';
    const matchesSearch =
      nameStr.toLowerCase().includes(search.toLowerCase()) ||
      emailStr.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return <CardSkeleton lines={6} />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage user roles and activation status</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Search + Filter */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="jobseeker">Jobseeker</option>
            <option value="employer">Employer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="text-right py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isActive = u.is_active !== false;
                return (
                  <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div>
                        <p className="font-medium text-slate-900">{u.full_name || u.name || 'User'}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge
                        variant={u.role === 'admin' ? 'danger' : u.role === 'employer' ? 'accent' : 'neutral'}
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={isActive ? 'success' : 'danger'} size="sm">
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => toggleUserStatus(u._id, isActive)}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            !isActive
                              ? 'text-success-600 hover:bg-success-50'
                              : 'text-danger-600 hover:bg-danger-50'
                          }`}
                        >
                          {!isActive ? 'Activate' : 'Deactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

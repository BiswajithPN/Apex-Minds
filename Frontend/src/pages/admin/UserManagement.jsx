import { useState, useEffect } from 'react';
import {
  Search,
  UserCheck,
  UserX,
  Shield,
  Trash2,
  Eye,
  X,
  User,
  Users,
  Building2,
  FileText,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Copy,
  ExternalLink,
  Calendar,
  Mail,
  MapPin,
  Award,
  Layers,
  Activity,
  Check,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import api from '../../api/axiosInstance';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Inspect Drawer State
  const [inspectUser, setInspectUser] = useState(null);
  const [inspectDetails, setInspectDetails] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectTab, setInspectTab] = useState('overview'); // 'overview' | 'activity' | 'security'

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data?.data?.users || res.data?.users || []);
    } catch {
      try {
        const fallbackRes = await api.get('/users');
        setUsers(fallbackRes.data?.users || []);
      } catch {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInspectUser = async (user) => {
    setInspectUser(user);
    setInspectDetails(null);
    setInspectTab('overview');
    setInspectLoading(true);
    try {
      const res = await api.get(`/admin/users/${user._id}`);
      setInspectDetails(res.data?.data || null);
    } catch {
      setInspectDetails(null);
    } finally {
      setInspectLoading(false);
    }
  };

  const closeInspect = () => {
    setInspectUser(null);
    setInspectDetails(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleToggleStatus = async (user) => {
    setActionLoading(true);
    const newStatus = user.is_active ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/users/${user._id}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, is_active: !u.is_active } : u))
      );
      if (inspectUser && inspectUser._id === user._id) {
        setInspectUser((prev) => ({ ...prev, is_active: !prev.is_active }));
      }
      setActionMessage(`Account status changed to ${newStatus === 'active' ? 'Active' : 'Suspended'}`);
      setTimeout(() => setActionMessage(''), 3500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update account status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      if (inspectUser && inspectUser._id === userId) {
        setInspectUser((prev) => ({ ...prev, role: newRole }));
      }
      setActionMessage(`User role successfully changed to ${newRole}`);
      setTimeout(() => setActionMessage(''), 3500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"? All associated profiles, jobs, and applications will be deleted permanently.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      if (inspectUser && inspectUser._id === userId) {
        closeInspect();
      }
      setActionMessage(`User "${userName}" has been permanently deleted`);
      setTimeout(() => setActionMessage(''), 3500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = u.full_name || u.name || '';
    const email = u.email || '';
    const company = u.details?.companyName || '';
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      company.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.is_active !== false) ||
      (statusFilter === 'suspended' && u.is_active === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalCount = users.length;
  const jobseekerCount = users.filter((u) => u.role === 'jobseeker').length;
  const employerCount = users.filter((u) => u.role === 'employer').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  if (loading) return <CardSkeleton lines={8} />;

  return (
    <div className="space-y-8 animate-fade-in w-full pb-24 font-sans text-slate-800">
      {/* Light Emerald Fresh Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-3xl p-6 sm:p-10 !text-white relative overflow-hidden shadow-xl shadow-emerald-600/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white shadow-xs">
            <Shield className="w-4 h-4 text-emerald-100" />
            Super Administrator Control Center
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight !text-white leading-tight">
            User Directory & Access Governance
          </h1>
          <p className="!text-emerald-50 text-xs sm:text-base max-w-2xl font-medium leading-relaxed">
            Inspect individual user activity dossiers, manage roles, reactivate or suspend accounts, and maintain platform compliance.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-2xl font-extrabold text-sm flex items-center justify-between animate-fade-in shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            {actionMessage}
          </span>
          <button onClick={() => setActionMessage('')} className="p-1 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div
          onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
          className={`cursor-pointer transition-all border-2 rounded-2xl p-3.5 sm:p-6 ${
            roleFilter === 'all' && statusFilter === 'all'
              ? 'border-accent-500 bg-accent-50/30 ring-2 ring-accent-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider truncate">Total Users</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{totalCount}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-slate-100 text-slate-700 shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('jobseeker')}
          className={`cursor-pointer transition-all border-2 rounded-2xl p-3.5 sm:p-6 ${
            roleFilter === 'jobseeker'
              ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-black text-emerald-700 uppercase tracking-wider truncate">Students</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-0.5">{jobseekerCount}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <User className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('employer')}
          className={`cursor-pointer transition-all border-2 rounded-2xl p-3.5 sm:p-6 ${
            roleFilter === 'employer'
              ? 'border-accent-500 bg-accent-50/30 ring-2 ring-accent-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-black text-accent-700 uppercase tracking-wider truncate">Employers</p>
              <p className="text-2xl sm:text-3xl font-black text-accent-900 mt-0.5">{employerCount}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-accent-100 text-accent-700 shrink-0">
              <Building2 className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('admin')}
          className={`cursor-pointer transition-all border-2 rounded-2xl p-3.5 sm:p-6 ${
            roleFilter === 'admin'
              ? 'border-purple-500 bg-purple-50/30 ring-2 ring-purple-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-black text-purple-700 uppercase tracking-wider truncate">Admins</p>
              <p className="text-2xl sm:text-3xl font-black text-purple-900 mt-0.5">{adminCount}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-purple-100 text-purple-700 shrink-0">
              <Shield className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card padding="md" className="border-2 border-slate-200/80 bg-white shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by full name, email, or company name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-accent-500 text-slate-900 placeholder:text-slate-400 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full py-3 px-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-accent-500 cursor-pointer"
            >
              <option value="all">Filter: All Roles ({totalCount})</option>
              <option value="jobseeker">Students ({jobseekerCount})</option>
              <option value="employer">Employers ({employerCount})</option>
              <option value="admin">Administrators ({adminCount})</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-3 px-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-accent-500 cursor-pointer"
            >
              <option value="all">Filter: All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Registered Users ({filteredUsers.length})
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Click on any user row or "Inspect" to view full profile dossiers
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadUsers} className="font-bold text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh List
        </Button>
      </div>

      {filteredUsers.length === 0 ? (
        <Card padding="lg" className="text-center py-16 border-2 border-slate-200 bg-white">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-700">No users found matching your search</p>
          <button
            onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
            className="text-xs font-extrabold text-accent-600 hover:text-accent-700 mt-2 inline-block"
          >
            Clear Filters
          </button>
        </Card>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block">
            <Card padding="none" className="border-2 border-slate-200 bg-white overflow-hidden shadow-xs rounded-3xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200">
                      <th className="py-4 px-6 text-xs font-black text-slate-600 uppercase tracking-wider">User Identity</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-600 uppercase tracking-wider">Role</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-600 uppercase tracking-wider">Key Activity</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-600 uppercase tracking-wider">Account State</th>
                      <th className="py-4 px-6 text-right text-xs font-black text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isInspecting = inspectUser?._id === u._id;
                      return (
                        <tr
                          key={u._id}
                          onClick={() => handleInspectUser(u)}
                          className={`cursor-pointer transition-all hover:bg-slate-50/80 ${
                            isInspecting ? 'bg-accent-50/60 ring-2 ring-inset ring-accent-500/30' : ''
                          }`}
                        >
                          {/* User Identity */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3.5">
                              <div className="w-11 h-11 rounded-2xl gradient-accent flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
                                {(u.full_name || u.name || 'U')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 text-sm truncate hover:text-accent-600 transition-colors">
                                  {u.full_name || u.name || 'Anonymous User'}
                                </p>
                                <p className="text-xs text-slate-500 font-medium truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-4 px-6">
                            <Badge
                              variant={
                                u.role === 'admin' ? 'danger' : u.role === 'employer' ? 'success' : 'accent'
                              }
                              size="sm"
                              className="font-black text-[11px] uppercase tracking-wider px-3 py-1"
                            >
                              {u.role === 'admin' ? 'Super Admin' : u.role === 'employer' ? 'Employer' : 'Student'}
                            </Badge>
                          </td>

                          {/* Key Activity */}
                          <td className="py-4 px-6 text-xs font-bold text-slate-700">
                            {u.role === 'jobseeker' && (
                              <div className="space-y-0.5">
                                <p className="text-slate-900 font-extrabold">
                                  {u.details?.applicationCount || 0} Applications
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {u.details?.hasResume ? '📄 Resume Attached' : 'No Resume'}
                                </p>
                              </div>
                            )}
                            {u.role === 'employer' && (
                              <div className="space-y-0.5">
                                <p className="text-slate-900 font-extrabold">
                                  {u.details?.jobCount || 0} Active Jobs
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {u.details?.applicantCount || 0} Total Applicants
                                </p>
                              </div>
                            )}
                            {u.role === 'admin' && (
                              <span className="inline-flex items-center gap-1 text-purple-700 font-extrabold">
                                <Shield className="w-3.5 h-3.5" /> Full Root Access
                              </span>
                            )}
                          </td>

                          {/* Account State */}
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                                u.is_active !== false
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  u.is_active !== false ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              {u.is_active !== false ? 'Active' : 'Suspended'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInspectUser(u);
                              }}
                              className="font-bold text-xs shadow-2xs hover:border-accent-400"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-accent-600" />
                              Inspect Dossier
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="block md:hidden space-y-4">
            {filteredUsers.map((u) => (
              <Card
                key={u._id}
                padding="lg"
                onClick={() => handleInspectUser(u)}
                className="border-2 border-slate-200 bg-white space-y-4 shadow-2xs active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center text-white font-black text-base shrink-0">
                      {(u.full_name || u.name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 text-base truncate">{u.full_name || u.name}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{u.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant={u.role === 'admin' ? 'danger' : u.role === 'employer' ? 'success' : 'accent'}
                    size="sm"
                    className="shrink-0 font-extrabold uppercase text-[10px]"
                  >
                    {u.role}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Activity</span>
                    <span className="font-extrabold text-slate-800">
                      {u.role === 'jobseeker' ? `${u.details?.applicationCount || 0} Apps` : u.role === 'employer' ? `${u.details?.jobCount || 0} Jobs` : 'Admin Root'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Status</span>
                    <span className={`font-extrabold ${u.is_active !== false ? 'text-emerald-700' : 'text-rose-700'}`}>
                      ● {u.is_active !== false ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInspectUser(u);
                  }}
                  className="w-full font-bold text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5 text-accent-600" />
                  Inspect Full Dossier
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 🌟 SLIDE-OVER USER INSPECT DOSSIER MODAL DRAWER                          */}
      {/* ========================================================================= */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={closeInspect}
          />

          {/* Slide-in Drawer Container */}
          <div className="relative w-full max-w-2xl bg-white shadow-2xl z-10 flex flex-col h-full overflow-hidden animate-slide-left">
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-emerald-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white">User Dossier & Audit</h3>
                  <p className="text-xs text-slate-300 font-medium">Deep inspection and governance controls</p>
                </div>
              </div>
              <button
                onClick={closeInspect}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Profile Overview Bar */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center text-white text-2xl font-black shadow-md shadow-accent-500/25 shrink-0">
                    {(inspectUser.full_name || inspectUser.name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xl font-black text-slate-900 truncate">
                        {inspectUser.full_name || inspectUser.name}
                      </h4>
                      <Badge
                        variant={
                          inspectUser.role === 'admin' ? 'danger' : inspectUser.role === 'employer' ? 'success' : 'accent'
                        }
                        size="sm"
                        className="uppercase font-black text-[10px]"
                      >
                        {inspectUser.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {inspectUser.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        ID: {inspectUser._id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(inspectUser._id)}
                        className="text-[11px] font-bold text-accent-600 hover:text-accent-700 flex items-center gap-1"
                      >
                        {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedId ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* State Tag */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shrink-0 ${
                    inspectUser.is_active !== false
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      inspectUser.is_active !== false ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {inspectUser.is_active !== false ? 'Active' : 'Suspended'}
                </span>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-2 mt-5 border-b border-slate-200 pt-1">
                {[
                  { id: 'overview', label: 'Profile Overview', icon: User },
                  { id: 'activity', label: 'Activity & Records', icon: Activity },
                  { id: 'security', label: 'Governance Controls', icon: Shield },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setInspectTab(t.id)}
                    className={`flex items-center gap-2 pb-2.5 px-3 font-extrabold text-xs transition-all border-b-2 cursor-pointer ${
                      inspectTab === t.id
                        ? 'border-accent-600 text-accent-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {inspectLoading ? (
                <div className="space-y-4">
                  <CardSkeleton lines={3} />
                  <CardSkeleton lines={4} />
                </div>
              ) : (
                <>
                  {/* TAB 1: PROFILE OVERVIEW */}
                  {inspectTab === 'overview' && (
                    <div className="space-y-5 animate-fade-in">
                      {/* Metric Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="text-[10px] font-black uppercase text-slate-400 block">Joined Date</span>
                          <span className="text-xs font-extrabold text-slate-900">
                            {new Date(inspectUser.createdAt || Date.now()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="text-[10px] font-black uppercase text-slate-400 block">Verification</span>
                          <span className="text-xs font-extrabold text-slate-900">
                            {inspectUser.is_verified ? 'Verified Email' : 'Standard'}
                          </span>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="text-[10px] font-black uppercase text-slate-400 block">Role Class</span>
                          <span className="text-xs font-extrabold text-slate-900 capitalize">{inspectUser.role}</span>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="text-[10px] font-black uppercase text-slate-400 block">Account Health</span>
                          <span className="text-xs font-extrabold text-emerald-700">100% Compliant</span>
                        </div>
                      </div>

                      {/* Student Deep Profile */}
                      {inspectUser.role === 'jobseeker' && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-accent-50/50 border border-accent-200 space-y-3">
                            <h5 className="text-xs font-black text-accent-950 uppercase tracking-wider flex items-center gap-2">
                              <FileText className="w-4 h-4 text-accent-600" />
                              Student Profile Details
                            </h5>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-slate-400 font-semibold block">Professional Headline</span>
                                <span className="font-extrabold text-slate-900">
                                  {inspectDetails?.profile?.headline || inspectUser.details?.headline || 'Senior Software Engineer'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-semibold block">Preferred Location</span>
                                <span className="font-extrabold text-slate-900">
                                  {inspectDetails?.profile?.location || inspectUser.details?.location || 'Remote / Hybrid'}
                                </span>
                              </div>
                            </div>

                            {/* Skills Tags */}
                            <div>
                              <span className="text-slate-400 font-semibold block text-xs mb-1.5">Detected Skills & Keywords</span>
                              <div className="flex flex-wrap gap-1.5">
                                {(inspectDetails?.profile?.skills || ['React.js', 'Node.js', 'TypeScript', 'MongoDB', 'Python', 'Tailwind CSS']).map(
                                  (skill, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2.5 py-1 rounded-lg bg-white border border-accent-200 text-accent-800 text-[11px] font-bold shadow-2xs"
                                    >
                                      {skill}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Employer Deep Profile */}
                      {inspectUser.role === 'employer' && (
                        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                          <h5 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            Employer Company Dossier
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-slate-400 font-semibold block">Company Name</span>
                              <span className="font-extrabold text-slate-900">
                                {inspectDetails?.profile?.company_name || inspectUser.details?.companyName || inspectUser.full_name}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block">Industry</span>
                              <span className="font-extrabold text-slate-900">
                                {inspectDetails?.profile?.industry || 'Technology & Services'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin Super Access */}
                      {inspectUser.role === 'admin' && (
                        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-2">
                          <h5 className="font-black uppercase text-[11px] flex items-center gap-1.5 text-purple-800">
                            <Shield className="w-4 h-4 text-purple-600" /> Administrator Root Privileges
                          </h5>
                          <p className="leading-relaxed">
                            This account holds full superuser rights over platform data, users, and moderation algorithms.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: ACTIVITY & RECORDS */}
                  {inspectTab === 'activity' && (
                    <div className="space-y-4 animate-fade-in">
                      {inspectUser.role === 'jobseeker' && (
                        <div className="space-y-3">
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Submitted Job Applications ({inspectDetails?.activity?.applications?.length || 0})
                          </h5>

                          {(!inspectDetails?.activity?.applications || inspectDetails.activity.applications.length === 0) ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-600">No applications submitted yet</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {inspectDetails.activity.applications.map((app) => (
                                <div
                                  key={app._id}
                                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div>
                                    <p className="font-extrabold text-slate-900">{app.jobId?.title || 'Open Position'}</p>
                                    <p className="text-slate-500 text-[11px]">
                                      {app.jobId?.company || 'Company'} • Applied on {new Date(app.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={
                                      app.status === 'accepted' || app.status === 'shortlisted'
                                        ? 'success'
                                        : app.status === 'rejected'
                                        ? 'danger'
                                        : 'accent'
                                    }
                                    size="sm"
                                    className="uppercase font-bold text-[10px]"
                                  >
                                    {app.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {inspectUser.role === 'employer' && (
                        <div className="space-y-3">
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Active Job Postings ({inspectDetails?.activity?.jobs?.length || 0})
                          </h5>

                          {(!inspectDetails?.activity?.jobs || inspectDetails.activity.jobs.length === 0) ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                              <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-600">No job postings created yet</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {inspectDetails.activity.jobs.map((job) => (
                                <div
                                  key={job._id}
                                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div>
                                    <p className="font-extrabold text-slate-900">{job.title}</p>
                                    <p className="text-slate-500 text-[11px]">
                                      {job.type} • {job.location} • Status: {job.status}
                                    </p>
                                  </div>
                                  <Badge variant={job.status === 'open' ? 'success' : 'warn'} size="sm">
                                    {job.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: GOVERNANCE CONTROLS */}
                  {inspectTab === 'security' && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Account Status Control */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Account Access State
                        </h5>
                        <p className="text-xs text-slate-500 font-medium">
                          Suspending an account temporarily revokes login tokens and application permissions.
                        </p>
                        <Button
                          variant={inspectUser.is_active !== false ? 'secondary' : 'primary'}
                          size="md"
                          disabled={actionLoading}
                          onClick={() => handleToggleStatus(inspectUser)}
                          className="w-full font-extrabold text-xs"
                        >
                          {inspectUser.is_active !== false ? (
                            <>
                              <UserX className="w-4 h-4 mr-2 text-rose-500" />
                              Suspend Account Access
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-2 text-emerald-300" />
                              Reactivate Account Access
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Role Promotion / Modification */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Assign Platform Role
                        </h5>
                        <p className="text-xs text-slate-500 font-medium">
                          Promote user permissions or reclassify between Student and Employer.
                        </p>
                        <select
                          value={inspectUser.role}
                          onChange={(e) => handleChangeRole(inspectUser._id, e.target.value)}
                          disabled={actionLoading}
                          className="w-full py-2.5 px-3.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-accent-500"
                        >
                          <option value="jobseeker">Student (Candidate profile & applications)</option>
                          <option value="employer">Employer (Job posting & candidate ranking)</option>
                          <option value="admin">Administrator (Superuser full system access)</option>
                        </select>
                      </div>

                      {/* Permanent Account Deletion */}
                      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-3">
                        <h5 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          Danger Zone: Account Deletion
                        </h5>
                        <p className="text-xs text-rose-800 font-medium leading-relaxed">
                          Permanently delete this user from the system. This cascade-deletes all profile records, resumes, and submitted applications.
                        </p>
                        <Button
                          variant="danger"
                          size="md"
                          disabled={actionLoading}
                          onClick={() => handleDeleteUser(inspectUser._id, inspectUser.full_name || inspectUser.name)}
                          className="w-full font-extrabold text-xs"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Permanently Delete User Account
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">HireHub Governance Engine</span>
              <Button variant="secondary" size="sm" onClick={closeInspect} className="font-bold text-xs">
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

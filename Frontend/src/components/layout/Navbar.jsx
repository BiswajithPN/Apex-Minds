import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, KeyRound, Bell, Check, Sparkles, AlertCircle } from 'lucide-react';
import Badge from '../ui/Badge';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

const roleBadgeVariant = {
  jobseeker: 'accent',
  employer: 'success',
  admin: 'danger',
};

const roleLabel = {
  jobseeker: 'Job Seeker',
  employer: 'Employer / Recruiter',
  admin: 'Administrator',
};

export default function Navbar({ onMenuClick }) {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Load notifications
  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications/all');
      const data = res.data.data || res.data;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silently catch
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Silently catch
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-8 flex items-center justify-between shadow-2xs font-sans">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Badge variant={roleBadgeVariant[role]} size="md" className="font-extrabold text-xs uppercase tracking-wider">
          {roleLabel[role]}
        </Badge>
      </div>

      {/* Right side — notifications & user menu */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-accent-600 text-white text-[11px] font-black flex items-center justify-center animate-pulse shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-3 w-88 sm:w-104 bg-white rounded-3xl shadow-2xl shadow-black/15 border border-slate-200 py-3 animate-fade-in z-50">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Notifications & AI Feedback
                </p>
                {unreadCount > 0 && (
                  <span className="text-xs font-bold text-accent-700 bg-accent-100 px-3 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400 font-medium">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleMarkAsRead(notif._id)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5 ${
                        !notif.read ? 'bg-accent-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-accent-500 shrink-0" />
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-accent-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">{notif.message}</p>
                      <p className="text-[11px] text-slate-400 font-semibold">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {role === 'jobseeker' && (
                <div className="p-3 border-t border-slate-100 text-center bg-slate-50/50 rounded-b-3xl">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/jobseeker/applications');
                    }}
                    className="text-xs font-extrabold text-accent-600 hover:text-accent-700 block w-full py-1"
                  >
                    View All in My Applications →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center text-white text-sm font-black shadow-md shadow-accent-500/20">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="hidden sm:block text-base font-bold text-slate-800 max-w-[140px] truncate">
              {user?.name || user?.full_name || 'Account'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* User Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-slate-200 py-2 animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name || user?.full_name}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{user?.email}</p>
              </div>

              <div className="p-1.5 space-y-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/change-password');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  Change Password
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

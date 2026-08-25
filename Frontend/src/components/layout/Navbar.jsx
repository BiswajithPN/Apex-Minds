import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, KeyRound, Bell, Sparkles } from 'lucide-react';
import Badge from '../ui/Badge';
import useAuthStore from '../../store/authStore';
import api from '../../api/axiosInstance';

const roleBadgeVariant = {
  jobseeker: 'accent',
  employer: 'success',
  admin: 'danger',
};

// Short label for mobile, full label for desktop
const roleLabelShort = {
  jobseeker: 'Job Seeker',
  employer: 'Employer',
  admin: 'Admin',
};
const roleLabelFull = {
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

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm font-sans">

      {/* Left — hamburger + role badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile: short label | Desktop: full label */}
        <span className="sm:hidden">
          <Badge variant={roleBadgeVariant[role]} size="sm" className="font-extrabold text-[11px] uppercase tracking-wide whitespace-nowrap">
            {roleLabelShort[role]}
          </Badge>
        </span>
        <span className="hidden sm:inline">
          <Badge variant={roleBadgeVariant[role]} size="md" className="font-extrabold text-xs uppercase tracking-wider whitespace-nowrap">
            {roleLabelFull[role]}
          </Badge>
        </span>
      </div>

      {/* Right — notifications + user menu */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center px-1 ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 mr-2 w-[calc(100vw-2.5rem)] sm:w-80 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-slate-200 py-2 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Notifications</p>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400 font-medium">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleMarkAsRead(notif._id)}
                      className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[13px] font-bold text-slate-900 leading-snug truncate">{notif.title}</p>
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {role === 'jobseeker' && (
                <div className="px-4 py-2.5 border-t border-slate-100">
                  <button
                    onClick={() => { setNotifOpen(false); navigate('/jobseeker/applications'); }}
                    className="w-full text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 py-1"
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
            className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:pr-3 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0 overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <span className="hidden sm:block text-sm font-bold text-slate-800 max-w-[120px] truncate">
              {user?.name || user?.full_name || 'Account'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-slate-200 py-2 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name || user?.full_name}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/change-password'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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

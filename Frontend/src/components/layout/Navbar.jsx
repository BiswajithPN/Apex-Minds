import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, KeyRound } from 'lucide-react';
import Badge from '../ui/Badge';
import useAuthStore from '../../store/authStore';

const roleBadgeVariant = {
  jobseeker: 'accent',
  employer: 'success',
  admin: 'danger',
};

const roleLabel = {
  jobseeker: 'Job Seeker',
  employer: 'Employer',
  admin: 'Admin',
};

export default function Navbar({ onMenuClick }) {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
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
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 lg:px-6 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Badge variant={roleBadgeVariant[role]} size="sm">
          {roleLabel[role]}
        </Badge>
      </div>

      {/* Right side — user menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-50 transition-colors"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
            {user?.name || 'User'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl shadow-black/8 border border-slate-200/60 py-1.5 animate-fade-in">
            <div className="px-4 py-2.5 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate('/change-password');
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

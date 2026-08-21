import { NavLink, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  LayoutDashboard,
  User,
  FileText,
  Search,
  ClipboardList,
  Sparkles,
  KeyRound,
  Building2,
  PlusCircle,
  Briefcase,
  Users,
  Flag,
  BarChart3,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const navConfig = {
  jobseeker: [
    { to: '/jobseeker/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobseeker/profile', icon: User, label: 'My Profile' },
    { to: '/jobseeker/resume', icon: FileText, label: 'Resume' },
    { to: '/jobseeker/jobs', icon: Search, label: 'Search Jobs' },
    { to: '/jobseeker/applications', icon: ClipboardList, label: 'My Applications' },
    { to: '/jobseeker/recommendations', icon: Sparkles, label: 'AI Recommendations' },
    { to: '/change-password', icon: KeyRound, label: 'Change Password' },
  ],
  employer: [
    { to: '/employer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/employer/company', icon: Building2, label: 'Company Profile' },
    { to: '/employer/post-job', icon: PlusCircle, label: 'Post Job' },
    { to: '/employer/jobs', icon: Briefcase, label: 'Manage Jobs' },
    { to: '/change-password', icon: KeyRound, label: 'Change Password' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/flagged', icon: Flag, label: 'Flagged Posts' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/change-password', icon: KeyRound, label: 'Change Password' },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { role } = useAuthStore();
  const location = useLocation();
  const links = navConfig[role] || [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white border-r border-slate-200/60
          w-[var(--sidebar-width)] flex flex-col
          transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-accent flex items-center justify-center shadow-md shadow-accent-500/20">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              Hire<span className="text-accent-500">Hub</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.to ||
              (link.to !== '/change-password' && location.pathname.startsWith(link.to + '/'));

            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-accent-50 text-accent-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                <Icon
                  className={`w-[18px] h-[18px] ${
                    isActive ? 'text-accent-500' : 'text-slate-400'
                  }`}
                />
                {link.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-500" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="px-3 py-2.5 rounded-xl bg-accent-50/50 text-center">
            <p className="text-xs text-accent-600 font-medium">AI-Powered Matching</p>
            <p className="text-[11px] text-accent-500/70 mt-0.5">Smarter hiring, faster results</p>
          </div>
        </div>
      </aside>
    </>
  );
}

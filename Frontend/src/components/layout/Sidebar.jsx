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
import HireHubLogo from '../ui/HireHubLogo';

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
    { to: '/admin/users', icon: Users, label: 'User Directory & Control' },
    { to: '/admin/flagged', icon: Flag, label: 'Flagged Job Postings' },
    { to: '/admin/analytics', icon: BarChart3, label: 'System & Bias Analytics' },
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white border-r border-slate-200/80
          w-[var(--sidebar-width)] flex flex-col font-sans shadow-xs
          transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 h-20 border-b border-slate-100">
          <HireHubLogo size="md" />
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
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
                  flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-base font-extrabold transition-all duration-150
                  ${
                    isActive
                      ? 'bg-accent-500 text-white shadow-md shadow-accent-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50">
          <div className="px-3 py-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-[11px] uppercase tracking-wider font-extrabold text-accent-700">
              AI-Assisted Recruitment
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Explainable & Bias-Aware
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

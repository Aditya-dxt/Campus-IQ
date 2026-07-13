import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Calendar,
  User,
  LogOut,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';

/* ─── Navigation definitions per role ─── */
const studentLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resume', label: 'Resume Scanner', icon: FileText },
  { to: '/study', label: 'Study Assistant', icon: MessageSquare },
  { to: '/schedule', label: 'My Schedule', icon: Calendar },
  { to: '/profile', label: 'Profile', icon: User },
];

const mentorLinks = [
  { to: '/mentor', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: User },
];

const Sidebar = () => {
  const { role, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = role === 'mentor' ? mentorLinks : studentLinks;

  /* ─── Helpers ─── */
  const isActive = (to) => pathname === to;

  const closeMobile = () => setMobileOpen(false);

  /* ─── Shared sidebar content ─── */
  const SidebarContent = ({ expanded }) => (
    <div className="flex flex-col h-full">
      {/* Brand (visible only when expanded / mobile) */}
      {expanded && (
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <GraduationCap className="w-6 h-6 text-indigo-600 shrink-0" />
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
            CampusIQ
          </span>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-2 mt-4 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  active ? 'text-indigo-600' : 'text-gray-400'
                }`}
              />
              <span
                className={
                  expanded
                    ? 'opacity-100'
                    : 'opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto transition-all duration-200'
                }
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4 mt-auto">
        <button
          onClick={() => {
            closeMobile();
            logout();
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors whitespace-nowrap"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span
            className={
              expanded
                ? 'opacity-100'
                : 'opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto transition-all duration-200'
            }
          >
            Logout
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── Mobile hamburger button ─── */}
      <button
        type="button"
        aria-label="Toggle sidebar"
        onClick={() => setMobileOpen(true)}
        className="fixed z-50 p-2 text-gray-600 bg-white rounded-lg shadow-md top-20 left-3 lg:hidden hover:bg-gray-100 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ─── Mobile overlay + drawer ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeMobile}
          />
          {/* Drawer */}
          <aside className="relative flex flex-col w-64 h-full bg-white shadow-xl animate-slide-in-left">
            {/* Close button */}
            <button
              onClick={closeMobile}
              className="absolute p-1.5 rounded-lg top-3 right-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            <SidebarContent expanded />
          </aside>
        </div>
      )}

      {/* ─── Desktop sidebar (icon-only → expand on hover) ─── */}
      <aside className="hidden lg:flex fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] group">
        <div className="flex flex-col w-16 group-hover:w-60 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden">
          <SidebarContent expanded={false} />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

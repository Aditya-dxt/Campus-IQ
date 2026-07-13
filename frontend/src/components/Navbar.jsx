import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, GraduationCap, User } from 'lucide-react';

const Navbar = ({ title = '' }) => {
  const { user, role } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Track scroll to add shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Build initials from user name (e.g. "John Doe" → "JD")
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0].toUpperCase())
        .slice(0, 2)
        .join('')
    : '?';

  const roleBadgeColor =
    role === 'mentor'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-indigo-100 text-indigo-700';

  return (
    <nav
      className={`sticky top-0 z-50 w-full bg-white border-b border-gray-200 transition-shadow duration-300 animate-fade-in ${
        scrolled ? 'shadow-md' : 'shadow-none'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 mx-auto max-w-screen-2xl sm:px-6 lg:px-8">
        {/* ─── Left: Logo ─── */}
        <Link to="/" className="flex items-center gap-2 select-none">
          <GraduationCap className="w-7 h-7 text-indigo-600" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">
            CampusIQ
          </span>
        </Link>

        {/* ─── Center: Page title ─── */}
        {title && (
          <h1 className="hidden text-lg font-semibold text-gray-800 md:block">
            {title}
          </h1>
        )}

        {/* ─── Right: Actions ─── */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notification bell */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Role badge */}
          <span
            className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeColor}`}
          >
            {role || 'user'}
          </span>

          {/* Profile avatar */}
          <Link
            to="/profile"
            className="flex items-center gap-2 group"
            aria-label="Profile"
          >
            <div className="flex items-center justify-center w-9 h-9 text-sm font-semibold text-white bg-indigo-600 rounded-full ring-2 ring-indigo-200 group-hover:ring-indigo-400 transition-all">
              {initials}
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

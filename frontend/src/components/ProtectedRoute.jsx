import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();

  // Show centered spinner while auth state is resolving
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect users whose role isn't in allowedRoles
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const fallback = role === 'mentor' ? '/mentor' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  // Authorized — render child routes
  return <Outlet />;
};

export default ProtectedRoute;

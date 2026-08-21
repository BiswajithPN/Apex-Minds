import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, homePath } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const target = homePath(role);
    return <Navigate to={target || '/login'} replace />;
  }

  return children;
}

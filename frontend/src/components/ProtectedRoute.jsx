import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BootScreen } from './ui/Feedback';
import { MANAGER_ROLES, ROLES, ROLE_ROUTES } from '../utils/constants';

/** Requires a session; optionally restricts to roles. Unauthorised roles go to their own home. */
export function ProtectedRoute({ children, allowedRoles = null, fallbackPath = '/login' }) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) return <BootScreen />;

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to={ROLE_ROUTES[user?.role_id] || '/login'} replace />;
  }

  return children;
}

/** Public-only pages (welcome, login, register) bounce signed-in users to their workspace. */
export function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, homePath } = useAuth();
  if (isLoading) return <BootScreen />;
  if (isAuthenticated) return <Navigate to={homePath} replace />;
  return children;
}

/** /dashboard → the signed-in role's home workspace. */
export function HomeRedirect() {
  const { isAuthenticated, isLoading, homePath } = useAuth();
  if (isLoading) return <BootScreen />;
  return <Navigate to={isAuthenticated ? homePath : '/login'} replace />;
}

export function AdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>{children}</ProtectedRoute>;
}

export function ShelterManagerRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ROLES.SHELTER_MANAGER]}>{children}</ProtectedRoute>;
}

export function ReliefManagerRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ROLES.RELIEF_MANAGER]}>{children}</ProtectedRoute>;
}

export function VolunteerRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ROLES.VOLUNTEER]}>{children}</ProtectedRoute>;
}

export function DonorRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ROLES.DONOR]}>{children}</ProtectedRoute>;
}

export function ManagerRoute({ children }) {
  return <ProtectedRoute allowedRoles={MANAGER_ROLES}>{children}</ProtectedRoute>;
}

export function OperationalRoute({ children }) {
  return <ProtectedRoute allowedRoles={[...MANAGER_ROLES, ROLES.VOLUNTEER]}>{children}</ProtectedRoute>;
}

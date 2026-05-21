import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '../../components';
import { useAuth } from './AuthContext';
import type { UserRole } from '../types/db';

export interface ProtectedRouteProps {
  role: UserRole;
  children: ReactNode;
}

const ROLE_HOME: Record<UserRole, string> = {
  super_admin: '/admin',
  property_manager: '/ops',
  resident: '/portal',
  attendant: '/portal',
};

const ROLE_SIGN_IN: Record<UserRole, string> = {
  super_admin: '/sign-in/manager',
  property_manager: '/sign-in/manager',
  resident: '/sign-in/resident',
  attendant: '/sign-in/resident',
};

export function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { status, profile } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Spinner />
      </div>
    );
  }

  if (status === 'anonymous' || !profile) {
    return <Navigate to={ROLE_SIGN_IN[role]} replace state={{ from: location.pathname }} />;
  }

  if (profile.must_change_password) {
    return <Navigate to="/auth/reset" replace />;
  }

  const isAuthorised =
    profile.role === role ||
    (profile.role === 'super_admin' &&
      (role === 'property_manager' || role === 'resident' || role === 'attendant'));

  if (!isAuthorised) {
    return <Navigate to={ROLE_HOME[profile.role]} replace />;
  }

  return <>{children}</>;
}

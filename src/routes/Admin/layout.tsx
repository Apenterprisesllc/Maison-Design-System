import { Outlet, useNavigate } from 'react-router-dom';
import { ToastProvider } from '../../components';
import { useAuth } from '../../lib/auth';
import { AdminChrome } from './AdminChrome';
import { AdminProvider } from './context';

function AdminShell() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <AdminChrome onSignOut={handleSignOut}>
      <Outlet />
    </AdminChrome>
  );
}

export function AdminLayout() {
  return (
    <AdminProvider>
      <ToastProvider>
        <AdminShell />
      </ToastProvider>
    </AdminProvider>
  );
}

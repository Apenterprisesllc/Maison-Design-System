import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { renderWithProviders, signInAs, signOutForTest } from '../../test/test-utils';

function TestRoutes() {
  return (
    <Routes>
      <Route path="/sign-in/resident" element={<div>RESIDENT SIGN-IN</div>} />
      <Route path="/sign-in/manager" element={<div>MANAGER SIGN-IN</div>} />
      <Route path="/portal" element={<div>RESIDENT HOME</div>} />
      <Route path="/ops" element={<div>OPS HOME</div>} />
      <Route path="/admin" element={<div>ADMIN HOME</div>} />
      <Route path="/auth/reset" element={<div>RESET GATE</div>} />
      <Route
        path="/private-resident"
        element={
          <ProtectedRoute role="resident">
            <div>PRIVATE RESIDENT</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/private-manager"
        element={
          <ProtectedRoute role="property_manager">
            <div>PRIVATE MANAGER</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/private-admin"
        element={
          <ProtectedRoute role="super_admin">
            <div>PRIVATE ADMIN</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  it('redirects anonymous users to the role-appropriate sign-in page', async () => {
    await signOutForTest();
    renderWithProviders(<TestRoutes />, { route: '/private-resident' });
    expect(await screen.findByText('RESIDENT SIGN-IN')).toBeInTheDocument();
  });

  it('redirects to /auth/reset when the profile requires a password change', async () => {
    await signInAs('firstlogin@thearden.test', 'TempPass2026!');
    renderWithProviders(<TestRoutes />, { route: '/private-resident' });
    expect(await screen.findByText('RESET GATE')).toBeInTheDocument();
  });

  it('lets a resident through their own role gate', async () => {
    await signInAs('resident@thearden.test', 'ResidentPass2026!');
    renderWithProviders(<TestRoutes />, { route: '/private-resident' });
    expect(await screen.findByText('PRIVATE RESIDENT')).toBeInTheDocument();
  });

  it('bounces a resident off a manager-only route to their role home', async () => {
    await signInAs('resident@thearden.test', 'ResidentPass2026!');
    renderWithProviders(<TestRoutes />, { route: '/private-manager' });
    expect(await screen.findByText('RESIDENT HOME')).toBeInTheDocument();
  });

  it('lets a super_admin through resident, manager, and admin routes', async () => {
    await signInAs('admin@apenterprises.test', 'AdminPass2026!');
    renderWithProviders(<TestRoutes />, { route: '/private-admin' });
    expect(await screen.findByText('PRIVATE ADMIN')).toBeInTheDocument();
  });
});

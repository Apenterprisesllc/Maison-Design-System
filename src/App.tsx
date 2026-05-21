import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PageTransition, Spinner, useLucide } from './components';
import { ProtectedRoute } from './lib/auth';
import { Landing } from './routes/Landing';

// Auth screens — small individually but rarely used after sign-in.
const SignInResident = lazy(() =>
  import('./routes/SignInResident').then((m) => ({ default: m.SignInResident })),
);
const SignInManager = lazy(() =>
  import('./routes/SignInManager').then((m) => ({ default: m.SignInManager })),
);
const FirstLoginGate = lazy(() =>
  import('./lib/auth/FirstLoginGate').then((m) => ({ default: m.FirstLoginGate })),
);

// Portal (resident). Each route is its own chunk; Vite groups shared deps.
const PortalLayout = lazy(() =>
  import('./routes/Portal/layout').then((m) => ({ default: m.PortalLayout })),
);
const Catalogue = lazy(() =>
  import('./routes/Portal/Catalogue').then((m) => ({ default: m.Catalogue })),
);
const BookingFlow = lazy(() =>
  import('./routes/Portal/BookingFlow').then((m) => ({ default: m.BookingFlow })),
);
const Confirmation = lazy(() =>
  import('./routes/Portal/Confirmation').then((m) => ({ default: m.Confirmation })),
);
const Account = lazy(() => import('./routes/Portal/Account').then((m) => ({ default: m.Account })));

// Ops (manager). Heaviest section — drag-drop kit, drawers, modals.
const OpsLayout = lazy(() => import('./routes/Ops/layout').then((m) => ({ default: m.OpsLayout })));
const Pipeline = lazy(() => import('./routes/Ops/Pipeline').then((m) => ({ default: m.Pipeline })));
const BookingsTable = lazy(() =>
  import('./routes/Ops/BookingsTable').then((m) => ({ default: m.BookingsTable })),
);
const Residences = lazy(() =>
  import('./routes/Ops/Residences').then((m) => ({ default: m.Residences })),
);
const Reports = lazy(() => import('./routes/Ops/Reports').then((m) => ({ default: m.Reports })));

// Admin (super_admin only).
const AdminLayout = lazy(() =>
  import('./routes/Admin/layout').then((m) => ({ default: m.AdminLayout })),
);
const AdminOverview = lazy(() =>
  import('./routes/Admin/Overview').then((m) => ({ default: m.Overview })),
);
const AdminManagers = lazy(() =>
  import('./routes/Admin/Managers').then((m) => ({ default: m.Managers })),
);

function topLevelKey(pathname: string): string {
  if (pathname.startsWith('/portal')) return '/portal';
  if (pathname.startsWith('/sign-in/resident')) return '/sign-in/resident';
  if (pathname.startsWith('/sign-in/manager')) return '/sign-in/manager';
  if (pathname.startsWith('/admin')) return '/admin';
  if (pathname.startsWith('/ops')) return '/ops';
  if (pathname.startsWith('/auth')) return '/auth';
  return '/';
}

function LazyFallback() {
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

function AppRoutes() {
  const location = useLocation();
  useLucide();
  return (
    <PageTransition transitionKey={topLevelKey(location.pathname)}>
      <Suspense fallback={<LazyFallback />}>
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/sign-in" element={<Navigate to="/sign-in/resident" replace />} />
          <Route path="/sign-in/resident" element={<SignInResident />} />
          <Route path="/sign-in/manager" element={<SignInManager />} />
          <Route path="/auth/reset" element={<FirstLoginGate />} />
          <Route
            path="/portal"
            element={
              <ProtectedRoute role="resident">
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Catalogue />} />
            <Route path="services/:serviceId/book" element={<BookingFlow />} />
            <Route path="services/:serviceId/confirm" element={<Confirmation />} />
            <Route path="account" element={<Account />} />
          </Route>
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="super_admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="managers" element={<AdminManagers />} />
          </Route>
          <Route
            path="/ops"
            element={
              <ProtectedRoute role="property_manager">
                <OpsLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Pipeline />} />
            <Route path="bookings" element={<BookingsTable />} />
            <Route path="residences" element={<Residences />} />
            <Route path="residents" element={<Residences />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </PageTransition>
  );
}

export function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppRoutes />
    </BrowserRouter>
  );
}

import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PageTransition, Spinner, useLucide } from './components';
import { ProtectedRoute } from './lib/auth';
import { Landing } from './routes/Landing';

// Auth screens — managers and admins only. Residents and commercial users
// now use the public guest booking flow at /book/* without credentials.
const SignInManager = lazy(() =>
  import('./routes/SignInManager').then((m) => ({ default: m.SignInManager })),
);
const FirstLoginGate = lazy(() =>
  import('./lib/auth/FirstLoginGate').then((m) => ({ default: m.FirstLoginGate })),
);

// Public guest booking flow.
const BookLanding = lazy(() =>
  import('./routes/Book/Landing').then((m) => ({ default: m.BookLanding })),
);
const PropertyCatalogue = lazy(() =>
  import('./routes/Book/PropertyCatalogue').then((m) => ({ default: m.PropertyCatalogue })),
);
const GuestBookingFlow = lazy(() =>
  import('./routes/Book/GuestBookingFlow').then((m) => ({ default: m.GuestBookingFlow })),
);
const ContactStep = lazy(() =>
  import('./routes/Book/ContactStep').then((m) => ({ default: m.ContactStep })),
);
const GuestConfirmation = lazy(() =>
  import('./routes/Book/GuestConfirmation').then((m) => ({ default: m.GuestConfirmation })),
);

// Ops (manager). Heaviest section — drag-drop kit, drawers, modals.
const OpsLayout = lazy(() => import('./routes/Ops/layout').then((m) => ({ default: m.OpsLayout })));
// Manager-facing screens (the only two views a property_manager sees).
const ManagerBookings = lazy(() =>
  import('./routes/Ops/ManagerBookings').then((m) => ({ default: m.ManagerBookings })),
);
const ManagerReferrals = lazy(() =>
  import('./routes/Ops/ManagerReferrals').then((m) => ({ default: m.ManagerReferrals })),
);

// AP super-admin operational screens (formerly under /ops, now consolidated
// under /admin/*).
const AdminPipeline = lazy(() =>
  import('./routes/Admin/Pipeline').then((m) => ({ default: m.AdminPipeline })),
);
const AdminBookings = lazy(() =>
  import('./routes/Admin/Bookings').then((m) => ({ default: m.AdminBookings })),
);
const AdminProperties = lazy(() =>
  import('./routes/Admin/Properties').then((m) => ({ default: m.AdminProperties })),
);
const AdminReports = lazy(() =>
  import('./routes/Admin/Reports').then((m) => ({ default: m.AdminReports })),
);
const AdminReferrals = lazy(() =>
  import('./routes/Admin/Referrals').then((m) => ({ default: m.AdminReferrals })),
);

// Admin (super_admin only).
const AdminLayout = lazy(() =>
  import('./routes/Admin/layout').then((m) => ({ default: m.AdminLayout })),
);
const AdminConsole = lazy(() =>
  import('./routes/Admin/Console').then((m) => ({ default: m.Console })),
);
const AdminManagers = lazy(() =>
  import('./routes/Admin/Managers').then((m) => ({ default: m.Managers })),
);

function topLevelKey(pathname: string): string {
  if (pathname.startsWith('/book')) return '/book';
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
          <Route path="/sign-in" element={<Navigate to="/sign-in/manager" replace />} />
          <Route path="/sign-in/resident" element={<Navigate to="/book" replace />} />
          <Route path="/sign-in/manager" element={<SignInManager />} />
          <Route path="/auth/reset" element={<FirstLoginGate />} />
          <Route path="/portal" element={<Navigate to="/book" replace />} />
          <Route path="/portal/*" element={<Navigate to="/book" replace />} />
          <Route path="/book" element={<BookLanding />} />
          <Route path="/book/:propertySlug" element={<PropertyCatalogue />} />
          <Route path="/book/:propertySlug/services/:serviceSlug" element={<GuestBookingFlow />} />
          <Route path="/book/:propertySlug/services/:serviceSlug/contact" element={<ContactStep />} />
          <Route path="/book/confirm/:bookingId" element={<GuestConfirmation />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="super_admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminConsole />} />
            <Route path="pipeline" element={<AdminPipeline />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="managers" element={<AdminManagers />} />
            <Route path="referrals" element={<AdminReferrals />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
          <Route
            path="/ops"
            element={
              <ProtectedRoute role="property_manager">
                <OpsLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ManagerBookings />} />
            <Route path="referrals" element={<ManagerReferrals />} />
            {/* Legacy paths the manager doesn't visit anymore — kick them home. */}
            <Route path="pipeline"   element={<Navigate to="/ops" replace />} />
            <Route path="bookings"   element={<Navigate to="/ops" replace />} />
            <Route path="residences" element={<Navigate to="/ops" replace />} />
            <Route path="residents"  element={<Navigate to="/ops" replace />} />
            <Route path="reports"    element={<Navigate to="/ops" replace />} />
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

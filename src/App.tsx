import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PageTransition, useLucide } from './components';
import { Landing } from './routes/Landing';
import { BookingsTable } from './routes/Ops/BookingsTable';
import { OpsLayout } from './routes/Ops/layout';
import { Pipeline } from './routes/Ops/Pipeline';
import { Reports } from './routes/Ops/Reports';
import { Residences } from './routes/Ops/Residences';
import { Account } from './routes/Portal/Account';
import { BookingFlow } from './routes/Portal/BookingFlow';
import { Catalogue } from './routes/Portal/Catalogue';
import { Confirmation } from './routes/Portal/Confirmation';
import { PortalLayout } from './routes/Portal/layout';
import { SignInManager } from './routes/SignInManager';
import { SignInResident } from './routes/SignInResident';

function topLevelKey(pathname: string): string {
  if (pathname.startsWith('/portal')) return '/portal';
  if (pathname.startsWith('/sign-in/resident')) return '/sign-in/resident';
  if (pathname.startsWith('/sign-in/manager')) return '/sign-in/manager';
  if (pathname.startsWith('/ops')) return '/ops';
  return '/';
}

function AppRoutes() {
  const location = useLocation();
  useLucide();
  return (
    <PageTransition transitionKey={topLevelKey(location.pathname)}>
      <Routes location={location}>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in" element={<Navigate to="/sign-in/resident" replace />} />
        <Route path="/sign-in/resident" element={<SignInResident />} />
        <Route path="/sign-in/manager" element={<SignInManager />} />
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<Catalogue />} />
          <Route path="services/:serviceId/book" element={<BookingFlow />} />
          <Route path="services/:serviceId/confirm" element={<Confirmation />} />
          <Route path="account" element={<Account />} />
        </Route>
        <Route path="/ops" element={<OpsLayout />}>
          <Route index element={<Pipeline />} />
          <Route path="bookings" element={<BookingsTable />} />
          <Route path="residences" element={<Residences />} />
          <Route path="residents" element={<Residences />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

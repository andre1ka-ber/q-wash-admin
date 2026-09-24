import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authStore, useAuth, color } from 'q-wash-shared';
import { AdminShell } from './shared/layout/AdminShell';
import { LoginPage } from './features/auth/LoginPage';
import { PointsPage } from './features/points/PointsPage';
import { QrCodesPage } from './features/qr-codes/QrCodesPage';
import { OwnersPage } from './features/owners/OwnersPage';
import { ConnectionRequestsPage } from './features/connection-requests/ConnectionRequestsPage';
import { BookingsPage } from './features/bookings/BookingsPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';

const queryClient = new QueryClient();

function FullScreenLoader() {
  return <div style={{ minHeight: '100vh', background: color.pageBg }} />;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginRoute() {
  const { status } = useAuth();
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <LoginPage />;
}

function AppRoutes() {
  useEffect(() => {
    authStore.restore();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<PointsPage />} />
        <Route path="qr-codes" element={<QrCodesPage />} />
        <Route path="owners" element={<OwnersPage />} />
        <Route path="connection-requests" element={<ConnectionRequestsPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

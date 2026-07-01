import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterClientPage from './pages/auth/RegisterClientPage';
import RegisterLawyerPage from './pages/auth/RegisterLawyerPage';
import SearchPage from './pages/search/SearchPage';
import LawyerDetailPage from './pages/lawyer/LawyerDetailPage';
import AvailabilityCalendarPage from './pages/lawyer/AvailabilityCalendarPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientBookingsPage from './pages/client/ClientBookingsPage';

// Placeholder dashboards
const ClientDashboard = () => (
  <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
    <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Dashboard Client</h1>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <a href="/search" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
        → Trouver un avocat
      </a>
      <a href="/client/bookings" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
        → Mes rendez-vous
      </a>
    </div>
  </div>
);

const LawyerDashboard = () => (
  <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
    <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Dashboard Avocat</h1>
    <a href="/lawyer/availabilities" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
      → Gérer mes disponibilités
    </a>
  </div>
);

const ProtectedRoute = ({ children, role }: { children: ReactElement; role: string }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                element={<Navigate to="/login" replace />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterClientPage />} />
      <Route path="/register/lawyer" element={<RegisterLawyerPage />} />

      {/* Recherche publique */}
      <Route path="/search"          element={<SearchPage />} />
      <Route path="/lawyers/:id"     element={<LawyerDetailPage />} />

      {/* Dashboards protégés */}
      <Route path="/client/dashboard" element={
        <ProtectedRoute role="CLIENT"><ClientDashboard /></ProtectedRoute>
      } />
      <Route path="/client/bookings" element={
        <ProtectedRoute role="CLIENT"><ClientBookingsPage /></ProtectedRoute>
      } />
      <Route path="/lawyer/dashboard" element={
        <ProtectedRoute role="LAWYER"><LawyerDashboard /></ProtectedRoute>
      } />
      <Route path="/lawyer/availabilities" element={
        <ProtectedRoute role="LAWYER"><AvailabilityCalendarPage /></ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
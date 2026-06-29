import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterClientPage from './pages/auth/RegisterClientPage';
import RegisterLawyerPage from './pages/auth/RegisterLawyerPage';
import SearchPage from './pages/search/SearchPage';

// Placeholder dashboards
const ClientDashboard = () => (
  <div className="p-8 text-slate-700 flex flex-col gap-4">
    <h1 className="text-2xl font-bold">Dashboard Client</h1>
    <a href="/search" className="text-indigo-600 hover:underline font-medium">
      → Trouver un avocat
    </a>
  </div>
);
const LawyerDashboard = () => <div className="p-8 text-slate-700">Dashboard Avocat — Sprint 3</div>;
const AdminDashboard  = () => <div className="p-8 text-slate-700">Dashboard Admin — Sprint 7</div>;

// Route protégée par rôle
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

      {/* Recherche — accessible à tous les utilisateurs connectés */}
      <Route path="/search" element={<SearchPage />} />

      <Route path="/client/dashboard" element={
        <ProtectedRoute role="CLIENT"><ClientDashboard /></ProtectedRoute>
      } />
      <Route path="/lawyer/dashboard" element={
        <ProtectedRoute role="LAWYER"><LawyerDashboard /></ProtectedRoute>
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
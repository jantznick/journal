import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { authAPI } from './api/api';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/authStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Sso from './pages/Sso';
import Write from './pages/Write';
import Entries from './pages/Entries';
import EntryDetail from './pages/EntryDetail';
import Insights from './pages/Insights';
import Settings from './pages/Settings';

function AppLayout() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Outlet />
      </AppShell>
    </ProtectedRoute>
  );
}

function Home() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>
    );
  }
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return <Landing />;
}

export default function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const check = async () => {
      try {
        const data = await authAPI.me();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [setUser, setLoading]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/sso" element={<Sso />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Write />} />
        <Route path="entries" element={<Entries />} />
        <Route path="entries/:id" element={<EntryDetail />} />
        <Route path="insights" element={<Insights />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

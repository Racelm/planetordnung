import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Kunden from './pages/Kunden';
import Einsaetze from './pages/Einsaetze';
import Rechnungen from './pages/Rechnungen';
import Buchhaltung from './pages/Buchhaltung';
import Kalender from './pages/Kalender';
import Aufgaben from './pages/Aufgaben';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px'
    }}>
      <div style={{ fontSize: '3rem' }}>🌍</div>
      <div style={{ color: '#fff', fontWeight: '700', fontSize: '1.1rem' }}>Planet Ordnung</div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Wird geladen...</div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter basename="/planetordnung">
      <Routes>
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/kunden" element={<Kunden />} />
                <Route path="/kunden/neu" element={<Kunden autoNeu />} />
                <Route path="/einsaetze" element={<Einsaetze />} />
                <Route path="/einsaetze/neu" element={<Einsaetze autoNeu />} />
                <Route path="/rechnungen" element={<Rechnungen />} />
                <Route path="/rechnungen/neu" element={<Rechnungen autoNeu />} />
                <Route path="/buchhaltung" element={<Buchhaltung />} />
                <Route path="/kalender" element={<Kalender />} />
                <Route path="/kalender/neu" element={<Kalender autoNeu />} />
                <Route path="/aufgaben" element={<Aufgaben />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

function LoginWrapper() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" />;
  return <Login />;
}

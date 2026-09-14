import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { path: '/', icon: '🏠', label: 'Start' },
  { path: '/kunden', icon: '👥', label: 'Kunden' },
  { path: '/einsaetze', icon: '📋', label: 'Einsätze' },
  { path: '/rechnungen', icon: '🧾', label: 'Rechnungen' },
  { path: '/buchhaltung', icon: '💰', label: 'Buchhaltung' },
  { path: '/kalender', icon: '📅', label: 'Kalender' },
  { path: '/aufgaben', icon: '✅', label: 'Aufgaben' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        color: '#fff', padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '56px', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🌍</span>
          <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>Planet Ordnung</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{user?.displayName?.split(' ')[0]}</span>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px',
              color: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: '1.1rem' }}>
            ☰
          </button>
        </div>
      </header>

      {/* Slide-in Menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setMenuOpen(false)}>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '260px',
            background: '#1e3a5f', padding: '20px 0', boxShadow: '-4px 0 20px rgba(0,0,0,0.3)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '2rem' }}>🌍</div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>{user?.displayName}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{user?.email}</div>
            </div>
            {NAV.map(n => (
              <button key={n.path}
                onClick={() => { navigate(n.path); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  width: '100%', padding: '14px 20px', border: 'none',
                  background: location.pathname === n.path ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: '#fff', fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left',
                  borderLeft: location.pathname === n.path ? '3px solid #60a5fa' : '3px solid transparent'
                }}>
                <span style={{ fontSize: '1.2rem' }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, padding: '0 20px' }}>
              <button onClick={logout} style={{
                width: '100%', padding: '12px', background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px',
                color: '#fff', cursor: 'pointer', fontSize: '0.9rem'
              }}>
                🚪 Abmelden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav für Mobile */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid #e2e8f0',
        display: 'flex', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.08)'
      }}>
        {NAV.slice(0, 5).map(n => (
          <button key={n.path}
            onClick={() => navigate(n.path)}
            style={{
              flex: 1, padding: '8px 4px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              color: location.pathname === n.path ? '#2563eb' : '#94a3b8',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
            }}>
            <span style={{ fontSize: '1.3rem' }}>{n.icon}</span>
            <span style={{ fontSize: '0.6rem', fontWeight: '600' }}>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '16px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  );
}

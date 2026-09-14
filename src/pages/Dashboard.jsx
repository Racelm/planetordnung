import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fsAll } from '../firebase/db';

const Card = ({ icon, label, value, color, onClick }) => (
  <div onClick={onClick} style={{
    background: '#fff', borderRadius: '16px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: onClick ? 'pointer' : 'default',
    borderLeft: `4px solid ${color}`, transition: 'transform 0.15s',
  }}
    onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
    onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
  >
    <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{icon}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: '800', color }}>{value}</div>
    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>{label}</div>
  </div>
);

const QuickBtn = ({ icon, label, onClick, color }) => (
  <button onClick={onClick} style={{
    background: color || '#2563eb', color: '#fff', border: 'none',
    borderRadius: '14px', padding: '16px 12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700',
    boxShadow: '0 4px 12px rgba(37,99,235,0.3)', flex: 1,
    transition: 'transform 0.15s'
  }}
    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
  >
    <span style={{ fontSize: '1.6rem' }}>{icon}</span>
    {label}
  </button>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ kunden: 0, aktiv: 0, einsaetze: 0, rechnungen: 0, offen: 0, einnahmen: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fsAll(user.uid, 'kunden'),
      fsAll(user.uid, 'einsaetze'),
      fsAll(user.uid, 'rechnungen'),
    ]).then(([kunden, einsaetze, rechnungen]) => {
      const einnahmen = rechnungen.filter(r => r.bezahlt).reduce((s, r) => s + (r.brutto || 0), 0);
      setStats({
        kunden: kunden.length,
        aktiv: kunden.filter(k => (k.status || 'aktiv') === 'aktiv').length,
        einsaetze: einsaetze.length,
        rechnungen: rechnungen.length,
        offen: rechnungen.filter(r => !r.bezahlt).length,
        einnahmen,
      });
      setLoading(false);
    });
  }, [user]);

  const heute = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Begrüßung */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', margin: '0 0 4px' }}>
          Guten Tag, {user?.displayName?.split(' ')[0]}! 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>{heute}</p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <QuickBtn icon="👥" label="Kunde" onClick={() => navigate('/kunden/neu')} color="#2563eb" />
        <QuickBtn icon="📋" label="Einsatz" onClick={() => navigate('/einsaetze/neu')} color="#7c3aed" />
        <QuickBtn icon="🧾" label="Rechnung" onClick={() => navigate('/rechnungen/neu')} color="#059669" />
        <QuickBtn icon="📅" label="Termin" onClick={() => navigate('/kalender/neu')} color="#d97706" />
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Wird geladen...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <Card icon="👥" label="Aktive Kunden" value={stats.aktiv} color="#2563eb" onClick={() => navigate('/kunden')} />
          <Card icon="📋" label="Einsätze gesamt" value={stats.einsaetze} color="#7c3aed" onClick={() => navigate('/einsaetze')} />
          <Card icon="🧾" label="Rechnungen offen" value={stats.offen} color="#dc2626" onClick={() => navigate('/rechnungen')} />
          <Card icon="💰" label="Einnahmen EUR" value={stats.einnahmen.toFixed(0)} color="#059669" onClick={() => navigate('/buchhaltung')} />
        </div>
      )}

      {/* Info Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
        borderRadius: '16px', padding: '20px', color: '#fff'
      }}>
        <div style={{ fontWeight: '700', marginBottom: '8px' }}>📊 Übersicht</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', opacity: 0.9 }}>
          <span>Kunden gesamt: {stats.kunden}</span>
          <span>Rechnungen: {stats.rechnungen}</span>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fsAll, fsAdd, fsDel } from '../firebase/db';
import { exportCSV } from '../utils/csv';

const KATEGORIEN = [
  { id: 'handy', label: '📱 Handy' },
  { id: 'restaurant', label: '🍽️ Restaurant' },
  { id: 'tankstelle', label: '⛽ Tankstelle' },
  { id: 'fahrt', label: '🚗 Fahrt' },
  { id: 'buero', label: '🏢 Büro' },
  { id: 'versicherung', label: '🛡️ Versicherung' },
  { id: 'miete', label: '🏠 Miete' },
  { id: 'personal', label: '👤 Personal' },
  { id: 'sonstiges', label: '📦 Sonstiges' },
];

export default function Buchhaltung() {
  const { user } = useAuth();
  const [tab, setTab] = useState('übersicht');
  const [ausgaben, setAusgaben] = useState([]);
  const [rechnungen, setRechnungen] = useState([]);
  const [kunden, setKunden] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [a, r, k] = await Promise.all([
      fsAll(user.uid, 'ausgaben'),
      fsAll(user.uid, 'rechnungen'),
      fsAll(user.uid, 'kunden'),
    ]);
    setAusgaben(a.sort((x, y) => (y.datum || '').localeCompare(x.datum || '')));
    setRechnungen(r.sort((x, y) => (y.datum || '').localeCompare(x.datum || '')));
    setKunden(k);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const einnahmen = rechnungen.filter(r => r.bezahlt).reduce((s, r) => s + (r.brutto || 0), 0);
  const ausstehend = rechnungen.filter(r => !r.bezahlt).reduce((s, r) => s + (r.brutto || 0), 0);
  const ausgabenGesamt = ausgaben.reduce((s, a) => s + (a.betrag || 0), 0);
  const gewinn = einnahmen - ausgabenGesamt;

  const saveAusgabe = async () => {
    if (!form.kategorie || !form.betrag || !form.datum) return alert('Bitte alle Pflichtfelder ausfüllen');
    setSaving(true);
    await fsAdd(user.uid, 'ausgaben', form);
    await load();
    setForm(null);
    setSaving(false);
  };

  const delAusgabe = async (a) => {
    if (!confirm('Ausgabe löschen?')) return;
    await fsDel(user.uid, 'ausgaben', a.id);
    await load();
  };

  const csvAusgaben = () => exportCSV('Ausgaben', ausgaben, ['datum', 'kategorie', 'beschreibung', 'betrag']);
  const csvEinnahmen = () => {
    const rows = rechnungen.map(r => ({
      rechnungsnummer: r.rechnungsnummer || '',
      kunde: kunden.find(k => k.id === r.kundeId) ? `${kunden.find(k => k.id === r.kundeId).vorname} ${kunden.find(k => k.id === r.kundeId).name}` : '',
      datum: r.datum || '',
      brutto: r.brutto || 0,
      bezahlt: r.bezahlt ? 'Ja' : 'Nein'
    }));
    exportCSV('Einnahmen', rows, ['rechnungsnummer', 'kunde', 'datum', 'brutto', 'bezahlt']);
  };

  const StatCard = ({ label, value, color, sub }) => (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: '800', color }}>{value} EUR</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: '800' }}>💰 Buchhaltung</h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
        {['übersicht', 'einnahmen', 'ausgaben'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            fontWeight: '600', fontSize: '0.85rem',
            background: tab === t ? '#1e3a5f' : '#f1f5f9', color: tab === t ? '#fff' : '#64748b'
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'übersicht' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <StatCard label="Einnahmen" value={einnahmen.toFixed(2)} color="#059669" sub="bezahlte Rechnungen" />
            <StatCard label="Ausstehend" value={ausstehend.toFixed(2)} color="#d97706" sub="offene Rechnungen" />
            <StatCard label="Ausgaben" value={ausgabenGesamt.toFixed(2)} color="#dc2626" />
            <StatCard label="Gewinn" value={gewinn.toFixed(2)} color={gewinn >= 0 ? '#059669' : '#dc2626'} sub="Einnahmen - Ausgaben" />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={csvEinnahmen} style={{ flex: 1, padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
              📊 Einnahmen CSV
            </button>
            <button onClick={csvAusgaben} style={{ flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
              📊 Ausgaben CSV
            </button>
          </div>
        </div>
      )}

      {tab === 'einnahmen' && (
        <div>
          {rechnungen.map(r => {
            const k = kunden.find(k => k.id === r.kundeId);
            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{r.rechnungsnummer || '-'}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{k ? `${k.vorname} ${k.name}` : '-'} · {r.datum}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', color: '#059669' }}>{(r.brutto || 0).toFixed(2)} EUR</div>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: r.bezahlt ? '#dcfce7' : '#fef3c7', color: r.bezahlt ? '#059669' : '#d97706', fontWeight: '700' }}>
                    {r.bezahlt ? '✓ Bezahlt' : '⏳ Offen'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'ausgaben' && (
        <div>
          {form === null ? (
            <button onClick={() => setForm({ datum: new Date().toISOString().split('T')[0], kategorie: 'sonstiges' })}
              style={{ width: '100%', padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', marginBottom: '16px' }}>
              + Neue Ausgabe
            </button>
          ) : (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Datum *</label>
                <input type="date" value={form.datum || ''} onChange={e => setForm(f => ({ ...f, datum: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Kategorie *</label>
                <select value={form.kategorie || ''} onChange={e => setForm(f => ({ ...f, kategorie: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem' }}>
                  {KATEGORIEN.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Beschreibung</label>
                <input value={form.beschreibung || ''} onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Betrag (EUR) *</label>
                <input type="number" step="0.01" min="0" value={form.betrag || ''} onChange={e => setForm(f => ({ ...f, betrag: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setForm(null)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Abbrechen</button>
                <button onClick={saveAusgabe} disabled={saving} style={{ flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
                  {saving ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </div>
          )}

          {ausgaben.map(a => {
            const kat = KATEGORIEN.find(k => k.id === a.kategorie);
            return (
              <div key={a.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{kat?.label || a.kategorie}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{a.datum} {a.beschreibung ? `· ${a.beschreibung}` : ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontWeight: '800', color: '#dc2626' }}>{(a.betrag || 0).toFixed(2)} EUR</div>
                  <button onClick={() => delAusgabe(a)} style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

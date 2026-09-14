import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fsAll, fsAdd, fsDel, fsUpd } from '../firebase/db';

const TYPEN = [
  { id: 'allgemein', label: 'Allgemein', color: '#2563eb' },
  { id: 'kunde', label: 'Kunde', color: '#7c3aed' },
  { id: 'arzt', label: 'Arzt', color: '#dc2626' },
  { id: 'privat', label: 'Privat', color: '#059669' },
  { id: 'behoerde', label: 'Behörde', color: '#d97706' },
  { id: 'sonstiges', label: 'Sonstiges', color: '#64748b' },
];

export default function Kalender() {
  const { user } = useAuth();
  const [termine, setTermine] = useState([]);
  const [kunden, setKunden] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [t, k] = await Promise.all([fsAll(user.uid, 'termine'), fsAll(user.uid, 'kunden')]);
    setTermine(t.sort((a, b) => (a.datum || '').localeCompare(b.datum || '')));
    setKunden(k);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const heute = new Date().toISOString().split('T')[0];
  const naechste7 = termine.filter(t => t.datum >= heute).slice(0, 10);

  const save = async () => {
    if (!form.titel || !form.datum) return alert('Titel und Datum sind Pflichtfelder');
    setSaving(true);
    await fsAdd(user.uid, 'termine', form);
    await load();
    setForm(null);
    setSaving(false);
  };

  const del = async (t) => {
    if (!confirm('Termin löschen?')) return;
    await fsDel(user.uid, 'termine', t.id);
    await load();
  };

  if (form !== null) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setForm(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Neuer Termin</h2>
      </div>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {[
          { label: 'Titel *', field: 'titel', type: 'text' },
          { label: 'Datum *', field: 'datum', type: 'date' },
          { label: 'Uhrzeit', field: 'uhrzeit', type: 'time' },
          { label: 'Ort', field: 'ort', type: 'text' },
        ].map(({ label, field, type }) => (
          <div key={field} style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>{label}</label>
            <input type={type} value={form[field] || ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
          </div>
        ))}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Typ</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {TYPEN.map(t => (
              <button key={t.id} onClick={() => setForm(f => ({ ...f, typ: t.id }))} style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                background: (form.typ || 'allgemein') === t.id ? t.color : '#f1f5f9',
                color: (form.typ || 'allgemein') === t.id ? '#fff' : '#64748b'
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Kunde (optional)</label>
          <select value={form.kundeId || ''} onChange={e => setForm(f => ({ ...f, kundeId: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem' }}>
            <option value="">-- Kein Kunde --</option>
            {kunden.map(k => <option key={k.id} value={k.id}>{k.vorname} {k.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Notiz</label>
          <textarea value={form.notiz || ''} onChange={e => setForm(f => ({ ...f, notiz: e.target.value }))}
            rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>

        <button onClick={save} disabled={saving} style={{ width: '100%', padding: '14px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}>
          {saving ? 'Speichern...' : '📅 Termin speichern'}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>📅 Kalender</h2>
        <button onClick={() => setForm({ datum: heute, typ: 'allgemein' })} style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>+ Neu</button>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', borderRadius: '14px', padding: '16px', marginBottom: '20px', color: '#fff' }}>
        <div style={{ fontWeight: '700', marginBottom: '4px' }}>📌 Nächste Termine</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{naechste7.length} anstehende Termine</div>
      </div>

      {naechste7.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Keine anstehenden Termine</div>
      ) : (
        naechste7.map(t => {
          const typ = TYPEN.find(tp => tp.id === t.typ) || TYPEN[0];
          const k = kunden.find(k => k.id === t.kundeId);
          const istHeute = t.datum === heute;
          return (
            <div key={t.id} style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${typ.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {istHeute && <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>📍 HEUTE</div>}
                <div style={{ fontWeight: '700', color: '#1e293b' }}>{t.titel}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {t.datum} {t.uhrzeit ? `· ${t.uhrzeit} Uhr` : ''} {t.ort ? `· ${t.ort}` : ''}
                </div>
                {k && <div style={{ fontSize: '0.75rem', color: typ.color, fontWeight: '600' }}>👤 {k.vorname} {k.name}</div>}
                <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', background: typ.color + '20', color: typ.color }}>{typ.label}</span>
              </div>
              <button onClick={() => del(t)} style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
            </div>
          );
        })
      )}

      {termine.filter(t => t.datum < heute).length > 0 && (
        <div>
          <div style={{ fontWeight: '700', color: '#94a3b8', fontSize: '0.8rem', margin: '20px 0 12px' }}>VERGANGENE TERMINE</div>
          {termine.filter(t => t.datum < heute).slice(0, 5).map(t => {
            const typ = TYPEN.find(tp => tp.id === t.typ) || TYPEN[0];
            return (
              <div key={t.id} style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px', marginBottom: '8px', opacity: 0.7, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>{t.titel}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.datum} {t.uhrzeit ? `· ${t.uhrzeit}` : ''}</div>
                </div>
                <button onClick={() => del(t)} style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

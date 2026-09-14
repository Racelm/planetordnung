import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fsAll, fsAdd, fsDel, fsUpd } from '../firebase/db';

const PRIORITAETEN = [
  { id: 'hoch', label: '🔴 Hoch', color: '#dc2626' },
  { id: 'mittel', label: '🟡 Mittel', color: '#d97706' },
  { id: 'niedrig', label: '🟢 Niedrig', color: '#059669' },
];

export default function Aufgaben() {
  const { user } = useAuth();
  const [aufgaben, setAufgaben] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('offen');

  const load = async () => {
    const data = await fsAll(user.uid, 'aufgaben');
    setAufgaben(data.sort((a, b) => {
      const prio = { hoch: 0, mittel: 1, niedrig: 2 };
      return (prio[a.prioritaet] || 1) - (prio[b.prioritaet] || 1);
    }));
  };

  useEffect(() => { if (user) load(); }, [user]);

  const save = async () => {
    if (!form.titel) return alert('Titel ist Pflichtfeld');
    setSaving(true);
    await fsAdd(user.uid, 'aufgaben', { ...form, erledigt: false });
    await load();
    setForm(null);
    setSaving(false);
  };

  const toggle = async (a) => {
    await fsUpd(user.uid, 'aufgaben', a.id, { erledigt: !a.erledigt });
    await load();
  };

  const del = async (a) => {
    if (!confirm('Aufgabe löschen?')) return;
    await fsDel(user.uid, 'aufgaben', a.id);
    await load();
  };

  const filtered = aufgaben.filter(a => filter === 'alle' ? true : filter === 'offen' ? !a.erledigt : a.erledigt);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>✅ Aufgaben</h2>
        <button onClick={() => setForm({ prioritaet: 'mittel' })} style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>+ Neu</button>
      </div>

      {form !== null && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Titel *</label>
            <input value={form.titel || ''} onChange={e => setForm(f => ({ ...f, titel: e.target.value }))}
              placeholder="Aufgabe beschreiben..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Priorität</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {PRIORITAETEN.map(p => (
                <button key={p.id} onClick={() => setForm(f => ({ ...f, prioritaet: p.id }))} style={{
                  flex: 1, padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                  background: form.prioritaet === p.id ? p.color : '#f1f5f9',
                  color: form.prioritaet === p.id ? '#fff' : '#64748b'
                }}>{p.label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Fällig am</label>
            <input type="date" value={form.faellig || ''} onChange={e => setForm(f => ({ ...f, faellig: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Notiz</label>
            <textarea value={form.notiz || ''} onChange={e => setForm(f => ({ ...f, notiz: e.target.value }))}
              rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setForm(null)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Abbrechen</button>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['offen', 'erledigt', 'alle'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
            background: filter === f ? '#1e3a5f' : '#f1f5f9', color: filter === f ? '#fff' : '#64748b'
          }}>{f.charAt(0).toUpperCase() + f.slice(1)} {f === 'offen' ? `(${aufgaben.filter(a => !a.erledigt).length})` : ''}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Keine Aufgaben</div>
      ) : (
        filtered.map(a => {
          const prio = PRIORITAETEN.find(p => p.id === a.prioritaet) || PRIORITAETEN[1];
          const ueberfaellig = a.faellig && a.faellig < new Date().toISOString().split('T')[0] && !a.erledigt;
          return (
            <div key={a.id} style={{
              background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${prio.color}`,
              opacity: a.erledigt ? 0.6 : 1,
              display: 'flex', alignItems: 'flex-start', gap: '12px'
            }}>
              <input type="checkbox" checked={a.erledigt} onChange={() => toggle(a)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop: '2px', accentColor: '#2563eb' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: '#1e293b', textDecoration: a.erledigt ? 'line-through' : 'none' }}>{a.titel}</div>
                {a.faellig && <div style={{ fontSize: '0.75rem', color: ueberfaellig ? '#dc2626' : '#64748b', fontWeight: ueberfaellig ? '700' : '400' }}>
                  {ueberfaellig ? '⚠️ Überfällig: ' : '📅 Fällig: '}{a.faellig}
                </div>}
                {a.notiz && <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>{a.notiz}</div>}
                <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', background: prio.color + '20', color: prio.color }}>
                  {prio.label}
                </span>
              </div>
              <button onClick={() => del(a)} style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
            </div>
          );
        })
      )}
    </div>
  );
}

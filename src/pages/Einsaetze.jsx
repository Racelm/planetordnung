import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fsAll, fsAdd, fsUpd, fsDel } from '../firebase/db';

const AKTIVITAETEN = ['Einkaufen','Kochen','Putzen','Waschen','Arztbegleitung','Spaziergang','Gesellschaft','Behördengang'];
const LEISTUNGEN = ['Alltagsbegleitung','Coaching 1h','Coaching 4h'];

export default function Einsaetze() {
  const { user } = useAuth();
  const [einsaetze, setEinsaetze] = useState([]);
  const [kunden, setKunden] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('alle');
  const canvasRef = useRef(null);
  const [signed, setSigned] = useState(false);

  const load = async () => {
    const [e, k] = await Promise.all([fsAll(user.uid, 'einsaetze'), fsAll(user.uid, 'kunden')]);
    setEinsaetze(e.sort((a, b) => (b.datum || '').localeCompare(a.datum || '')));
    setKunden(k);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const openNeu = () => {
    const heute = new Date().toISOString().split('T')[0];
    setForm({ datum: heute, leistungsart: 'Alltagsbegleitung', aktivitaeten: [], km: 0, stunden: 0 });
    setSigned(false);
  };

  const toggleAktivitaet = (a) => {
    setForm(f => ({
      ...f,
      aktivitaeten: f.aktivitaeten?.includes(a) ? f.aktivitaeten.filter(x => x !== a) : [...(f.aktivitaeten || []), a]
    }));
  };

  const berechneStunden = () => {
    if (!form?.anfang || !form?.ende) return 0;
    const [ah, am] = form.anfang.split(':').map(Number);
    const [eh, em] = form.ende.split(':').map(Number);
    const diff = (eh * 60 + em) - (ah * 60 + am);
    return diff > 0 ? parseFloat((diff / 60).toFixed(2)) : 0;
  };

  const save = async () => {
    if (!form.kundeId) return alert('Bitte Kunden wählen');
    if (!form.datum) return alert('Datum ist Pflichtfeld');
    if (form.anfang && form.ende && berechneStunden() <= 0) return alert('Endzeit muss nach Anfangszeit liegen');
    setSaving(true);
    const stunden = berechneStunden();
    await fsAdd(user.uid, 'einsaetze', { ...form, stunden, abgerechnet: 'nein' });
    await load();
    setForm(null);
    setSaving(false);
  };

  const del = async (e) => {
    if (!confirm('Einsatz wirklich löschen?')) return;
    await fsDel(user.uid, 'einsaetze', e.id);
    await load();
  };

  // Unterschrift Canvas
  useEffect(() => {
    if (!form || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const src = e.touches?.[0] || e;
      return { x: src.clientX - r.left, y: src.clientY - r.top };
    };
    const start = (e) => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = (e) => { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setSigned(true); };
    const end = () => { drawing = false; };
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: true });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', end);
    };
  }, [form]);

  const filtered = einsaetze.filter(e => filter === 'alle' ? true : filter === 'offen' ? e.abgerechnet !== 'ja' : e.abgerechnet === 'ja');

  if (form !== null) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setForm(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Neuer Einsatz</h2>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '12px' }}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Kunde *</label>
          <select value={form.kundeId || ''} onChange={e => setForm(f => ({ ...f, kundeId: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem' }}>
            <option value="">-- Kunde wählen --</option>
            {kunden.map(k => <option key={k.id} value={k.id}>{k.vorname} {k.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Datum *</label>
          <input type="date" value={form.datum || ''} onChange={e => setForm(f => ({ ...f, datum: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Anfang</label>
            <input type="time" value={form.anfang || ''} onChange={e => setForm(f => ({ ...f, anfang: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Ende</label>
            <input type="time" value={form.ende || ''} onChange={e => setForm(f => ({ ...f, ende: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: form.anfang && form.ende && berechneStunden() <= 0 ? '2px solid #dc2626' : '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
          </div>
        </div>
        {form.anfang && form.ende && berechneStunden() > 0 && (
          <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', color: '#059669', fontSize: '0.85rem', fontWeight: '700' }}>
            ⏱ {berechneStunden()} Stunden
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Leistungsart</label>
          <select value={form.leistungsart || ''} onChange={e => setForm(f => ({ ...f, leistungsart: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem' }}>
            {LEISTUNGEN.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Aktivitäten</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {AKTIVITAETEN.map(a => (
              <button key={a} onClick={() => toggleAktivitaet(a)} style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                background: form.aktivitaeten?.includes(a) ? '#2563eb' : '#f1f5f9',
                color: form.aktivitaeten?.includes(a) ? '#fff' : '#64748b'
              }}>{a}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Kilometer</label>
          <input type="number" min="0" value={form.km || 0} onChange={e => setForm(f => ({ ...f, km: parseFloat(e.target.value) || 0 }))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
          {(form.km || 0) > 0 && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Fahrtkosten: {form.km <= 10 ? '5,00 EUR (Pauschale)' : `${(form.km * 0.5).toFixed(2)} EUR`}
          </div>}
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Notizen</label>
          <textarea value={form.notizen || ''} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))}
            rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Unterschrift</label>
          <canvas ref={canvasRef} width={300} height={120}
            style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', width: '100%', touchAction: 'none', background: '#fafafa' }} />
          <button onClick={() => { const ctx = canvasRef.current?.getContext('2d'); ctx?.clearRect(0, 0, 300, 120); setSigned(false); }}
            style={{ marginTop: '4px', fontSize: '0.75rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
            Löschen
          </button>
        </div>
      </div>

      <button onClick={save} disabled={saving} style={{
        width: '100%', padding: '14px', background: saving ? '#94a3b8' : '#7c3aed',
        color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer'
      }}>
        {saving ? 'Wird gespeichert...' : '📋 Einsatz speichern'}
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>📋 Einsätze</h2>
        <button onClick={openNeu} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>+ Neu</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['alle', 'offen', 'abgerechnet'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
            background: filter === f ? '#7c3aed' : '#f1f5f9', color: filter === f ? '#fff' : '#64748b'
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Wird geladen...</div> :
        filtered.map(e => {
          const k = kunden.find(k => k.id === e.kundeId);
          return (
            <div key={e.id} style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>{e.datum}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{k ? `${k.vorname} ${k.name}` : '-'}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{e.leistungsart} · {e.stunden}h {e.km > 0 ? `· ${e.km}km` : ''}</div>
                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', background: e.abgerechnet === 'ja' ? '#dcfce7' : '#fef3c7', color: e.abgerechnet === 'ja' ? '#059669' : '#d97706' }}>
                  {e.abgerechnet === 'ja' ? '✓ Abgerechnet' : '⏳ Offen'}
                </span>
              </div>
              <button onClick={() => del(e)} style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
            </div>
          );
        })
      }
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fsAll, fsAdd, fsUpd, fsDel, fsWhere } from '../firebase/db';

const LEISTUNGEN = [
  { label: 'Alltagsbegleitung', value: 'Alltagsbegleitung', preis: 28.61, einheit: 'h' },
  { label: 'Coaching 1h', value: 'Coaching 1h', preis: 67.23, einheit: 'h' },
  { label: 'Coaching 4h', value: 'Coaching 4h', preis: 42.02, einheit: 'h' },
];

export default function Rechnungen() {
  const { user } = useAuth();
  const [rechnungen, setRechnungen] = useState([]);
  const [kunden, setKunden] = useState([]);
  const [einsaetze, setEinsaetze] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedEinsaetze, setSelectedEinsaetze] = useState([]);
  const [filter, setFilter] = useState('alle');

  const load = async () => {
    const [r, k, e] = await Promise.all([
      fsAll(user.uid, 'rechnungen'),
      fsAll(user.uid, 'kunden'),
      fsAll(user.uid, 'einsaetze'),
    ]);
    setRechnungen(r.sort((a, b) => (b.datum || '').localeCompare(a.datum || '')));
    setKunden(k);
    setEinsaetze(e);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const openNeu = () => {
    const heute = new Date().toISOString().split('T')[0];
    setForm({ datum: heute, lieferdatum: heute, ansprechpartner: 'Karin Koch' });
    setSelectedEinsaetze([]);
  };

  const monatsEinsaetze = () => {
    if (!form?.kundeId || !form?.monat) return [];
    return einsaetze.filter(e => e.kundeId === form.kundeId && (e.datum || '').startsWith(form.monat) && e.abgerechnet !== 'ja');
  };

  const berechneNetto = () => {
    let n = 0;
    selectedEinsaetze.forEach(e => {
      if (e.leistungsart === 'Alltagsbegleitung') n += (e.stunden || 0) * 28.61;
      else if (e.leistungsart === 'Coaching 1h') n += (e.stunden || 0) * 67.23;
      else if (e.leistungsart === 'Coaching 4h') n += (e.stunden || 0) * 42.02;
      if ((e.km || 0) > 0 && (e.km || 0) <= 10) n += 5;
      else if ((e.km || 0) > 10) n += (e.km || 0) * 0.5;
    });
    return n;
  };

  const save = async () => {
    if (!form.kundeId) return alert('Bitte Kunden wählen');
    if (!form.rechnungsnummer?.trim()) return alert('Rechnungsnummer ist Pflichtfeld');
    if (selectedEinsaetze.length === 0) return alert('Bitte mindestens einen Einsatz auswählen');
    setSaving(true);
    const n = berechneNetto();
    const data = {
      ...form,
      selectedEinsaetze,
      netto: parseFloat(n.toFixed(2)),
      mwst: parseFloat((n * 0.19).toFixed(2)),
      brutto: parseFloat((n * 1.19).toFixed(2)),
      bezahlt: false,
    };
    await fsAdd(user.uid, 'rechnungen', data);
    for (const e of selectedEinsaetze) {
      await fsUpd(user.uid, 'einsaetze', e.id, { abgerechnet: 'ja' });
    }
    await load();
    setForm(null);
    setSaving(false);
  };

  const toggleBezahlt = async (r) => {
    await fsUpd(user.uid, 'rechnungen', r.id, { bezahlt: !r.bezahlt });
    await load();
  };

  const del = async (r) => {
    if (!confirm('Rechnung wirklich löschen?')) return;
    await fsDel(user.uid, 'rechnungen', r.id);
    await load();
  };

  const filtered = rechnungen.filter(r =>
    filter === 'alle' ? true : filter === 'offen' ? !r.bezahlt : r.bezahlt
  );

  if (form !== null) {
    const monE = monatsEinsaetze();
    const netto = berechneNetto();

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setForm(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>←</button>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Neue Rechnung</h2>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '12px' }}>
          <div style={{ fontWeight: '700', color: '#2563eb', marginBottom: '16px', fontSize: '0.85rem' }}>RECHNUNGSDATEN</div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Rechnungsnummer *</label>
            <input value={form.rechnungsnummer || ''} onChange={e => setForm(f => ({ ...f, rechnungsnummer: e.target.value }))}
              placeholder="z.B. PO-2026-0001"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '2px solid #2563eb', fontSize: '0.9rem', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Kunde *</label>
            <select value={form.kundeId || ''} onChange={e => setForm(f => ({ ...f, kundeId: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem' }}>
              <option value="">-- Kunde wählen --</option>
              {kunden.map(k => <option key={k.id} value={k.id}>{k.vorname} {k.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Rechnungsdatum</label>
              <input type="date" value={form.datum || ''} onChange={e => setForm(f => ({ ...f, datum: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Monat</label>
              <input type="month" value={form.monat || ''} onChange={e => { setForm(f => ({ ...f, monat: e.target.value })); setSelectedEinsaetze([]); }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {form.kundeId && form.monat && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '12px' }}>
            <div style={{ fontWeight: '700', color: '#2563eb', marginBottom: '12px', fontSize: '0.85rem' }}>
              EINSÄTZE AUSWÄHLEN ({monE.length} verfügbar)
            </div>
            {monE.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Keine Einsätze für diesen Monat</p>
            ) : (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                  <input type="checkbox"
                    checked={selectedEinsaetze.length === monE.length}
                    onChange={e => setSelectedEinsaetze(e.target.checked ? monE : [])} />
                  Alle auswählen
                </label>
                {monE.map(e => (
                  <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                    <input type="checkbox"
                      checked={selectedEinsaetze.some(s => s.id === e.id)}
                      onChange={ev => setSelectedEinsaetze(prev =>
                        ev.target.checked ? [...prev, e] : prev.filter(s => s.id !== e.id)
                      )} />
                    <span style={{ flex: 1, fontSize: '0.85rem' }}>
                      <strong>{e.datum}</strong> · {e.leistungsart} · {e.stunden}h
                      {e.km > 0 && ` · ${e.km}km`}
                    </span>
                  </label>
                ))}
              </>
            )}
          </div>
        )}

        {selectedEinsaetze.length > 0 && (
          <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '16px', marginBottom: '12px', border: '1.5px solid #86efac' }}>
            <div style={{ fontWeight: '700', color: '#059669', marginBottom: '8px' }}>BETRAG</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span>Netto:</span><span>{netto.toFixed(2)} EUR</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span>MwSt. 19%:</span><span>{(netto * 0.19).toFixed(2)} EUR</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1rem', color: '#059669', borderTop: '1.5px solid #86efac', paddingTop: '8px', marginTop: '4px' }}>
              <span>Brutto:</span><span>{(netto * 1.19).toFixed(2)} EUR</span>
            </div>
          </div>
        )}

        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: '14px', background: saving ? '#94a3b8' : '#059669',
          color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer'
        }}>
          {saving ? 'Wird gespeichert...' : '🧾 Rechnung speichern'}
        </button>
      </div>
    );
  }

  const gesamt = filtered.reduce((s, r) => s + (r.brutto || 0), 0);
  const bezahlt = filtered.filter(r => r.bezahlt).reduce((s, r) => s + (r.brutto || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>🧾 Rechnungen</h2>
        <button onClick={openNeu} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>+ Neu</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['alle', 'offen', 'bezahlt'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
            background: filter === f ? '#059669' : '#f1f5f9', color: filter === f ? '#fff' : '#64748b'
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', borderRadius: '14px', padding: '16px', marginBottom: '16px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Gesamt</div><div style={{ fontSize: '1.3rem', fontWeight: '800' }}>{gesamt.toFixed(2)} EUR</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Bezahlt</div><div style={{ fontSize: '1.3rem', fontWeight: '800' }}>{bezahlt.toFixed(2)} EUR</div></div>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Wird geladen...</div> :
        filtered.map(r => {
          const k = kunden.find(k => k.id === r.kundeId);
          return (
            <div key={r.id} style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>{r.rechnungsnummer || '-'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{k ? `${k.vorname} ${k.name}` : '-'} · {r.datum}</div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>{(r.brutto || 0).toFixed(2)} EUR</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', background: r.bezahlt ? '#dcfce7' : '#fef3c7', color: r.bezahlt ? '#059669' : '#d97706' }}>
                    {r.bezahlt ? '✓ Bezahlt' : '⏳ Offen'}
                  </span>
                  <button onClick={() => toggleBezahlt(r)} style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}>
                    {r.bezahlt ? 'Als offen' : 'Als bezahlt'}
                  </button>
                  <button onClick={() => del(r)} style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>🗑️</button>
                </div>
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

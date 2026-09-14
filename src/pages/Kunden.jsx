import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fsAll, fsAdd, fsUpd, fsDel } from '../firebase/db';

const STATUS_COLOR = { aktiv: '#059669', archiviert: '#64748b', verstorben: '#dc2626' };

export default function Kunden() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kunden, setKunden] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null=Liste, {}=Neu/Bearbeiten
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await fsAll(user.uid, 'kunden');
    setKunden(data.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const filtered = kunden.filter(k =>
    `${k.name} ${k.vorname} ${k.kundennummer}`.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    if (!form.name || !form.vorname) return alert('Name und Vorname sind Pflichtfelder');
    setSaving(true);
    if (form.id) await fsUpd(user.uid, 'kunden', form.id, form);
    else await fsAdd(user.uid, 'kunden', form);
    await load();
    setForm(null);
    setSaving(false);
  };

  const del = async (k) => {
    if (!confirm(`${k.vorname} ${k.name} wirklich löschen?`)) return;
    await fsDel(user.uid, 'kunden', k.id);
    await load();
  };

  const F = ({ label, field, type = 'text', required }) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={form?.[field] || ''}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: '10px',
          border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box',
          outline: 'none'
        }}
      />
    </div>
  );

  if (form !== null) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setForm(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>
          {form.id ? 'Kunde bearbeiten' : 'Neuer Kunde'}
        </h2>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: '700', color: '#2563eb', marginBottom: '16px', fontSize: '0.85rem' }}>STAMMDATEN</div>
        <F label="Kundennummer" field="kundennummer" />
        <F label="Nachname" field="name" required />
        <F label="Vorname" field="vorname" required />
        <F label="Geburtsdatum" field="geburtsdatum" type="date" />
        <F label="Adresse" field="adresse" />
        <F label="Festnetz" field="festnetz" type="tel" />
        <F label="Handy" field="handy" type="tel" />
        <F label="E-Mail" field="email" type="email" />

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Status</label>
          <select value={form?.status || 'aktiv'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem' }}>
            <option value="aktiv">Aktiv</option>
            <option value="archiviert">Archiviert</option>
            <option value="verstorben">Verstorben</option>
          </select>
        </div>
        {form?.status === 'verstorben' && <F label="Sterbedatum" field="sterbedatum" type="date" />}

        <div style={{ fontWeight: '700', color: '#2563eb', margin: '20px 0 16px', fontSize: '0.85rem' }}>VERSICHERUNG</div>
        <F label="PKV 70% Name" field="pkv70_name" />
        <F label="PKV 70% Nr." field="pkv70" />
        <F label="PKV 30% Name" field="pkv30_name" />
        <F label="PKV 30% Nr." field="pkv30" />
        <F label="GKV Name" field="gkv_name" />
        <F label="GKV Nr." field="gkv" />

        <div style={{ fontWeight: '700', color: '#2563eb', margin: '20px 0 16px', fontSize: '0.85rem' }}>MEDIZINISCH</div>
        <F label="Arzt" field="arzt" />
        <F label="Praxis" field="praxis" />
        <F label="Apotheke" field="apotheke" />

        <div style={{ fontWeight: '700', color: '#2563eb', margin: '20px 0 16px', fontSize: '0.85rem' }}>KONTAKTPERSON</div>
        <F label="Name" field="kp_name" />
        <F label="Kontakt" field="kp_kontakt" />
        <F label="Beziehung" field="kp_beziehung" />

        <div style={{ fontWeight: '700', color: '#2563eb', margin: '20px 0 16px', fontSize: '0.85rem' }}>VOLLMACHTEN</div>
        {['bankvollmacht', 'vorsorgevollmacht', 'patientenverfuegung'].map(f => (
          <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form?.[f] || false} onChange={e => setForm(p => ({ ...p, [f]: e.target.checked }))} />
            <span style={{ fontSize: '0.9rem' }}>{f === 'bankvollmacht' ? 'Bankvollmacht' : f === 'vorsorgevollmacht' ? 'Vorsorgevollmacht' : 'Patientenverfügung'}</span>
          </label>
        ))}

        <div style={{ fontWeight: '700', color: '#2563eb', margin: '20px 0 16px', fontSize: '0.85rem' }}>NOTIZEN</div>
        <textarea value={form?.notizen || ''} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))}
          rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }} />

        <button onClick={save} disabled={saving} style={{
          width: '100%', marginTop: '20px', padding: '14px',
          background: saving ? '#94a3b8' : '#2563eb', color: '#fff',
          border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer'
        }}>
          {saving ? 'Wird gespeichert...' : '💾 Speichern'}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>👥 Kunden</h2>
        <button onClick={() => setForm({})} style={{
          background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px',
          padding: '10px 16px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem'
        }}>+ Neu</button>
      </div>

      <input
        type="search" placeholder="🔍 Suchen..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', marginBottom: '16px', boxSizing: 'border-box' }}
      />

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Wird geladen...</div> :
        filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Keine Kunden gefunden</div> :
          filtered.map(k => (
            <div key={k.id} style={{
              background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div onClick={() => navigate(`/kunden/${k.id}`)} style={{ flex: 1, cursor: 'pointer' }}>
                <div style={{ fontWeight: '700', color: '#1e293b' }}>{k.vorname} {k.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{k.kundennummer || 'Keine Nr.'} · {k.handy || k.festnetz || 'Kein Tel.'}</div>
                <span style={{
                  display: 'inline-block', marginTop: '4px', padding: '2px 8px',
                  borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700',
                  background: STATUS_COLOR[k.status || 'aktiv'] + '20',
                  color: STATUS_COLOR[k.status || 'aktiv']
                }}>{k.status || 'aktiv'}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setForm(k)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontSize: '1rem' }}>✏️</button>
                <button onClick={() => del(k)} style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
              </div>
            </div>
          ))
      }
    </div>
  );
}

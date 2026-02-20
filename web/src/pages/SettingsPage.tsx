import React, { useEffect, useState } from 'react';
import type { Workplace } from '../types/api.types';
import { getWorkplace, updateWorkplace } from '../services/workplaceService';
import QRCodeDisplay from '../components/QRCodeDisplay';

export default function SettingsPage(): JSX.Element {
  const [workplace, setWorkplace] = useState<Workplace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('');

  useEffect(() => {
    getWorkplace()
      .then(wp => {
        setWorkplace(wp);
        setName(wp.name);
        setLat(String(wp.location.coordinates[1]));
        setLng(String(wp.location.coordinates[0]));
        setRadius(String(wp.geofenceRadiusMetres));
      })
      .catch(() => setError('Failed to load workplace settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await updateWorkplace({
        name: name.trim() || undefined,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        geofenceRadiusMetres: parseInt(radius, 10),
      });
      setWorkplace(updated);
      setSuccess('Settings saved successfully.');
    } catch {
      setError('Failed to save settings. Please check the values and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.4rem', fontWeight: 700 }}>Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '1.5rem', alignItems: 'start', flexWrap: 'wrap' }}>
        {/* Workplace form */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Workplace Configuration</h3>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.5rem 0.75rem', borderRadius: '4px', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.5rem 0.75rem', borderRadius: '4px', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              {success}
            </div>
          )}

          {loading ? (
            <div style={{ color: '#9ca3af' }}>Loading…</div>
          ) : (
            <form onSubmit={(e) => void handleSave(e)}>
              <Field label="Workplace Name">
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Company HQ" style={inputStyle} />
              </Field>
              <Field label="Latitude" hint="GPS latitude of the workplace (e.g. 6.9271)">
                <input value={lat} onChange={e => setLat(e.target.value)} required type="number" step="any"
                  placeholder="6.9271" style={inputStyle} />
              </Field>
              <Field label="Longitude" hint="GPS longitude of the workplace (e.g. 79.8612)">
                <input value={lng} onChange={e => setLng(e.target.value)} required type="number" step="any"
                  placeholder="79.8612" style={inputStyle} />
              </Field>
              <Field label="Geofence Radius (metres)" hint="Employees must be within this distance to check in">
                <input value={radius} onChange={e => setRadius(e.target.value)} required type="number" min="10" max="5000"
                  placeholder="100" style={inputStyle} />
              </Field>

              <button
                type="submit"
                disabled={saving}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </form>
          )}
        </div>

        {/* QR Code panel */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem', minWidth: '260px' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Workplace QR Code</h3>
          <QRCodeDisplay />
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.45rem 0.65rem',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{label}</label>
      {hint && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.2rem' }}>{hint}</div>}
      {children}
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import type { AttendanceRecord } from '../types/api.types';
import { queryHistory } from '../services/attendanceService';
import AttendanceTable from '../components/AttendanceTable';
import ManualCloseModal from '../components/ManualCloseModal';

export default function AttendancePage(): JSX.Element {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState<AttendanceRecord | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const data = await queryHistory({ from, to });
      setRecords(data);
    } catch {
      setError('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <h1 style={{ margin: '0 0 1.25rem', fontSize: '1.4rem', fontWeight: 700 }}>Attendance Records</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.2rem', color: '#6b7280' }}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.9rem' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.2rem', color: '#6b7280' }}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.9rem' }} />
        </div>
        <button
          onClick={() => void load()}
          style={{ padding: '0.45rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          Filter
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', color: '#9ca3af', textAlign: 'center' }}>Loading…</div>
        ) : (
          <AttendanceTable
            records={records}
            onManualClose={rec => setClosing(rec)}
          />
        )}
      </div>

      {closing && (
        <ManualCloseModal
          record={closing}
          onClose={() => setClosing(null)}
          onSuccess={() => { setClosing(null); void load(); }}
        />
      )}
    </div>
  );
}

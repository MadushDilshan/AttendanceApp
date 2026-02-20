import React, { useEffect, useState, useCallback } from 'react';
import type { AttendanceOverviewItem } from '../types/api.types';
import { getTodayOverview } from '../services/attendanceService';
import EmployeeStatusCard from '../components/EmployeeStatusCard';

const REFRESH_INTERVAL_MS = 30_000;

export default function DashboardPage(): JSX.Element {
  const [items, setItems] = useState<AttendanceOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const data = await getTodayOverview();
      setItems(data);
      setLastUpdated(new Date());
      setError('');
    } catch {
      setError("Failed to load today's overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  const counts = {
    checked_in: items.filter(i => i.displayStatus === 'checked_in').length,
    checked_out: items.filter(i => i.displayStatus === 'checked_out').length,
    absent: items.filter(i => i.displayStatus === 'absent').length,
    incomplete: items.filter(i => i.displayStatus === 'incomplete').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Today's Dashboard</h1>
        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}
          <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>(auto-refreshes every 30s)</span>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {([
          { label: 'Present', count: counts.checked_in, bg: '#dcfce7', color: '#15803d' },
          { label: 'Left', count: counts.checked_out, bg: '#dbeafe', color: '#1d4ed8' },
          { label: 'Absent', count: counts.absent, bg: '#f3f4f6', color: '#6b7280' },
          { label: 'Incomplete', count: counts.incomplete, bg: '#fef9c3', color: '#92400e' },
        ] as const).map(chip => (
          <div key={chip.label} style={{ background: chip.bg, color: chip.color, padding: '0.4rem 0.9rem', borderRadius: '999px', fontWeight: 600, fontSize: '0.85rem' }}>
            {chip.count} {chip.label}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div style={{ color: '#9ca3af' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {items.map(item => (
            <EmployeeStatusCard key={item.employee._id} item={item} />
          ))}
          {items.length === 0 && (
            <div style={{ color: '#6b7280' }}>No employees found. Add employees in the Employees section.</div>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import type { AttendanceOverviewItem, DisplayStatus } from '../types/api.types';

const STATUS_STYLES: Record<DisplayStatus, { bg: string; color: string; label: string }> = {
  checked_in:  { bg: '#dcfce7', color: '#15803d', label: 'Checked In' },
  checked_out: { bg: '#dbeafe', color: '#1d4ed8', label: 'Checked Out' },
  absent:      { bg: '#f3f4f6', color: '#6b7280', label: 'Absent' },
  incomplete:  { bg: '#fef9c3', color: '#92400e', label: 'Incomplete' },
};

interface Props {
  item: AttendanceOverviewItem;
}

export default function EmployeeStatusCard({ item }: Props): JSX.Element {
  const s = STATUS_STYLES[item.displayStatus];
  const checkIn = item.record?.checkInAt ? new Date(item.record.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const checkOut = item.record?.checkOutAt ? new Date(item.record.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', minWidth: '180px' }}>
      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>{item.employee.name}</div>
      <span style={{ background: s.bg, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
        {s.label}
      </span>
      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#6b7280' }}>
        <div>In: <strong>{checkIn}</strong></div>
        <div>Out: <strong>{checkOut}</strong></div>
      </div>
    </div>
  );
}

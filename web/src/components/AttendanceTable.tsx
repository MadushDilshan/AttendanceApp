import React from 'react';
import type { AttendanceRecord } from '../types/api.types';

interface Props {
  records: AttendanceRecord[];
  onManualClose?: (record: AttendanceRecord) => void;
}

function fmt(iso: string | undefined): string {
  if (!iso) return '—';
  // Parse as UTC and convert to local time
  const date = new Date(iso);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function fmtHours(mins: number | undefined): string {
  if (mins == null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AttendanceTable({ records, onManualClose }: Props): JSX.Element {
  if (records.length === 0) {
    return <div style={{ color: '#6b7280', padding: '1rem' }}>No records found.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Employee', 'Date', 'Check In', 'Check Out', 'Regular', 'Overtime', 'Pay (Rs)', 'Status', ''].map(h => (
              <th key={h} style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '0.6rem 0.75rem' }}>{(r.employeeId as any)?.name ?? '—'}</td>
              <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>{r.date}</td>
              <td style={{ padding: '0.6rem 0.75rem' }}>{fmt(r.checkInAt)}</td>
              <td style={{ padding: '0.6rem 0.75rem' }}>{fmt(r.checkOutAt)}</td>
              <td style={{ padding: '0.6rem 0.75rem' }}>{fmtHours((r as any).regularHours != null ? (r as any).regularHours * 60 : undefined)}</td>
              <td style={{ padding: '0.6rem 0.75rem' }}>{fmtHours((r as any).overtimeHoursMorning != null || (r as any).overtimeHoursEvening != null ? (((r as any).overtimeHoursMorning ?? 0) + ((r as any).overtimeHoursEvening ?? 0)) * 60 : undefined)}</td>
              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>
                {calculatePay(r as any)}
              </td>
              <td style={{ padding: '0.6rem 0.75rem' }}>
                <StatusBadge status={r.status} />
              </td>
              <td style={{ padding: '0.6rem 0.75rem' }}>
                {r.status === 'incomplete' && onManualClose && (
                  <button
                    onClick={() => onManualClose(r)}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }): JSX.Element {
  const styles: Record<string, { bg: string; color: string }> = {
    open:       { bg: '#dcfce7', color: '#15803d' },
    closed:     { bg: '#dbeafe', color: '#1d4ed8' },
    incomplete: { bg: '#fef9c3', color: '#92400e' },
  };
  const s = styles[status] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

function calculatePay(record: any): string {
  const regularHours = record.regularHours ?? 0;
  const otMorning = record.overtimeHoursMorning ?? 0;
  const otEvening = record.overtimeHoursEvening ?? 0;

  if (regularHours === 0 && otMorning === 0 && otEvening === 0) {
    return '—';
  }

  // Pay rates: Rs 1,000/day for any regular hours, Rs 160/hr for overtime
  const regularPay = regularHours > 0 ? 1000 : 0;
  const overtimePay = Math.round((otMorning + otEvening) * 160);
  const total = regularPay + overtimePay;

  return total.toLocaleString();
}

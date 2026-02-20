import React from 'react';
import type { PaysheetEntry } from '../types/api.types';

interface Props {
  entries: PaysheetEntry[];
  currency?: string;
}

export default function PaysheetTable({ entries, currency = 'Rs' }: Props): JSX.Element {
  if (entries.length === 0) {
    return <div style={{ color: '#6b7280', padding: '1rem' }}>No entries.</div>;
  }

  const totalRegular = entries.reduce((s, e) => s + (e.regularPay ?? 0), 0);
  const totalOT = entries.reduce((s, e) => s + (e.overtimePay ?? 0), 0);
  const totalPayable = entries.reduce((s, e) => s + (e.totalPayable ?? 0), 0);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            {['Date', 'Check In', 'Check Out', 'Regular (min)', 'OT (min)', `Regular (${currency})`, `OT (${currency})`, `Total (${currency})`].map(h => (
              <th key={h} style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ padding: '0.55rem 0.75rem' }}>{entry.date ?? '—'}</td>
              <td style={{ padding: '0.55rem 0.75rem' }}>{fmtTime(entry.checkInAt)}</td>
              <td style={{ padding: '0.55rem 0.75rem' }}>{fmtTime(entry.checkOutAt)}</td>
              <td style={{ padding: '0.55rem 0.75rem' }}>{entry.regularMinutes ?? 0}</td>
              <td style={{ padding: '0.55rem 0.75rem' }}>{entry.overtimeMinutes ?? 0}</td>
              <td style={{ padding: '0.55rem 0.75rem' }}>{(entry.regularPay ?? 0).toLocaleString()}</td>
              <td style={{ padding: '0.55rem 0.75rem' }}>{(entry.overtimePay ?? 0).toLocaleString()}</td>
              <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>{(entry.totalPayable ?? 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f0f9ff' }}>
            <td colSpan={5} style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>Totals</td>
            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>{totalRegular.toLocaleString()}</td>
            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>{totalOT.toLocaleString()}</td>
            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#1d4ed8' }}>{totalPayable.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function fmtTime(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

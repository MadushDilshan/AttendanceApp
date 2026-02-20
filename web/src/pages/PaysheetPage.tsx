import React, { useState, useEffect } from 'react';
import type { Employee, Paysheet } from '../types/api.types';
import { listEmployees } from '../services/employeeService';
import { generate, markProcessed, exportPaysheet } from '../services/paySheetsService';
import PaysheetTable from '../components/PaysheetTable';

export default function PaysheetPage(): JSX.Element {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [periodStart, setPeriodStart] = useState(firstOfMonth);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [paysheet, setPaysheet] = useState<Paysheet | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    listEmployees().then(data => {
      setEmployees(data.filter(e => e.status === 'active'));
    }).catch(() => setError('Failed to load employees.'));
  }, []);

  const toggleEmployee = (id: string): void => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  const selectAll = (): void => setSelectedIds(employees.map(e => e._id));
  const clearAll = (): void => setSelectedIds([]);

  const handleGenerate = async (): Promise<void> => {
    if (selectedIds.length === 0) { setError('Select at least one employee.'); return; }
    setError('');
    setGenerating(true);
    try {
      const ps = await generate({ periodStart, periodEnd, employeeIds: selectedIds });
      setPaysheet(ps);
    } catch {
      setError('Failed to generate paysheet. Check dates and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkProcessed = async (): Promise<void> => {
    if (!paysheet) return;
    setProcessing(true);
    try {
      const updated = await markProcessed(paysheet._id);
      setPaysheet(updated);
    } catch {
      setError('Failed to mark as processed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv'): Promise<void> => {
    if (!paysheet) return;
    setExporting(true);
    try {
      await exportPaysheet(paysheet._id, format);
    } catch {
      setError(`Failed to export as ${format.toUpperCase()}.`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.4rem', fontWeight: 700 }}>Pay Sheets</h1>

      {/* Generator panel */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Generate New Pay Sheet</h3>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.2rem', color: '#6b7280' }}>Period Start</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.9rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.2rem', color: '#6b7280' }}>Period End</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.9rem' }} />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#6b7280' }}>Employees:</span>
            <button onClick={selectAll} style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>All</button>
            <button onClick={clearAll} style={{ fontSize: '0.75rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {employees.map(emp => (
              <label key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.875rem', cursor: 'pointer', background: selectedIds.includes(emp._id) ? '#eff6ff' : '#f9fafb', border: `1px solid ${selectedIds.includes(emp._id) ? '#93c5fd' : '#e5e7eb'}`, borderRadius: '4px', padding: '0.25rem 0.6rem' }}>
                <input type="checkbox" checked={selectedIds.includes(emp._id)} onChange={() => toggleEmployee(emp._id)} style={{ margin: 0 }} />
                {emp.name}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.5rem 0.75rem', borderRadius: '4px', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <button
          onClick={() => void handleGenerate()}
          disabled={generating}
          style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: generating ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: generating ? 0.7 : 1 }}
        >
          {generating ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {/* Result */}
      {paysheet && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                {paysheet.employee?.name ?? 'Pay Sheet'}
                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 400, color: '#6b7280' }}>
                  {paysheet.periodStart} – {paysheet.periodEnd}
                </span>
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>
                Status: <strong style={{ color: paysheet.status === 'processed' ? '#15803d' : '#92400e' }}>{paysheet.status}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => void handleExport('pdf')} disabled={exporting}
                style={{ padding: '0.35rem 0.8rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                Export PDF
              </button>
              <button onClick={() => void handleExport('csv')} disabled={exporting}
                style={{ padding: '0.35rem 0.8rem', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                Export CSV
              </button>
              {paysheet.status === 'draft' && (
                <button onClick={() => void handleMarkProcessed()} disabled={processing}
                  style={{ padding: '0.35rem 0.8rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: processing ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: processing ? 0.7 : 1 }}>
                  {processing ? 'Marking…' : 'Mark Processed'}
                </button>
              )}
            </div>
          </div>

          {/* Totals summary */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[
              { label: 'Regular Pay', value: `Rs ${paysheet.totals.totalRegularPay.toLocaleString()}` },
              { label: 'Overtime Pay', value: `Rs ${paysheet.totals.totalOvertimePay.toLocaleString()}` },
              { label: 'Total Payable', value: `Rs ${paysheet.totals.totalPayable.toLocaleString()}`, bold: true },
              { label: 'Skipped Days', value: String(paysheet.totals.skippedDays) },
            ].map(item => (
              <div key={item.label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem 1rem', minWidth: '130px' }}>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.15rem' }}>{item.label}</div>
                <div style={{ fontWeight: item.bold ? 700 : 600, fontSize: '1rem', color: item.bold ? '#1d4ed8' : '#111827' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <PaysheetTable entries={paysheet.entries} />
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import type { Employee } from '../types/api.types';
import { listEmployees, createEmployee, setEmployeeStatus } from '../services/employeeService';

interface NewEmployeeForm {
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'admin';
}

export default function EmployeesPage(): JSX.Element {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewEmployeeForm>({ name: '', email: '', password: '', role: 'employee' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async (): Promise<void> => {
    try {
      const data = await listEmployees();
      setEmployees(data);
    } catch {
      setError('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await createEmployee(form);
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
      void load();
    } catch {
      setFormError('Failed to create employee. Email may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (emp: Employee): Promise<void> => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Set ${emp.name} as ${newStatus}?`)) return;
    try {
      await setEmployeeStatus(emp._id, newStatus);
      void load();
    } catch {
      setError('Failed to update employee status.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Employees</h1>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ padding: '0.45rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
        >
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>New Employee</h3>
          {formError && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.5rem 0.75rem', borderRadius: '4px', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              {formError}
            </div>
          )}
          <form onSubmit={(e) => void handleCreate(e)} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {(['name', 'email', 'password'] as const).map(field => (
              <div key={field}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.2rem', textTransform: 'capitalize' }}>{field}</label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  required
                  placeholder={field === 'name' ? 'Full name' : field === 'email' ? 'email@example.com' : 'Min 8 characters'}
                  style={{ padding: '0.45rem 0.65rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem', minWidth: '180px' }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.2rem' }}>Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as 'employee' | 'admin' }))}
                style={{ padding: '0.45rem 0.65rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem' }}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '0.45rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', color: '#9ca3af', textAlign: 'center' }}>Loading…</div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '2rem', color: '#6b7280', textAlign: 'center' }}>No employees yet. Add one above.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Name', 'Email', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500 }}>{emp.name}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280' }}>{emp.email}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span style={{
                      background: emp.status === 'active' ? '#dcfce7' : '#f3f4f6',
                      color: emp.status === 'active' ? '#15803d' : '#6b7280',
                      padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                    }}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <button
                      onClick={() => void handleToggleStatus(emp)}
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

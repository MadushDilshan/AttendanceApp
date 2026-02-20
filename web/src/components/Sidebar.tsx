import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const NAV_ITEMS = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/attendance', label: '📋 Attendance' },
  { to: '/employees', label: '👥 Employees' },
  { to: '/paysheets', label: '💰 Pay Sheets' },
  { to: '/settings', label: '⚙️ Settings' },
];

export default function Sidebar(): JSX.Element {
  const { logout, employee } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    void navigate('/login');
  };

  return (
    <aside style={{ width: '220px', minHeight: '100vh', background: '#1e3a5f', color: '#fff', display: 'flex', flexDirection: 'column', padding: '1rem 0' }}>
      <div style={{ padding: '0 1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>AttendanceApp</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>{employee?.name ?? 'Admin'}</div>
      </div>

      <nav style={{ flex: 1, paddingTop: '1rem' }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.65rem 1rem',
              color: '#fff',
              textDecoration: 'none',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
              fontSize: '0.9rem',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => void handleLogout()}
          style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

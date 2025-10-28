import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Dashboard({ user, onLogout }) {
  const handleLogout = async () => {
    // Call the logout function which will handle socket disconnection and status update
    await onLogout();
  };

  return (
    <div className="app-shell">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1>💬 Chat App</h1>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 16px',
            background: 'var(--accent-light)',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <span style={{ color: '#00b894', fontSize: '12px' }}>●</span>
            <span style={{ color: 'var(--primary-dark)' }}>{user?.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/users" style={{background: 'var(--accent-light)', color: 'inherit', textDecoration: 'none', fontWeight: '600', padding: '14px 16px', borderRadius: '8px' }}>
            👥 Users
          </Link>
          <Link to="/groups" style={{ background: 'var(--accent-light)', color: 'inherit', textDecoration: 'none', fontWeight: '600', padding: '14px 16px', borderRadius: '8px' }}>
            🎯 Groups
          </Link>
          <Link to="/contacts" style={{background: 'var(--accent-light)',  color: 'inherit', textDecoration: 'none', fontWeight: '600', padding: '14px 16px', borderRadius: '8px' }}>
            📱 Contacts
          </Link>
          <Link to="/requests" style={{background: 'var(--accent-light)',  color: 'inherit', textDecoration: 'none', fontWeight: '600', padding: '14px 16px', borderRadius: '8px' }}>
            📩 Requests
          </Link>
          <button 
            onClick={handleLogout}
            style={{
              background: 'var(--accent-light)',
              color: 'inherit',
              border: 'none',
              padding: '14px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
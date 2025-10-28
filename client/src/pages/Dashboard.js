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
        <h1>💬 ChatApp</h1>
        <div>
          <span style={{ color: 'white', marginRight: '20px' }}>
            👋 Welcome, {user.name}!
          </span>
          <Link to="/users">🔍 Discover</Link>
          <Link to="/contacts">👥 Contacts</Link>
          <Link to="/groups">🎯 Groups</Link>
          <Link to="/requests">📩 Requests</Link>
          <button onClick={handleLogout}>🚪 Logout</button>
        </div>
      </header>
      
      <main>
        <Outlet />
      </main>
    </div>
  );
}
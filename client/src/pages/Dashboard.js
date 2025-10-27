import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Dashboard({ user, onLogout }) {
  return (
    <div className="app-shell">
      <header>
        <h1>Chat - {user?.name}</h1>
        <div>
          <Link to="/users">Users</Link> | <Link to="/groups">Groups</Link> | <button onClick={onLogout}>Logout</button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
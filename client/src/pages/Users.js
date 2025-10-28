import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, sendRequest, fetchRequests, fetchContacts } from '../features/contacts/contactsSlice';
import { Link } from 'react-router-dom';

export default function Users() {
  const dispatch = useDispatch();
  const { users, loading, error, requestsSent, contacts } = useSelector(s => s.contacts);
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchRequests());
    dispatch(fetchContacts());
  }, [dispatch]);

  const handleAdd = (id) => {
    dispatch(sendRequest(id));
  };

  const contactIds = new Set((contacts || []).map(c => (c._id ?? c).toString()));
  const sentIds = new Set((requestsSent || []).map(id => (id._id ? id._id.toString() : id.toString())));

  return (
    <div className="fade-in">
      <div className="card">
        <h2>🌟 Discover Users</h2>
        <p className="text-light">Connect with people and start conversations</p>
      </div>
      
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Finding amazing people...</div>}
      
      {users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
          <h3>🔍 No users found</h3>
          <p>Try adjusting your search or check back later</p>
        </div>
      ) : (
        <div className="user-list">
          {users.filter(u => u._id !== currentUser?.id).map(u => (
            <div key={u._id} className="user-item slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3>
                  {u.name} 
                  {u.isOnline ? (
                    <span style={{ color: '#00b894', fontSize: '14px', marginLeft: '8px', fontWeight: '500' }}>● Online</span>
                  ) : (
                    <span style={{ color: '#636e72', fontSize: '14px', marginLeft: '8px', fontWeight: '500' }}>● Offline</span>
                  )}
                </h3>
                {contactIds.has(u._id.toString()) ? (
                  <button disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>✓ Contact</button>
                ) : sentIds.has(u._id.toString()) ? (
                  <button disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>⏳ Requested</button>
                ) : (
                  <button onClick={() => handleAdd(u._id)}>+ Add Contact</button>
                )}
              </div>
              <p>Email: {u.email}</p>
              {u.phoneNumber && <p>Phone: {u.phoneNumber}</p>}
              {!u.isOnline && u.lastSeen && (
                <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  Last seen: {new Date(u.lastSeen).toLocaleString()}
                </p>
              )}
              <div style={{ marginTop: '12px' }}>
                {contactIds.has(u._id.toString()) && (
                  <Link to={`/chat/${u._id}`} style={{ 
                    display: 'inline-block', 
                    padding: '8px 16px', 
                    background: 'var(--accent-light)', 
                    borderRadius: '8px',
                    color: 'var(--primary-medium)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    💬 Start Chat
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="card text-center" style={{ marginTop: '30px' }}>
        <Link to="/requests" style={{ marginRight: '20px' }}>📩 Contact Requests</Link>
        <span style={{ color: 'var(--text-light)' }}>|</span>
        <Link to="/contacts" style={{ marginLeft: '20px' }}>👥 My Contacts</Link>
      </div>
    </div>
  );
}
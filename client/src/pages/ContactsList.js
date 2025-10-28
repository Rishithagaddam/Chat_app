import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContacts } from '../features/contacts/contactsSlice';
import { Link, useNavigate } from 'react-router-dom';

export default function ContactsList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { contacts } = useSelector(s => s.contacts);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  return (
    <div className="fade-in">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>👥 My Contacts ({contacts.length})</h2>
            <p className="text-light">Your trusted connections</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px',
              background: 'var(--accent-light)',
              color: 'var(--primary-medium)',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ← Back
          </button>
        </div>
      </div>
      
      {contacts.length === 0 ? (
        <div className="card text-center">
          <h3 style={{ color: 'var(--text-light)', marginBottom: '20px' }}>No contacts yet</h3>
          <p className="text-light">Start adding people to build your network!</p>
          <Link to="/users" style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '12px 24px',
            background: 'var(--gradient-primary)',
            color: 'var(--white)',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            🔍 Discover Users
          </Link>
        </div>
      ) : (
        <div className="contact-list">
          {contacts.map(c => (
            <div key={c._id} className="contact-item slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>
                  {c.name}
                  {c.isOnline ? (
                    <span style={{ color: '#00b894', fontSize: '12px', marginLeft: '8px' }}>● Online</span>
                  ) : (
                    <span style={{ color: '#636e72', fontSize: '12px', marginLeft: '8px' }}>● Offline</span>
                  )}
                </h3>
              </div>
              <p>Email: {c.email}</p>
              {!c.isOnline && c.lastSeen && (
                <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  Last seen: {new Date(c.lastSeen).toLocaleString()}
                </p>
              )}
              <div style={{ marginTop: '15px' }}>
                <Link to={`/chat/${c._id}`} style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: 'var(--gradient-primary)',
                  color: 'var(--white)',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(139, 74, 74, 0.3)'
                }}>
                  💬 Chat Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
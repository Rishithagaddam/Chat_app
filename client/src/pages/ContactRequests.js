import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRequests, acceptRequest, rejectRequest, fetchContacts } from '../features/contacts/contactsSlice';

export default function ContactRequests() {
  const dispatch = useDispatch();
  const { requestsReceived, requestsSent, error } = useSelector(s => s.contacts);

  useEffect(() => {
    dispatch(fetchRequests());
  }, [dispatch]);

  const handleAccept = async (fromId) => {
    await dispatch(acceptRequest(fromId));
    // refresh contacts and requests
    dispatch(fetchContacts());
    dispatch(fetchRequests());
  };

  const handleReject = async (fromId) => {
    await dispatch(rejectRequest(fromId));
    dispatch(fetchRequests());
  };

  return (
    <div className="fade-in">
      <div className="card">
        <h2>📩 Contact Requests</h2>
        <p className="text-light">Manage your incoming and outgoing connection requests</p>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <div className="card">
        <h3 style={{ color: 'var(--primary-dark)', marginBottom: '20px' }}>📨 Incoming Requests</h3>
        {requestsReceived.length === 0 ? (
          <p className="text-light" style={{ textAlign: 'center', padding: '20px' }}>No incoming requests</p>
        ) : (
          <div className="contact-list">
            {requestsReceived.map(u => (
              <div key={u._id || u} className="contact-item" style={{ 
                border: '2px solid var(--primary-light)', 
                background: 'linear-gradient(135deg, var(--white), var(--accent-light))' 
              }}>
                <h3>{u.name || u.email || u}</h3>
                <p>Wants to connect with you</p>
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleAccept(u._id || u)}
                    style={{
                      background: '#00b894',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    ✅ Accept
                  </button>
                  <button 
                    onClick={() => handleReject(u._id || u)}
                    style={{
                      background: '#d63031',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--primary-dark)', marginBottom: '20px' }}>📤 Sent Requests</h3>
        {requestsSent.length === 0 ? (
          <p className="text-light" style={{ textAlign: 'center', padding: '20px' }}>No sent requests</p>
        ) : (
          <div className="contact-list">
            {requestsSent.map(u => (
              <div key={u._id || u} className="contact-item" style={{ opacity: 0.8 }}>
                <h3>{u.name || u.email || u}</h3>
                <p style={{ color: 'var(--text-light)' }}>⏳ Waiting for response...</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
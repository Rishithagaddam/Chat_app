import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRequests, acceptRequest, rejectRequest } from '../features/contacts/contactsSlice';
import { useNavigate } from 'react-router-dom';

export default function ContactRequests() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { requestsReceived, loading } = useSelector(s => s.contacts);

  useEffect(() => {
    dispatch(fetchRequests());
  }, [dispatch]);

  const handleAccept = (id) => {
    dispatch(acceptRequest(id));
  };

  const handleReject = (id) => {
    dispatch(rejectRequest(id));
  };

  return (
    <div className="fade-in">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>📩 Contact Requests ({requestsReceived.length})</h2>
            <p className="text-light">People who want to connect with you</p>
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
      
      {loading && <div className="loading">Loading requests...</div>}
      
      {requestsReceived.length === 0 ? (
        <div className="card text-center">
          <h3 style={{ color: 'var(--text-light)', marginBottom: '20px' }}>No pending requests</h3>
          <p className="text-light">You're all caught up! 🎉</p>
        </div>
      ) : (
        <div className="request-list">
          {requestsReceived.map(req => (
            <div key={req._id} className="request-item slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>
                  {req.from?.name || 'Unknown User'}
                  {req.from?.isOnline ? (
                    <span style={{ color: '#00b894', fontSize: '12px', marginLeft: '8px' }}>● Online</span>
                  ) : (
                    <span style={{ color: '#636e72', fontSize: '12px', marginLeft: '8px' }}>● Offline</span>
                  )}
                </h3>
              </div>
              <p>Email: {req.from?.email || 'Not provided'}</p>
              {!req.from?.isOnline && req.from?.lastSeen && (
                <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  Last seen: {new Date(req.from.lastSeen).toLocaleString()}
                </p>
              )}
              <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                Requested: {new Date(req.createdAt).toLocaleString()}
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button onClick={() => handleAccept(req._id)} style={{ background: 'var(--success-color)' }}>
                  ✅ Accept
                </button>
                <button onClick={() => handleReject(req._id)} style={{ background: 'var(--error-color)' }}>
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
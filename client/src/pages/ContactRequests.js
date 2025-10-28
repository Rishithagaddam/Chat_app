import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRequests, acceptRequest, rejectRequest } from '../features/contacts/contactsSlice';
import { useNavigate } from 'react-router-dom';

export default function ContactRequests() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { requestsReceived, requestsSent, loading } = useSelector(s => s.contacts);

  useEffect(() => {
    dispatch(fetchRequests());
  }, [dispatch]);

  const handleAccept = (id) => {
    dispatch(acceptRequest(id));
  };

  const handleReject = (id) => {
    dispatch(rejectRequest(id));
  };

  const handleWithdraw = (id) => {
    // Use the same reject endpoint for withdrawing sent requests
    dispatch(rejectRequest(id));
  };

  return (
    <div className="fade-in">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>📩 Contact Requests</h2>
            <p className="text-light">Manage your contact requests</p>
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
      
      {/* Incoming Requests Section */}
      <div className="card">
        <h3 style={{ marginBottom: '20px', color: 'var(--primary-dark)' }}>
          📥 Incoming Requests ({(requestsReceived || []).length})
        </h3>
        
        {(requestsReceived || []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)' }}>
            <p>No pending requests</p>
          </div>
        ) : (
          <div className="request-list">
            {requestsReceived.map(req => (
              <div key={req._id} className="request-item slide-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3>
                    {req.name || 'Unknown User'}
                    {req.isOnline ? (
                      <span style={{ color: '#00b894', fontSize: '12px', marginLeft: '8px' }}>● Online</span>
                    ) : (
                      <span style={{ color: '#636e72', fontSize: '12px', marginLeft: '8px' }}>● Offline</span>
                    )}
                  </h3>
                </div>
                <p>Email: {req.email || 'Not provided'}</p>
                {!req.isOnline && req.lastSeen && (
                  <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    Last seen: {new Date(req.lastSeen).toLocaleString()}
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

      {/* Outgoing Requests Section */}
      <div className="card">
        <h3 style={{ marginBottom: '20px', color: 'var(--primary-dark)' }}>
          📤 Sent Requests ({(requestsSent || []).length})
        </h3>
        
        {(requestsSent || []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)' }}>
            <p>No sent requests</p>
          </div>
        ) : (
          <div className="request-list">
            {requestsSent.map(req => (
              <div key={req._id} className="request-item slide-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3>
                    {req.name || 'Unknown User'}
                    {req.isOnline ? (
                      <span style={{ color: '#00b894', fontSize: '12px', marginLeft: '8px' }}>● Online</span>
                    ) : (
                      <span style={{ color: '#636e72', fontSize: '12px', marginLeft: '8px' }}>● Offline</span>
                    )}
                  </h3>
                </div>
                <p>Email: {req.email || 'Not provided'}</p>
                {!req.isOnline && req.lastSeen && (
                  <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    Last seen: {new Date(req.lastSeen).toLocaleString()}
                  </p>
                )}
                <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  Status: <span style={{ color: '#ffa502' }}>⏳ Pending</span>
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button onClick={() => handleWithdraw(req._id)} style={{ background: 'var(--error-color)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    🗑️ Withdraw Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/groups');
        setGroups(res.data.groups || []);
      } catch (e) {
        if (e.response?.status === 401) setErr('Not authorized. Please login.');
        else setErr('Failed to load groups');
      }
    })();
  }, []);

  return (
    <div className="fade-in">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>🎯 Group Chats</h2>
            <p className="text-light">Join conversations with multiple people</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
            <Link to="/groups/new" style={{
              background: 'var(--gradient-primary)',
              color: 'var(--white)',
              padding: '12px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              boxShadow: '0 8px 25px rgba(139, 74, 74, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              ✨ Create Group
            </Link>
          </div>
        </div>
      </div>
      
      {err && <div className="error">{err}</div>}
      
      {groups.length === 0 ? (
        <div className="card text-center">
          <h3 style={{ color: 'var(--text-light)', marginBottom: '20px' }}>No groups yet</h3>
          <p className="text-light">Create your first group to start chatting with multiple people!</p>
        </div>
      ) : (
        <div className="group-list">
          {groups.map(g => (
            <div key={g._id} className="group-item slide-in">
              <h3>{g.name}</h3>
              <p>👥 {g.memberCount || g.members?.length || 0} members</p>
              <div style={{ marginTop: '15px' }}>
                <Link to={`/groups/${g._id}`} style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: 'var(--accent-light)',
                  borderRadius: '10px',
                  color: 'var(--primary-medium)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}>
                  💬 Join Chat
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
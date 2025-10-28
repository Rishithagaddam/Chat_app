import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function GroupCreate({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        // only allow creating groups from your contacts
        const res = await api.get('/contacts');
        const contactUsers = res.data.contacts || [];
        setUsers(contactUsers);
        // preselect from query string ?add=userid
        const params = new URLSearchParams(location.search);
        const add = params.get('add');
        if (add) setSelected(new Set([add]));
      } catch (e) {
        if (e.response?.status === 401) setErr('Not authorized. Please login.');
        else setErr('Failed to load users');
      }
    })();
  }, [location.search]);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!name.trim()) { setErr('Group name required'); return; }
    if (selected.size === 0) { setErr('Select at least one member'); return; }

    try {
      const members = Array.from(selected);
      const res = await api.post('/groups', { name: name.trim(), members });
      if (res.data?.success) {
        const groupId = res.data.group?._id || res.data.group?.id;
        if (groupId) navigate(`/groups/${groupId}`);
        else navigate('/groups');
      } else {
        setErr(res.data?.message || 'Failed to create group');
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to create group');
    }
  };

  return (
    <div className="fade-in">
      <div className="card">
        <h2>✨ Create New Group</h2>
        <p className="text-light">Bring people together for group conversations</p>
      </div>
      
      {err && <div className="error">{err}</div>}
      
      <form onSubmit={submit}>
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--primary-dark)' }}>
            🏷️ Group Name
          </label>
          <input 
            placeholder="Enter a fun group name..." 
            value={name} 
            onChange={e=>setName(e.target.value)}
            style={{ fontSize: '18px' }}
          />
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '16px', fontWeight: '600', color: 'var(--primary-dark)' }}>
            👥 Select Members ({selected.size} selected)
          </label>
          
          {users.length === 0 ? (
            <div className="card text-center">
              <p className="text-light">No contacts available. Add some contacts first!</p>
            </div>
          ) : (
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              background: 'var(--white)',
              border: '2px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              {users.map(u => (
                <div 
                  key={u._id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    background: selected.has(u._id) ? 'var(--accent-light)' : 'transparent',
                    border: selected.has(u._id) ? '2px solid var(--primary-light)' : '2px solid transparent',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggle(u._id)}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(u._id)}
                    onChange={() => toggle(u._id)}
                    style={{ marginRight: '12px', cursor: 'pointer' }}
                  />
                  <div>
                    <strong>{u.name}</strong>
                    {u.isOnline && <span style={{ color: '#00b894', fontSize: '12px', marginLeft: '8px' }}>● Online</span>}
                    <br/>
                    <small className="text-light">{u.email}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button type="submit" disabled={!name.trim() || selected.size === 0}>
            🚀 Create Group
          </button>
          <button type="button" onClick={()=>navigate('/groups')}>
            ❌ Cancel
          </button>
        </div>
      </form>
      
      {selected.size > 0 && (
        <div className="card" style={{ marginTop: '20px', background: 'var(--accent-light)', border: '2px solid var(--primary-light)' }}>
          <h4 style={{ color: 'var(--primary-dark)', marginBottom: '10px' }}>Selected Members:</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Array.from(selected).map(id => {
              const user = users.find(u => u._id === id);
              return user ? (
                <span key={id} style={{ 
                  background: 'var(--primary-medium)', 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: '16px', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {user.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
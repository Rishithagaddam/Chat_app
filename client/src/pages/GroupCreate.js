import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function GroupCreate({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [commonGroups, setCommonGroups] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const [contactsRes, groupsRes] = await Promise.all([
          api.get('/contacts'),
          api.get('/groups')
        ]);
        
        const contactUsers = contactsRes.data.contacts || [];
        const groups = groupsRes.data.groups || [];
        
        // Calculate common groups for each contact
        const commonGroupsMap = {};
        contactUsers.forEach(contact => {
          commonGroupsMap[contact._id] = groups.filter(group => 
            group.members.some(member => 
              member.user?._id === contact._id || member.user === contact._id
            )
          );
        });
        
        setUsers(contactUsers);
        setCommonGroups(commonGroupsMap);

        // Handle preselection from query params
        const params = new URLSearchParams(location.search);
        const add = params.get('add');
        if (add) setSelected(new Set([add]));
      } catch (e) {
        if (e.response?.status === 401) setErr('Not authorized. Please login.');
        else setErr('Failed to load contacts');
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

  const ContactCard = ({ user }) => (
    <div 
      key={user._id} 
      className="contact-card"
      style={{ 
        padding: '15px',
        borderRadius: '10px',
        background: selected.has(user._id) ? 'var(--accent-light)' : 'white',
        border: '1px solid var(--border-color)',
        marginBottom: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onClick={() => toggle(user._id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <h4 style={{ margin: 0 }}>{user.name}</h4>
            {user.isOnline ? (
              <span style={{ color: '#00b894', fontSize: '12px' }}>● Online</span>
            ) : (
              <span style={{ color: '#636e72', fontSize: '12px' }}>● Offline</span>
            )}
          </div>
          <p style={{ margin: '0 0 5px 0', color: 'var(--text-light)', fontSize: '14px' }}>
            {user.email}
          </p>
          {!user.isOnline && user.lastSeen && (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)' }}>
              Last seen: {new Date(user.lastSeen).toLocaleString()}
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <input 
            type="checkbox"
            checked={selected.has(user._id)}
            onChange={() => toggle(user._id)}
            style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
          />
          {commonGroups[user._id]?.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/contacts/${user._id}/groups`);
              }}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                background: 'var(--primary-light)',
                color: 'var(--primary-dark)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {commonGroups[user._id].length} Common Groups
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>✨ Create New Group</h2>
            <p className="text-light">Bring people together for group conversations</p>
          </div>
          <button
            onClick={() => navigate('/groups')}
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
            ← Back to Groups
          </button>
        </div>
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
          <label style={{ 
            display: 'block', 
            marginBottom: '16px', 
            fontWeight: '600', 
            color: 'var(--primary-dark)' 
          }}>
            👥 Select Members ({selected.size} selected)
          </label>
          
          {users.length === 0 ? (
            <div className="card text-center">
              <p className="text-light">No contacts available. Add some contacts first!</p>
              <Link 
                to="/users" 
                style={{
                  display: 'inline-block',
                  marginTop: '15px',
                  padding: '10px 20px',
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none'
                }}
              >
                Find Users
              </Link>
            </div>
          ) : (
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              padding: '10px'
            }}>
              {users.map(user => (
                <ContactCard key={user._id} user={user} />
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
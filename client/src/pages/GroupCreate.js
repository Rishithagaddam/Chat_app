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
    <div>
      <h2>Create Group</h2>
      {err && <div className="error">{err}</div>}
      <form onSubmit={submit}>
        <input placeholder="Group name" value={name} onChange={e=>setName(e.target.value)} />
        <div style={{ marginTop: 12 }}>
          <strong>Select members</strong>
          <ul>
            {users.map(u => (
              <li key={u._id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selected.has(u._id)}
                    onChange={() => toggle(u._id)}
                  />{' '}
                  {u.name} {u.isOnline ? '(online)' : ''}
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Create Group</button>{' '}
          <button type="button" onClick={()=>navigate('/groups')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
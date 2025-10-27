import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [err, setErr] = useState('');

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
    <div>
      <h2>Groups</h2>
      {err && <div className="error">{err}</div>}
      <Link to="/groups/new">Create group</Link>
      <ul>
        {groups.map(g => (
          <li key={g._id}>
            <Link to={`/groups/${g._id}`}>{g.name}</Link> (members: {g.memberCount || g.members?.length || 0})
          </li>
        ))}
      </ul>
    </div>
  );
}
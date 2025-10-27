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
    <div>
      <h2>All users</h2>
      {error && <div className="error">{error}</div>}
      {loading && <div>Loading...</div>}
      <ul>
        {users.filter(u => u._id !== currentUser?.id).map(u => (
          <li key={u._id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to={`/chat/${u._id}`}>{u.name} {u.isOnline ? '(online)' : ''}</Link>
            {contactIds.has(u._id.toString()) ? (
              <button disabled>Contact</button>
            ) : sentIds.has(u._id.toString()) ? (
              <button disabled>Requested</button>
            ) : (
              <button onClick={() => handleAdd(u._id)}>Add Contact</button>
            )}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 12 }}>
        <Link to="/requests">Contact requests</Link> | <Link to="/contacts">My contacts</Link>
      </div>
    </div>
  );
}
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
    <div>
      <h2>Incoming requests</h2>
      {error && <div className="error">{error}</div>}
      <ul>
        {requestsReceived.length === 0 && <li>No incoming requests</li>}
        {requestsReceived.map(u => (
          <li key={u._id || u}>
            {u.name || u.email || u}
            <button onClick={() => handleAccept(u._id || u)} style={{ marginLeft: 8 }}>Accept</button>
            <button onClick={() => handleReject(u._id || u)} style={{ marginLeft: 8 }}>Reject</button>
          </li>
        ))}
      </ul>

      <h3>Sent requests</h3>
      <ul>
        {requestsSent.length === 0 && <li>No sent requests</li>}
        {requestsSent.map(u => (
          <li key={u._id || u}>{u.name || u.email || u}</li>
        ))}
      </ul>
    </div>
  );
}
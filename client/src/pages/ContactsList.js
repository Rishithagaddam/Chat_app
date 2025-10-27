import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContacts } from '../features/contacts/contactsSlice';
import { Link } from 'react-router-dom';

export default function ContactsList() {
  const dispatch = useDispatch();
  const { contacts } = useSelector(s => s.contacts);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  return (
    <div>
      <h2>My contacts ({contacts.length})</h2>
      <ul>
        {contacts.length === 0 && <li>No contacts</li>}
        {contacts.map(c => (
          <li key={c._id}>
            <Link to={`/chat/${c._id}`}>{c.name} {c.isOnline ? '(online)' : ''}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
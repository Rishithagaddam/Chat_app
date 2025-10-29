import React, { useState, useEffect } from 'react';
import api from '../api';

export default function AddGroupMembers({ groupId, currentUser, onMembersAdded }) {
  const [contacts, setContacts] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch contacts when component mounts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await api.get('/contacts');
        // Filter out contacts that are already members
        const filteredContacts = (response.data.contacts || []).filter(
          contact => !currentUser?.groups?.some(
            group => group._id === groupId && group.members?.some(
              member => member.user._id === contact._id
            )
          )
        );
        setContacts(filteredContacts);
      } catch (err) {
        setError('Failed to load contacts');
      }
    };
    fetchContacts();
  }, [currentUser, groupId]);

  // Handle adding members
  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return;
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await api.post(`/groups/${groupId}/members`, {
        memberIds: selectedMembers
      });
      
      if (response.data.success) {
        setSuccessMessage('Members added successfully!');
        onMembersAdded?.(response.data.group);
        setSelectedMembers([]);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Add Members</h3>
      {error && <div className="error">{error}</div>}
      {successMessage && (
        <div style={{ 
          color: 'green', 
          padding: '10px', 
          marginBottom: '10px',
          background: '#e6ffe6',
          borderRadius: '5px'
        }}>
          {successMessage}
        </div>
      )}
      
      {contacts.length === 0 ? (
        <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '20px' }}>
          No contacts available to add
        </p>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {contacts.map(contact => (
            <div 
              key={contact._id} 
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <input
                type="checkbox"
                id={`contact-${contact._id}`}
                checked={selectedMembers.includes(contact._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedMembers(prev => [...prev, contact._id]);
                  } else {
                    setSelectedMembers(prev => prev.filter(id => id !== contact._id));
                  }
                }}
              />
              <label 
                htmlFor={`contact-${contact._id}`}
                style={{ marginLeft: '10px', cursor: 'pointer' }}
              >
                {contact.name}
              </label>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleAddMembers}
        disabled={loading || selectedMembers.length === 0}
        style={{
          marginTop: '15px',
          padding: '10px 20px',
          background: 'var(--primary-medium)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: selectedMembers.length > 0 ? 'pointer' : 'not-allowed',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Adding...' : `Add Selected Members (${selectedMembers.length})`}
      </button>
    </div>
  );
}
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContacts, deleteContact } from '../features/contacts/contactsSlice';
import { Link, useNavigate } from 'react-router-dom';
import { getSocket } from '../socket';  // Add this import
import api from '../api';

export default function ContactsList({ currentUser }) { // Add currentUser prop
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { contacts, loading } = useSelector(s => s.contacts);
  const [commonGroups, setCommonGroups] = useState({});
  const [showConfirm, setShowConfirm] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const socket = getSocket(); // Get socket instance

  useEffect(() => {
    dispatch(fetchContacts());
    
    // Fetch groups to calculate common groups
    const fetchGroups = async () => {
      try {
        const groupsRes = await api.get('/groups');
        const groups = groupsRes.data.groups || [];
        
        // Calculate common groups for each contact
        const commonGroupsMap = {};
        contacts.forEach(contact => {
          commonGroupsMap[contact._id] = groups.filter(group => 
            group.members.some(member => 
              member.user?._id === contact._id || member.user === contact._id
            )
          );
        });
        
        setCommonGroups(commonGroupsMap);
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      }
    };

    fetchGroups();
  }, [dispatch, contacts.length]);

  // Add function to fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const res = await api.get('/messages/unread-counts');
      const counts = res.data.unreadCounts.reduce((acc, item) => {
        acc[item.userId] = item.count;
        return acc;
      }, {});
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, []); // Empty deps array since it doesn't depend on any props/state

  useEffect(() => {
    fetchUnreadCounts();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCounts]);

  const handleDeleteContact = async (contactId) => {
    try {
      await dispatch(deleteContact(contactId)).unwrap();
      setShowConfirm(null);
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (message) => {
        if (message.receiver === currentUser?._id) {
          // Refresh unread counts when new message arrives
          fetchUnreadCounts();
        }
      });

      socket.on('messageRead', ({ messageId, readBy }) => {
        // Refresh unread counts when messages are read
        fetchUnreadCounts();
      });

      return () => {
        socket.off('newMessage');
        socket.off('messageRead');
      };
    }
  }, [socket, currentUser, fetchUnreadCounts]);

  if (loading) return <div className="loading">Loading contacts...</div>;

  return (
    <div className="fade-in">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>👥 My Contacts ({contacts.length})</h2>
            <p className="text-light">Your trusted connections</p>
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
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="card text-center">
          <h3 style={{ color: 'var(--text-light)', marginBottom: '20px' }}>No contacts yet</h3>
          <p className="text-light">Start adding people to build your network!</p>
          <Link 
            to="/users" 
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '12px 24px',
              background: 'var(--gradient-primary)',
              color: 'var(--white)',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            🔍 Discover Users
          </Link>
        </div>
      ) : (
        <div className="contact-list">
          {contacts.map(c => (
            <div key={c._id} className="contact-item slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <h3 style={{ margin: 0 }}>
                      {c.name}
                      {c.isOnline ? (
                        <span style={{ color: '#00b894', fontSize: '12px', marginLeft: '8px' }}>● Online</span>
                      ) : (
                        <span style={{ color: '#636e72', fontSize: '12px', marginLeft: '8px' }}>● Offline</span>
                      )}
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 5px 0', color: 'var(--text-light)', fontSize: '14px' }}>
                    {c.email}
                  </p>
                  {!c.isOnline && c.lastSeen && (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)' }}>
                      Last seen: {new Date(c.lastSeen).toLocaleString()}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <Link 
                    to={`/chat/${c._id}`}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--gradient-primary)',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      position: 'relative'
                    }}
                  >
                    💬 Chat
                    {unreadCounts[c._id] > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: 'var(--danger)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '2px solid white'
                      }}>
                        {unreadCounts[c._id] > 99 ? '99+' : unreadCounts[c._id]}
                      </span>
                    )}
                  </Link>

                  {commonGroups[c._id]?.length > 0 && (
                    <Link
                      to={`/contacts/${c._id}/groups`}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--accent-light)',
                        color: 'var(--primary-dark)',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}
                    >
                      👥 {commonGroups[c._id].length} Common Groups
                    </Link>
                  )}

                  {showConfirm === c._id ? (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '4px',
                      marginTop: '8px' 
                    }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '12px', 
                        color: 'var(--danger)',
                        textAlign: 'center' 
                      }}>
                        Remove contact?
                      </p>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleDeleteContact(c._id)}
                          style={{
                            padding: '4px 8px',
                            background: 'var(--danger)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setShowConfirm(null)}
                          style={{
                            padding: '4px 8px',
                            background: 'var(--accent-light)',
                            color: 'var(--text-dark)',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirm(c._id)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--danger-light)',
                        color: 'var(--danger)',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      ❌ Remove Contact
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
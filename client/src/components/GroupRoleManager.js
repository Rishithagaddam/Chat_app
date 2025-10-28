import React, { useState } from 'react';
import api from '../api';

const GroupRoleManager = ({ group, currentUser, onUpdate }) => {
  const [updating, setUpdating] = useState({});

  const isAdmin = group.admin._id === currentUser.id || 
                  group.members.some(m => m.user._id === currentUser.id && m.role === 'admin');

  const canManageRoles = isAdmin;

  const handleRoleChange = async (memberId, newRole) => {
    if (!canManageRoles) return;
    
    setUpdating({ ...updating, [memberId]: true });
    
    try {
      const response = await api.put(`/groups/${group._id}/members/${memberId}/role`, {
        role: newRole
      });
      
      if (response.data.success) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setUpdating({ ...updating, [memberId]: false });
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'moderator': return '🛡️';
      case 'member': return '👤';
      default: return '👤';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#ff6b6b';
      case 'moderator': return '#4ecdc4';
      case 'member': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="card">
      <h4 style={{ color: 'var(--primary-dark)', marginBottom: '20px' }}>
        👥 Group Members ({group.members.length})
      </h4>
      
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {group.members.map(member => (
          <div
            key={member.user._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              marginBottom: '8px',
              borderRadius: '8px',
              background: 'var(--accent-light)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                {getRoleIcon(member.role)}
              </div>
              
              <div>
                <div style={{ 
                  fontWeight: '600',
                  color: 'var(--text-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {member.user.name}
                  {member.user.isOnline && (
                    <span style={{ 
                      color: '#00b894',
                      fontSize: '12px'
                    }}>● Online</span>
                  )}
                </div>
                <div style={{ 
                  fontSize: '12px',
                  color: 'var(--text-light)'
                }}>
                  {member.user.email}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: getRoleColor(member.role),
                  fontWeight: '600',
                  marginTop: '2px'
                }}>
                  {member.role.toUpperCase()}
                </div>
              </div>
            </div>

            {canManageRoles && member.user._id !== currentUser.id && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {member.role !== 'admin' && (
                  <button
                    onClick={() => handleRoleChange(member.user._id, 'admin')}
                    disabled={updating[member.user._id]}
                    style={{
                      background: '#ff6b6b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Make Admin
                  </button>
                )}
                
                {member.role !== 'moderator' && member.role !== 'admin' && (
                  <button
                    onClick={() => handleRoleChange(member.user._id, 'moderator')}
                    disabled={updating[member.user._id]}
                    style={{
                      background: '#4ecdc4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Make Moderator
                  </button>
                )}
                
                {member.role !== 'member' && (
                  <button
                    onClick={() => handleRoleChange(member.user._id, 'member')}
                    disabled={updating[member.user._id]}
                    style={{
                      background: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Make Member
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupRoleManager;

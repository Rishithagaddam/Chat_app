import React, { useState, useEffect } from 'react';
import activityService from '../services/activityService';

const ActivityCenter = ({ isOpen, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadActivities();
      
      const handleNewActivity = (event) => {
        setActivities(prev => [event.detail, ...prev]);
      };

      window.addEventListener('newActivity', handleNewActivity);
      return () => window.removeEventListener('newActivity', handleNewActivity);
    }
  }, [isOpen]);

  const loadActivities = () => {
    const allActivities = activityService.getActivities();
    setActivities(allActivities);
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.type.includes(filter);
  });

  const markAsRead = (activityId) => {
    activityService.markActivityAsRead(activityId);
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId ? { ...activity, read: true } : activity
      )
    );
  };

  const markAllAsRead = () => {
    activityService.markAllActivitiesAsRead();
    setActivities(prev => 
      prev.map(activity => ({ ...activity, read: true }))
    );
  };

  const clearAll = () => {
    activityService.clearActivities();
    setActivities([]);
  };

  const getActivityIcon = (type) => {
    const icons = {
      message_received: '💬',
      message_sent: '📤',
      message_edited: '✏️',
      message_deleted: '🗑️',
      group_joined: '👋',
      group_left: '👋',
      group_created: '👥',
      media_shared: '📎'
    };
    return icons[type] || '📋';
  };

  const getActivityText = (activity) => {
    const { type, data } = activity;
    
    switch (type) {
      case 'message_received':
        return data.isGroup 
          ? `${data.senderName} sent a message in group chat`
          : `${data.senderName} sent you a message`;
      case 'contact_request_received':
        return `${data.fromUserName} sent you a contact request`;
      case 'contact_accepted':
        return `${data.userName} accepted your contact request`;
      case 'media_shared':
        return `${data.senderName} shared ${data.mediaType}: ${data.fileName}`;
      case 'group_joined':
        return `${data.userName} joined ${data.groupName}`;
      case 'group_left':
        return `${data.userName} left ${data.groupName}`;
      case 'message_edited':
        return `Message was edited`;
      case 'message_deleted':
        return `Message was deleted`;
      default:
        return 'Activity occurred';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: '16px',
        padding: '24px',
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <h2 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '20px' }}>
            📋 Activity Center
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-light)',
              padding: '4px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--white)',
              fontSize: '14px',
              color: 'var(--text-dark)'
            }}
          >
            <option value="all">All Activities</option>
            <option value="message">Messages</option>
            <option value="group">Groups</option>
            <option value="media">Media</option>
          </select>

          <button
            onClick={markAllAsRead}
            disabled={activities.every(a => a.read)}
            style={{
              background: activities.every(a => a.read) ? 'var(--border-color)' : 'var(--primary-light)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: activities.every(a => a.read) ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              opacity: activities.every(a => a.read) ? 0.5 : 1
            }}
          >
            Mark All Read
          </button>

          <button
            onClick={clearAll}
            style={{
              background: 'var(--error-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            Clear All
          </button>
        </div>

        {/* Activities List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          {filteredActivities.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-light)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-light)' }}>No activities yet</h3>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Your notifications will appear here when you receive messages, join groups, or interact with others.
              </p>
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => !activity.read && markAsRead(activity.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  background: activity.read ? 'var(--white)' : 'var(--accent-light)',
                  border: `1px solid ${activity.read ? 'var(--border-color)' : 'var(--primary-light)'}`,
                  cursor: activity.read ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activity.read ? 'none' : '0 2px 8px rgba(139, 74, 74, 0.1)'
                }}
              >
                <span style={{ 
                  fontSize: '24px', 
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  {getActivityIcon(activity.type)}
                </span>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    color: 'var(--text-dark)',
                    marginBottom: '4px',
                    fontWeight: activity.read ? '400' : '600',
                    lineHeight: '1.4'
                  }}>
                    {getActivityText(activity)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-light)'
                  }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>

                {!activity.read && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: 'var(--primary-medium)',
                    borderRadius: '50%',
                    flexShrink: 0,
                    marginLeft: '8px',
                    marginTop: '6px'
                  }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCenter;

import React, { useState, useEffect } from 'react';

const NotificationToast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewActivity = (event) => {
      const activity = event.detail;
      
      // Only show toast for certain activity types
      const showableTypes = ['message_received', 'media_shared', 'group_joined', 'group_left'];
      if (!showableTypes.includes(activity.type)) return;

      const toast = {
        id: Date.now(),
        activity,
        timestamp: new Date()
      };

      setToasts(prev => [...prev, toast]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 5000);
    };

    window.addEventListener('newActivity', handleNewActivity);
    return () => window.removeEventListener('newActivity', handleNewActivity);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastText = (activity) => {
    const { type, data } = activity;
    
    switch (type) {
      case 'message_received':
        return `${data.senderName}: New message`;
      case 'media_shared':
        return `${data.senderName}: Shared ${data.mediaType}`;
      case 'group_joined':
        return `${data.userName} joined ${data.groupName}`;
      case 'group_left':
        return `${data.userName} left ${data.groupName}`;
      default:
        return 'New activity';
    }
  };

  const getToastIcon = (type) => {
    const icons = {
      message_received: '💬',
      media_shared: '📎',
      group_joined: '👋',
      group_left: '👋'
    };
    return icons[type] || '📋';
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--primary-light)',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: '300px',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>
                {getToastIcon(toast.activity.type)}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-dark)'
              }}>
                {getToastText(toast.activity)}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: 'var(--text-light)',
                padding: '0',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-light)'
          }}>
            {toast.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;

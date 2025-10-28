import React, { useState, useEffect } from 'react';
import NotificationSettings from './NotificationSettings';
import ActivityCenter from './ActivityCenter';
import notificationService from '../services/notificationService';
import activityService from '../services/activityService';

const NotificationHeader = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDndActive, setIsDndActive] = useState(false);

  useEffect(() => {
    // Initial load
    setUnreadCount(activityService.getUnreadActivitiesCount());
    setIsDndActive(notificationService.isDoNotDisturb());

    // Listen for new activities
    const handleNewActivity = () => {
      setUnreadCount(activityService.getUnreadActivitiesCount());
    };

    // Check DND status periodically
    const dndInterval = setInterval(() => {
      setIsDndActive(notificationService.isDoNotDisturb());
    }, 30000);

    window.addEventListener('newActivity', handleNewActivity);

    return () => {
      window.removeEventListener('newActivity', handleNewActivity);
      clearInterval(dndInterval);
    };
  }, []);

  const handleActivityCenterClose = () => {
    setShowActivity(false);
    // Refresh unread count when activity center closes
    setUnreadCount(activityService.getUnreadActivitiesCount());
  };

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* DND Indicator */}
        {isDndActive && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--danger)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            🔕 DND
          </div>
        )}

        {/* Activity Center Button */}
        <button
          onClick={() => setShowActivity(true)}
          style={{
            position: 'relative',
            background: 'var(--primary-light)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📋 Activity
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--danger)',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            background: 'var(--accent-light)',
            color: 'var(--text-dark)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🔔 Settings
        </button>

        {/* Quick DND Toggle */}
        <button
          onClick={() => {
            if (isDndActive) {
              notificationService.setDoNotDisturb(0);
            } else {
              notificationService.setDoNotDisturb(60); // 1 hour
            }
            setIsDndActive(!isDndActive);
          }}
          style={{
            background: isDndActive ? 'var(--danger)' : 'var(--success)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {isDndActive ? '🔕' : '🔔'}
        </button>

        {/* Notification Permission Status */}
        {notificationService.permission !== 'granted' && (
          <div style={{
            background: 'var(--warning)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            ⚠️ Enable notifications
          </div>
        )}
      </div>

      {/* Modals */}
      <NotificationSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      <ActivityCenter 
        isOpen={showActivity} 
        onClose={handleActivityCenterClose} 
      />
    </>
  );
};

export default NotificationHeader;

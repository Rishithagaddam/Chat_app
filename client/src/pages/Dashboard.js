import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import NotificationSettings from '../components/NotificationSettings';
import ActivityCenter from '../components/ActivityCenter';
import notificationService from '../services/notificationService';
import activityService from '../services/activityService';

export default function Dashboard({ user, onLogout }) {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showActivityCenter, setShowActivityCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDndActive, setIsDndActive] = useState(false);

  useEffect(() => {
    // Initialize notification counts and status
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
    setShowActivityCenter(false);
    // Refresh unread count when activity center closes
    setUnreadCount(activityService.getUnreadActivitiesCount());
  };

  const toggleDND = () => {
    if (isDndActive) {
      notificationService.setDoNotDisturb(0);
    } else {
      notificationService.setDoNotDisturb(60); // 1 hour
    }
    setIsDndActive(!isDndActive);
  };

  return (
    <div className="app-shell">
      <header>
        <div>
          <h1>💬 ChatApp</h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            margin: 0, 
            fontSize: '14px' 
          }}>
            Welcome back, {user.name}!
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Navigation Links */}
          <Link to="/users">👥 Users</Link>
          <Link to="/contacts">📇 Contacts</Link>
          <Link to="/groups">🎯 Groups</Link>
          <Link to="/requests">📬 Requests</Link>
          
          {/* Notification Controls */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginLeft: '20px',
            paddingLeft: '20px',
            borderLeft: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            {/* DND Indicator */}
            {isDndActive && (
              <div style={{
                background: 'rgba(255, 107, 107, 0.9)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                🔕 DND
              </div>
            )}

            {/* Activity Center Button */}
            <button
              onClick={() => setShowActivityCenter(true)}
              style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backdropFilter: 'blur(10px)'
              }}
            >
              📋 Activity
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ff6b6b',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  border: '1px solid white'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Settings Button */}
            <button
              onClick={() => setShowNotificationSettings(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                backdropFilter: 'blur(10px)'
              }}
            >
              🔔
            </button>

            {/* Quick DND Toggle
            <button
              onClick={toggleDND}
              title={isDndActive ? 'Turn off Do Not Disturb' : 'Turn on Do Not Disturb'}
              style={{
                background: isDndActive 
                  ? 'rgba(255, 107, 107, 0.8)' 
                  : 'rgba(0, 184, 148, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '14px',
                backdropFilter: 'blur(10px)'
              }}
            >
              {isDndActive ? '🔕' : '🔔'}
            </button> */}

            {/* Notification Permission Warning */}
            {notificationService.permission !== 'granted' && (
              <div 
                onClick={() => notificationService.requestPermission()}
                style={{
                  background: 'rgba(255, 159, 67, 0.9)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                title="Click to enable notifications"
              >
                ⚠️
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button onClick={onLogout} style={{ marginLeft: '12px', 
            background: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(10px)' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>⬅️</span> 
            Logout
          </button>
        </div>
      </header>
      
      <main>
        <Outlet />
      </main>

      {/* Notification Modals */}
      <NotificationSettings 
        isOpen={showNotificationSettings} 
        onClose={() => setShowNotificationSettings(false)} 
      />
      <ActivityCenter 
        isOpen={showActivityCenter} 
        onClose={handleActivityCenterClose} 
      />
    </div>
  );
}
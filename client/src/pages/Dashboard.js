import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import NotificationSettings from '../components/NotificationSettings';
import ActivityCenter from '../components/ActivityCenter';
import ProfileModal from '../components/ProfileModal';
import notificationService from '../services/notificationService';
import activityService from '../services/activityService';

export default function Dashboard({ user, onLogout }) {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showActivityCenter, setShowActivityCenter] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDndActive, setIsDndActive] = useState(false);
  const [userProfile, setUserProfile] = useState(user);

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

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
    // Update the user state in App.js if needed
    // You might want to lift this state up or use a context
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
            Welcome back, {userProfile.name}!
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Navigation Links */}
          <Link to="/users">👥 Users</Link>
          <Link to="/contacts">📇 Contacts</Link>
          <Link to="/groups">🎯 Groups</Link>
          <Link to="/requests">📬 Requests</Link>
          
          {/* Profile Section */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginLeft: '20px',
            paddingLeft: '20px',
            borderLeft: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            {/* Profile Picture & Info */}
            <div
              onClick={() => setShowProfileModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                
                transition: 'all 0.3s ease',
                height: '32px', // Fixed height to match other buttons
                minWidth: 'fit-content'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {/* Profile Picture */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {userProfile.profilePicture ? (
                  <img
                    src={`http://localhost:5000${userProfile.profilePicture}`}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '16px', color: 'white' }}>👤</span>
                )}
              </div>
              
              {/* User Info */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                minWidth: '0',
                lineHeight: 1
              }}>
                {/* <span style={{ 
                  color: 'white', 
                  fontSize: '11px', 
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100px'
                }}>
                  {userProfile.name}
                </span> */}
                {userProfile.statusMessage && (
                  <span style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '9px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100px',
                    marginTop: '1px'
                  }}>
                    {userProfile.statusMessage}
                  </span>
                )}
              </div>
              
              {/* <span style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '8px',
                marginLeft: '4px'
              }}>✏️</span> */}
            </div>
          </div>

          {/* Notification Controls */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            paddingLeft: '12px',
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
                fontWeight: '600',
                height: '24px',
                display: 'flex',
                alignItems: 'center'
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
                backdropFilter: 'blur(10px)',
                height: '32px' // Fixed height
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
                backdropFilter: 'blur(10px)',
                height: '32px', // Fixed height
                display: 'flex',
                alignItems: 'center'
              }}
            >
              🔔
            </button>

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
                  cursor: 'pointer',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Click to enable notifications"
              >
                ⚠️
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button onClick={onLogout} style={{ 
            marginLeft: '12px', 
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
            backdropFilter: 'blur(10px)',
            height: '32px' // Fixed height to match other buttons
          }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>⬅️</span> 
            Logout
          </button>
        </div>
      </header>
      
      <main>
        <Outlet />
      </main>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={userProfile}
        onProfileUpdate={handleProfileUpdate}
      />

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
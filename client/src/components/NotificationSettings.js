import React, { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

const NotificationSettings = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState(notificationService.preferences);
  const [dndMinutes, setDndMinutes] = useState(0);
  const [isDndActive, setIsDndActive] = useState(false);

  useEffect(() => {
    setIsDndActive(notificationService.isDoNotDisturb());
  }, []);

  const handlePreferenceChange = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    notificationService.updatePreferences(newPreferences);
  };

  const handleDndToggle = () => {
    if (isDndActive) {
      notificationService.setDoNotDisturb(0);
      setIsDndActive(false);
    } else {
      const minutes = dndMinutes || 60;
      notificationService.setDoNotDisturb(minutes);
      setIsDndActive(true);
    }
  };

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      handlePreferenceChange('browserNotifications', true);
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
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '85vh',
        overflow: 'auto',
        border: '1px solid var(--border-color)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <h2 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '20px' }}>
            🔔 Notification Settings
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

        {/* Browser Notifications */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: 'var(--text-dark)', marginBottom: '16px', fontSize: '16px' }}>
            Browser Notifications
          </h3>
          
          {notificationService.permission !== 'granted' && (
            <div style={{
              background: 'var(--accent-light)',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid var(--border-color)'
            }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-dark)' }}>
                Enable browser notifications to receive alerts when you get new messages.
              </p>
              <button
                onClick={requestNotificationPermission}
                style={{
                  background: 'var(--primary-medium)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Enable Notifications
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--accent-light)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}>
              <input
                type="checkbox"
                checked={preferences.browserNotifications}
                onChange={(e) => handlePreferenceChange('browserNotifications', e.target.checked)}
                disabled={notificationService.permission !== 'granted'}
                style={{ transform: 'scale(1.2)' }}
              />
              <span style={{ fontSize: '14px' }}>Enable browser notifications</span>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--accent-light)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}>
              <input
                type="checkbox"
                checked={preferences.showPreview}
                onChange={(e) => handlePreferenceChange('showPreview', e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              <span style={{ fontSize: '14px' }}>Show message preview</span>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--accent-light)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}>
              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={(e) => handlePreferenceChange('soundEnabled', e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              <span style={{ fontSize: '14px' }}>Play notification sound</span>
            </label>
          </div>
        </div>

        {/* Notification Types */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: 'var(--text-dark)', marginBottom: '16px', fontSize: '16px' }}>
            Notification Types
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'messageNotifications', icon: '💬', label: 'Direct messages' },
              { key: 'groupNotifications', icon: '👥', label: 'Group messages' },
              { key: 'mediaNotifications', icon: '📎', label: 'Media shared' },
              { key: 'emailNotifications', icon: '📧', label: 'Email notifications (offline)' }
            ].map(({ key, icon, label }) => (
              <label key={key} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--accent-light)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ fontSize: '18px' }}>{icon}</span>
                <span style={{ fontSize: '14px' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Do Not Disturb */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: 'var(--text-dark)', marginBottom: '16px', fontSize: '16px' }}>
            Do Not Disturb
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={handleDndToggle}
              style={{
                background: isDndActive ? 'var(--error-color)' : 'var(--primary-medium)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {isDndActive ? '🔕 Turn Off DND' : '🔕 Turn On DND'}
            </button>

            {!isDndActive && (
              <>
                <input
                  type="number"
                  value={dndMinutes}
                  onChange={(e) => setDndMinutes(parseInt(e.target.value) || 0)}
                  placeholder="Minutes"
                  min="0"
                  max="1440"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    width: '100px',
                    fontSize: '14px'
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  minutes (0 = until turned off)
                </span>
              </>
            )}
          </div>

          {isDndActive && (
            <div style={{
              background: 'var(--accent-light)',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--text-dark)',
              border: '1px solid var(--border-color)'
            }}>
              🔕 Do Not Disturb is active
              {notificationService.doNotDisturbUntil && (
                <span>
                  {' '}until {notificationService.doNotDisturbUntil.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--text-dark)', marginBottom: '8px' }}>
              Quick DND Options:
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[15, 30, 60, 120, 480].map(minutes => (
                <button
                  key={minutes}
                  onClick={() => {
                    notificationService.setDoNotDisturb(minutes);
                    setIsDndActive(true);
                  }}
                  style={{
                    background: 'var(--accent-light)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {minutes < 60 ? `${minutes}m` : `${minutes/60}h`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--primary-medium)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;

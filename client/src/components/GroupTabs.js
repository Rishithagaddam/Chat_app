import React from 'react';

const GroupTabs = ({ activeTab, onTabChange, unreadCounts = {} }) => {
  const tabs = [
    { id: 'chat', label: '💬 Chat', icon: '💬' },
    { id: 'announcements', label: '📢 Announcements', icon: '📢' },
    { id: 'polls', label: '📊 Polls', icon: '📊' },
    { id: 'media', label: '🖼️ Media', icon: '🖼️' },
    { id: 'members', label: '👥 Members', icon: '👥' }
  ];

  return (
    <div style={{
      display: 'flex',
      borderBottom: '2px solid var(--border-color)',
      marginBottom: '20px',
      overflowX: 'auto'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: activeTab === tab.id ? 'var(--primary-medium)' : 'transparent',
            color: activeTab === tab.id ? 'white' : 'var(--text-dark)',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap',
            minWidth: 'fit-content'
          }}
        >
          <span>{tab.icon}</span>
          <span className="tab-label">{tab.label.replace(/^.+\s/, '')}</span>
          {unreadCounts[tab.id] > 0 && (
            <span style={{
              background: 'var(--error-color)',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              top: '4px',
              right: '4px'
            }}>
              {unreadCounts[tab.id] > 99 ? '99+' : unreadCounts[tab.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default GroupTabs;

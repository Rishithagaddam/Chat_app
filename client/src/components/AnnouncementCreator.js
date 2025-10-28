import React, { useState } from 'react';
import api from '../api';

const AnnouncementCreator = ({ groupId, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('medium');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      const data = {
        title: title.trim(),
        content: content.trim(),
        groupId,
        priority,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
      };

      const response = await api.post('/announcements', data);
      
      if (response.data.success) {
        onSuccess(response.data.announcement);
        setTitle('');
        setContent('');
        setPriority('medium');
        setExpiresAt('');
      } else {
        setError(response.data.message || 'Failed to create announcement');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <h3 style={{ color: 'var(--primary-dark)', marginBottom: '20px' }}>
        📢 Create Announcement
      </h3>
      
      {error && (
        <div style={{
          background: 'var(--error-color)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: '600',
            color: 'var(--primary-dark)'
          }}>
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter announcement title..."
            style={{ width: '100%' }}
            maxLength={200}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: '600',
            color: 'var(--primary-dark)'
          }}>
            Content *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter announcement content..."
            rows="4"
            style={{ 
              width: '100%', 
              resize: 'vertical',
              minHeight: '100px'
            }}
            maxLength={2000}
          />
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '15px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: '600',
              color: 'var(--primary-dark)'
            }}>
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🟠 High</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: '600',
              color: 'var(--primary-dark)'
            }}>
              Expires At (Optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={{ width: '100%' }}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'flex-end' 
        }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              background: 'var(--accent-light)',
              color: 'var(--text-dark)',
              border: '1px solid var(--border-color)'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim() || !content.trim()}
            style={{
              background: loading ? 'var(--text-light)' : 'var(--primary-medium)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating...' : '📢 Create Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnnouncementCreator;

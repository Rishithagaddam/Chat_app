import React, { useState } from 'react';
import api from '../api';

const PollCreator = ({ groupId, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [settings, setSettings] = useState({
    allowMultipleVotes: false,
    anonymousVoting: false,
    showResultsBeforeVoting: false,
    allowAddOptions: false
  });
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const validOptions = options.filter(opt => opt.trim());
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    setLoading(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        groupId,
        options: validOptions,
        settings,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
      };

      const response = await api.post('/polls', data);
      
      if (response.data.success) {
        onSuccess(response.data.poll);
        // Reset form
        setTitle('');
        setDescription('');
        setOptions(['', '']);
        setSettings({
          allowMultipleVotes: false,
          anonymousVoting: false,
          showResultsBeforeVoting: false,
          allowAddOptions: false
        });
        setExpiresAt('');
      } else {
        setError(response.data.message || 'Failed to create poll');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <h3 style={{ color: 'var(--primary-dark)', marginBottom: '20px' }}>
        📊 Create Poll
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
            Poll Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your question?"
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
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details about this poll..."
            rows="3"
            style={{ width: '100%', resize: 'vertical' }}
            maxLength={500}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px', 
            fontWeight: '600',
            color: 'var(--primary-dark)'
          }}>
            Options *
          </label>
          {options.map((option, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              gap: '10px', 
              marginBottom: '8px',
              alignItems: 'center'
            }}>
              <span style={{ 
                minWidth: '20px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--primary-medium)'
              }}>
                {index + 1}.
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                style={{ flex: 1 }}
                maxLength={100}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  style={{
                    background: 'var(--error-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          
          {options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              style={{
                background: 'var(--accent-light)',
                color: 'var(--primary-medium)',
                border: '1px solid var(--primary-light)',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '8px'
              }}
            >
              + Add Option
            </button>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px', 
            fontWeight: '600',
            color: 'var(--primary-dark)'
          }}>
            Poll Settings
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={settings.allowMultipleVotes}
                onChange={(e) => setSettings({...settings, allowMultipleVotes: e.target.checked})}
              />
              Allow multiple votes
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={settings.anonymousVoting}
                onChange={(e) => setSettings({...settings, anonymousVoting: e.target.checked})}
              />
              Anonymous voting
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={settings.showResultsBeforeVoting}
                onChange={(e) => setSettings({...settings, showResultsBeforeVoting: e.target.checked})}
              />
              Show results before voting
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={settings.allowAddOptions}
                onChange={(e) => setSettings({...settings, allowAddOptions: e.target.checked})}
              />
              Allow members to add options
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
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
            disabled={loading || !title.trim() || options.filter(o => o.trim()).length < 2}
            style={{
              background: loading ? 'var(--text-light)' : 'var(--primary-medium)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating...' : '📊 Create Poll'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PollCreator;

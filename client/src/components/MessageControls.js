import React, { useState } from 'react';
import api from '../api';

const MessageControls = ({ 
  message, 
  currentUser, 
  onEdit, 
  onDelete, 
  onReact, 
  onPin, 
  onForward, 
  onQuote,
  isGroupChat = false 
}) => {
  const [showControls, setShowControls] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message || '');

  const canEdit = () => {
    if (message.sender?._id !== (currentUser.id || currentUser._id)) return false;
    if (message.messageType !== 'text') return false;
    if (message.isDeleted) return false;
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes
    return (Date.now() - new Date(message.createdAt).getTime()) < editTimeLimit;
  };

  const canDelete = () => {
    if (message.isDeleted) return false;
    return message.sender?._id === (currentUser.id || currentUser._id);
  };

  const canPin = () => {
    return isGroupChat; // Only allow pinning in groups for now
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    try {
      await api.put(`/messages/${message._id}/edit`, { message: editText });
      onEdit?.(message._id, editText);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await api.delete(`/messages/${message._id}`);
        onDelete?.(message._id);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  const handleReaction = async (emoji) => {
    try {
      await api.post(`/messages/${message._id}/react`, { emoji });
      onReact?.(message._id, emoji);
      setShowReactions(false);
    } catch (error) {
      console.error('Failed to react to message:', error);
    }
  };

  const handlePin = async () => {
    try {
      await api.post(`/messages/${message._id}/pin`);
      onPin?.(message._id);
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  };

  const handleForward = () => {
    setShowForwardModal(true);
    onForward?.(message);
  };

  const handleQuote = () => {
    onQuote?.(message);
  };

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👎', '🎉'];

  return (
    <div className="message-controls" style={{ position: 'relative' }}>
      {/* Edit Mode */}
      {isEditing ? (
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          padding: '8px',
          background: 'var(--accent-light)',
          borderRadius: '8px',
          marginTop: '8px'
        }}>
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '14px'
            }}
            autoFocus
          />
          <button
            onClick={handleEdit}
            style={{
              padding: '6px 12px',
              background: 'var(--primary-medium)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ✓ Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            style={{
              padding: '6px 12px',
              background: 'var(--border-color)',
              color: 'var(--text-dark)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ✕ Cancel
          </button>
        </div>
      ) : (
        <>
          {/* Controls Trigger */}
          <div
            className="controls-trigger"
            onClick={() => setShowControls(!showControls)}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--primary-medium)',
              color: 'white',
              display: showControls ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '10px',
              zIndex: 10
            }}
          >
            ⚙️
          </div>

          {/* Controls Menu */}
          {showControls && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '8px',
              zIndex: 20,
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
              minWidth: '200px'
            }}>
              {/* React Button */}
              <button
                onClick={() => setShowReactions(!showReactions)}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'var(--accent-light)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                😀 React
              </button>

              {/* Edit Button */}
              {canEdit() && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowControls(false);
                  }}
                  style={{
                    padding: '6px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    background: 'var(--accent-light)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✏️ Edit
                </button>
              )}

              {/* Delete Button */}
              {canDelete() && (
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '6px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#ffe6e6',
                    color: '#d63031',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🗑️ Delete
                </button>
              )}

              {/* Pin Button */}
              {canPin() && (
                <button
                  onClick={handlePin}
                  style={{
                    padding: '6px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    background: message.isPinned ? '#fff3cd' : 'var(--accent-light)',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  📌 {message.isPinned ? 'Unpin' : 'Pin'}
                </button>
              )}

              {/* Forward Button */}
              <button
                onClick={handleForward}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'var(--accent-light)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ↗️ Forward
              </button>

              {/* Quote Button */}
              <button
                onClick={handleQuote}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'var(--accent-light)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                💬 Quote
              </button>
            </div>
          )}

          {/* Reactions Panel */}
          {showReactions && (
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '0',
              background: 'white',
              borderRadius: '25px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '8px 12px',
              display: 'flex',
              gap: '8px',
              zIndex: 30
            }}>
              {commonEmojis.map(emoji => (
                <span
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  style={{
                    fontSize: '20px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {emoji}
                </span>
              ))}
            </div>
          )}

          {/* Click outside to close */}
          {(showControls || showReactions) && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 5
              }}
              onClick={() => {
                setShowControls(false);
                setShowReactions(false);
              }}
            />
          )}
        </>
      )}

      {/* Message Reactions Display */}
      {message.reactions && message.reactions.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '4px',
          marginTop: '4px',
          flexWrap: 'wrap'
        }}>
          {Object.entries(
            message.reactions.reduce((acc, reaction) => {
              const emoji = reaction.emoji;
              if (!acc[emoji]) acc[emoji] = [];
              acc[emoji].push(reaction.user);
              return acc;
            }, {})
          ).map(([emoji, users]) => (
            <span
              key={emoji}
              style={{
                background: 'rgba(255,255,255,0.8)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '12px',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
              title={users.map(u => u.name || u.email).join(', ')}
              onClick={() => handleReaction(emoji)}
            >
              {emoji} {users.length}
            </span>
          ))}
        </div>
      )}

      {/* Pinned Indicator */}
      {message.isPinned && (
        <div style={{
          position: 'absolute',
          top: '-12px',
          left: '-8px',
          background: '#ffc107',
          color: 'white',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          zIndex: 5
        }}>
          📌
        </div>
      )}

      {/* Edited Indicator */}
      {message.isEdited && (
        <div style={{
          fontSize: '10px',
          color: 'var(--text-light)',
          fontStyle: 'italic',
          marginTop: '2px'
        }}>
          (edited)
        </div>
      )}

      {/* Forwarded Indicator */}
      {message.isForwarded && (
        <div style={{
          fontSize: '10px',
          color: 'var(--text-light)',
          fontStyle: 'italic',
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ↗️ Forwarded
        </div>
      )}
    </div>
  );
};

export default MessageControls;

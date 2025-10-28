import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { useParams, Navigate } from 'react-router-dom';
import { getSocket } from '../socket';
import MediaUpload from '../components/MediaUpload';
import MediaMessages from '../components/MediaMessages';
import MessageControls from '../components/MessageControls';
import { useSelector } from 'react-redux';

export default function Chat({ currentUser }) {
  const { id: otherId } = useParams();
  const [messages, setMessages] = useState([]);
  const [other, setOther] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [quotedMessage, setQuotedMessage] = useState(null);
  const socket = getSocket();
  const endRef = useRef(null);
  
  const { contacts } = useSelector(state => state.contacts);

  // Keep only one set of useEffect hooks at the top
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/messages/${otherId}`);
        setMessages(res.data.messages || []);
        setOther(res.data.chatWith || null);
        if (socket) {
          const roomId = [String(currentUser?.id || currentUser?._id), String(otherId)].sort().join('_');
          socket.emit('joinRoom', roomId);
        }
      } catch (e) { /* ignore */ }
    })();
  }, [otherId, socket, currentUser]);

  useEffect(() => {
    if (!socket) return;

    const dedupeExists = (msg, prev) => {
      if (!msg) return false;
      // Skip temp messages for deduplication
      if (msg._id && msg._id.startsWith('temp-')) return false;
      if (msg._id) return prev.some(m => String(m._id) === String(msg._id));
      // Fallback: match by exact content + sender + timestamp (within 5 seconds)
      return prev.some(m => 
        m.message === msg.message && 
        String(m.sender?._id || m.sender) === String(msg.sender?._id || msg.sender) &&
        Math.abs(new Date(m.createdAt) - new Date(msg.createdAt)) < 5000
      );
    };

    const handleReceiveMessage = (data) => {
      const msg = data.message || data;
      if (!msg) return;
      
      // Only handle messages for this conversation
      const participants = [String(msg.sender?._id || msg.sender), String(msg.receiver?._id || msg.receiver)];
      if (!participants.includes(String(otherId))) return;
      
      setMessages(prev => {
        if (dedupeExists(msg, prev)) return prev;
        return [...prev, msg];
      });
    };

    // Server confirms saved message for sender
    const handleMessageDelivered = (payload) => {
      const msg = payload.message || payload.data || payload;
      if (!msg) return;
      
      // Only handle if part of this conversation
      const senderId = String(msg.sender?._id || msg.sender);
      const receiverId = String(msg.receiver?._id || msg.receiver);
      if (![senderId, receiverId].includes(String(otherId))) return;

      setMessages(prev => {
        // Remove matching pending temp messages
        const filtered = prev.filter(m => {
          if (m.pending) {
            const mSender = String(m.sender?._id || m.sender);
            const curSender = String(currentUser?.id || currentUser?._id);
            // Remove temp messages from this client that match content
            if (mSender === curSender && (
              m.message === msg.message || 
              (m.fileUrl && m.fileUrl === msg.fileUrl)
            )) {
              return false; // remove this temp message
            }
          }
          return true;
        });

        // Avoid adding duplicate if same _id already present
        if (msg._id && filtered.some(m => String(m._id) === String(msg._id))) {
          return filtered.map(m => 
            String(m._id) === String(msg._id) 
              ? { ...m, deliveredAt: new Date() }
              : m
          );
        }

        return [...filtered, { ...msg, deliveredAt: new Date() }];
      });
    };

    // Listen for message updates
    const handleMessageEdited = (data) => {
      setMessages((prev) => prev.map((m) => 
        m._id === data.messageId 
          ? { ...m, message: data.newContent, isEdited: true }
          : m
      ));
    };

    const handleMessageDeleted = (data) => {
      setMessages((prev) => prev.map((m) => 
        m._id === data.messageId 
          ? { ...m, isDeleted: true, message: 'This message was deleted' }
          : m
      ));
    };

    // Fix the message reaction handler
    const handleMessageReaction = (data) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId 
          ? { ...m, reactions: data.reactions }
          : m
      ));
    };

    // Fix the message pinned handler
    const handleMessagePinned = (data) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId 
          ? { ...m, isPinned: data.isPinned }
          : m
      ));
    };

    // Fix the message forwarded handler
    const handleMessageForwarded = (data) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId 
          ? { ...m, isForwarded: true }
          : m
      ));
    };

    const handleMessagesRead = (data) => {
      const { messageIds, readBy, readAt } = data;
      
      // Only update if the reader is the other person in this chat
      if (readBy === otherId) {
        setMessages(prev => prev.map(m => 
          messageIds.includes(m._id)
            ? { 
                ...m, 
                readStatus: { 
                  isRead: true, 
                  readAt: new Date(readAt) 
                }
              }
            : m
        ));
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('messageReaction', handleMessageReaction);
    socket.on('messagePinned', handleMessagePinned);
    socket.on('messageForwarded', handleMessageForwarded);
    socket.on('messagesRead', handleMessagesRead);

    // Remove newMessage handler as it causes duplicates
    // socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('messageReaction', handleMessageReaction);
      socket.off('messagePinned', handleMessagePinned);
      socket.off('messageForwarded', handleMessageForwarded);
      socket.off('messagesRead', handleMessagesRead);
      // leave the conversation room
      try {
        const roomId = [String(currentUser?.id || currentUser?._id), String(otherId)].sort().join('_');
        socket.emit('leaveRoom', roomId);
      } catch (e) { /* ignore */ }
    };
  }, [socket, otherId, currentUser]);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  // Replace the existing message reading effect
  useEffect(() => {
    const markMessagesAsRead = async () => {
      // Only proceed if:
      // 1. Messages exist
      // 2. User is actively viewing the chat
      // 3. This is the receiver's chat window
      if (
        messages.length > 0 && 
        document.visibilityState === 'visible' &&
        otherId === String(messages[0]?.sender?._id)  // Check if we're the receiver
      ) {
        const unreadMessages = messages.filter(m => 
          // Only mark messages from the other user that aren't read yet
          String(m.sender?._id) === otherId && 
          !m.readStatus?.isRead &&
          !m.pending &&
          m.deliveredAt
        );

        if (unreadMessages.length > 0) {
          try {
            const response = await api.post('/messages/mark-read', {
              messageIds: unreadMessages.map(m => m._id)
            });

            if (response.data.success) {
              // Update local state only after successful server update
              setMessages(prev => prev.map(m => 
                unreadMessages.find(um => um._id === m._id)
                  ? { 
                      ...m, 
                      readStatus: { 
                        isRead: true, 
                        readAt: new Date() 
                      }
                    }
                  : m
              ));

              // Notify sender through socket
              socket?.emit('messagesRead', {
                messageIds: unreadMessages.map(m => m._id),
                readBy: currentUser._id,
                readAt: new Date()
              });
            }
          } catch (error) {
            console.error('Failed to mark messages as read:', error);
          }
        }
      }
    };

    // Only mark as read when chat becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markMessagesAsRead();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial check when component mounts or messages update
    if (document.visibilityState === 'visible') {
      markMessagesAsRead();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [messages, currentUser._id, socket, otherId]);

  // Keep only one copy of these handler functions
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    
    setSending(true);
    try {
      if (socket) {
        // create optimistic temp message
        const tempMsg = {
          _id: `temp-${Date.now()}`,
          sender: { _id: currentUser.id || currentUser._id, name: currentUser.name },
          receiver: { _id: otherId },
          message: text,
          messageType: 'text',
          createdAt: new Date().toISOString(),
          pending: true
        };
        setMessages((prev) => [...prev, tempMsg]);

        socket.emit('sendMessage', { receiverId: otherId, message: text });
      } else {
        await api.post('/messages', { receiverId: otherId, message: text });
        const res = await api.get(`/messages/${otherId}`);
        setMessages(res.data.messages || []);
      }
      setText('');
    } catch (err) { 
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleMediaSend = (mediaMessage) => {
    console.log('📤 Media message received:', mediaMessage);
    
    if (socket) {
      // Create optimistic temp message for immediate UI feedback
      const tempMsg = {
        _id: `temp-${Date.now()}`,
        sender: { _id: currentUser.id || currentUser._id, name: currentUser.name },
        receiver: { _id: otherId },
        message: mediaMessage.message || '',
        messageType: mediaMessage.messageType,
        fileUrl: mediaMessage.fileUrl,
        fileName: mediaMessage.fileName,
        fileSize: mediaMessage.fileSize,
        mimeType: mediaMessage.mimeType,
        duration: mediaMessage.duration,
        dimensions: mediaMessage.dimensions,
        createdAt: new Date().toISOString(),
        pending: true
      };
      
      // Add temp message to UI
      setMessages((prev) => [...prev, tempMsg]);
      
      // Emit to socket (will be replaced by server response)
      socket.emit('sendMessage', {
        receiverId: otherId,
        message: mediaMessage.message || '',
        messageType: mediaMessage.messageType,
        fileUrl: mediaMessage.fileUrl,
        fileName: mediaMessage.fileName,
        fileSize: mediaMessage.fileSize,
        mimeType: mediaMessage.mimeType,
        duration: mediaMessage.duration,
        dimensions: mediaMessage.dimensions
      });
    } else {
      // Fallback: add to local state only if no socket
      setMessages((prev) => [...prev, mediaMessage]);
    }
  };

  const isContact = contacts?.some((contact) => 
    (contact._id || contact).toString() === otherId.toString()
  );

  if (!isContact) {
    return <Navigate to="/users" replace />;
  }
  
  // Message action handlers
  const handleMessageEdit = (messageId, newContent) => {
    setMessages((prev) => prev.map((m) => 
      m._id === messageId 
        ? { ...m, message: newContent, isEdited: true }
        : m
    ));
  };

  const handleMessageDelete = (messageId) => {
    setMessages((prev) => prev.map((m) => 
      m._id === messageId 
        ? { ...m, isDeleted: true, message: 'This message was deleted' }
        : m
    ));
  };

  const handleMessageReact = (messageId, emoji) => {
    // Real-time update will be handled by socket
  };

  const handleMessagePin = (messageId) => {
    // Real-time update will be handled by socket
  };

  const handleMessageQuote = (message) => {
    setQuotedMessage(message);
  };
  const handleMessageForward = async (message) => {
  try {
    if (socket) {
      socket.emit('messageForward', {
        messageId: message._id,
        originalSenderId: message.sender._id,
        forwardedBy: currentUser._id,
        originalMessage: message
      });
    }
  } catch (error) {
    console.error('Failed to forward message:', error);
  }
}; // Add missing closing brace and semicolon

  const sendQuotedMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending || !quotedMessage) return;
    
    setSending(true);
    try {
      await api.post('/messages/quote', {
        quotedMessageId: quotedMessage._id,
        receiverId: otherId,
        message: text
      });
      setText('');
      setQuotedMessage(null);
      // Refresh messages
      const res = await api.get(`/messages/${otherId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to send quoted message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="card">
        <h2>💬 Chat with {other?.name || 'User'}</h2>
        <p className="text-light">Have a great conversation!</p>
      </div>
      
      <div className="chat-window">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
            <h3>👋 Start the conversation!</h3>
            <p>Send a message to begin chatting</p>
          </div>
        ) : (
          messages.map((m) => {
            const senderId = String(m.sender?._id || m.sender);
            const mine = senderId === String(currentUser.id || currentUser._id);
            
            return (
              <div 
                key={m._id} 
                className={mine ? 'msg me' : 'msg'} 
                style={{ 
                  opacity: m.isDeleted ? 0.5 : 1
                }}
              >
                <div className="msg-content">
                  <div className="msg-text-wrapper">
                    {/* Quoted Message Display */}
                    {m.quotedMessage && (
                      <div style={{
                        background: 'rgba(0,0,0,0.1)',
                        padding: '8px',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        borderLeft: '3px solid var(--primary-medium)',
                        fontSize: '12px'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          Replying to: {m.quotedMessage.sender?.name || 'Unknown'}
                        </div>
                        <div style={{ fontStyle: 'italic' }}>
                          {m.quotedMessage.message || 'Media message'}
                        </div>
                      </div>
                    )}

                    {/* Message Content */}
                    {m.isDeleted ? (
                      <div className="msg-text" style={{ fontStyle: 'italic', color: 'var(--text-light)' }}>
                        This message was deleted
                      </div>
                    ) : m.messageType === 'text' || !m.messageType ? (
                      <div className="msg-text">{m.message}</div>
                    ) : (
                      <MediaMessages 
                        message={m} 
                        isSent={mine}
                        senderName={m.sender?.name || 'Unknown'}
                      />
                    )}
                    
                    <div className="msg-meta">
                      {new Date(m.createdAt || m.updatedAt || Date.now()).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {m.pending && <span style={{ marginLeft: '8px' }}>⏳</span>}
                    </div>
                  </div>

                  {/* Always Visible Message Controls */}
                  <div className="msg-controls-wrapper">
                    <MessageControls
                      message={m}
                      currentUser={currentUser}
                      onEdit={handleMessageEdit}
                      onDelete={handleMessageDelete}
                      onReact={handleMessageReact}
                      onPin={handleMessagePin}
                      onForward={handleMessageForward}
                      onQuote={handleMessageQuote}
                      isGroupChat={false}
                    />
                  </div>
                </div>

                {mine && (
                  <div 
                    className="read-status"
                    style={{
                      fontSize: '11px',
                      marginTop: '2px',
                      textAlign: 'right',
                      color: m.readStatus?.isRead ? 'var(--primary-medium)' : 'var(--text-light)'
                    }}
                  >
                    {m.pending ? (
                      <span title="Sending...">⏳ Sending</span>
                    ) : !m.deliveredAt ? (
                      <span title={`Sent at ${new Date(m.createdAt).toLocaleString()}`}>
                        ✓ Sent
                      </span>
                    ) : !m.readStatus?.isRead ? (
                      <span title={`Delivered at ${new Date(m.deliveredAt).toLocaleString()}`}>
                        ✓ Delivered
                      </span>
                    ) : (
                      <span title={`Read at ${new Date(m.readStatus.readAt).toLocaleString()}`}>
                        ✓✓ Read
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      
      <div style={{
        background: 'var(--white)',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px var(--shadow)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Quoted Message Preview */}
        {quotedMessage && (
          <div style={{
            background: 'var(--accent-light)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid var(--primary-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                Replying to: {quotedMessage.sender?.name || 'Unknown'}
              </div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                {quotedMessage.message || 'Media message'}
              </div>
            </div>
            <button
              onClick={() => setQuotedMessage(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'var(--text-light)'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Media Upload Buttons */}
        <MediaUpload 
          onSend={handleMediaSend}
          disabled={sending}
          receiverId={otherId}
        />
        
        {/* Text Message Form */}
        <form onSubmit={quotedMessage ? sendQuotedMessage : send} style={{ 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'flex-end'
        }}>
          <input 
            value={text} 
            onChange={e=>setText(e.target.value)} 
            placeholder={quotedMessage ? "💭 Reply to message..." : "💭 Type a message..."} 
            disabled={sending}

            style={{ 
              flex: 1, 
              margin: 0,
              borderRadius: '12px',
              fontSize: '16px'
            }}
          />
          <button 
            type="submit" 
            disabled={!text.trim() || sending}
            style={{ 
              margin: 0,
              minWidth: '80px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minWidth: '80px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: sending ? 0.6 : 1
            }}
          >
            {sending ? '⏳' : quotedMessage ? '↩️' : '✈️'} Send
          </button>
        </form>
      </div>
    </div>
  );
}
import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { useParams, Navigate } from 'react-router-dom';
import { getSocket } from '../socket';
import MediaUpload from '../components/MediaUpload';
import MediaMessages from '../components/MediaMessages';
import { useSelector } from 'react-redux';

export default function Chat({ currentUser }) {
  const { id: otherId } = useParams();
  const [messages, setMessages] = useState([]);
  const [other, setOther] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const socket = getSocket();
  const endRef = useRef(null);
  
  const { contacts } = useSelector(state => state.contacts);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/messages/${otherId}`);
        setMessages(res.data.messages || []);
        setOther(res.data.chatWith || null);
        // join the room for this conversation (enables multi-tab sync)
        if (socket) {
          const roomId = [String(currentUser?.id || currentUser?._id), String(otherId)].sort().join('_');
          socket.emit('joinRoom', roomId);
        }
      } catch (e) { /* ignore */ }
    })();
    // leave on unmount handled in cleanup below
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
        if (msg._id && filtered.some(m => String(m._id) === String(msg._id))) return filtered;

        return [...filtered, msg];
      });
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageDelivered', handleMessageDelivered);

    // Remove newMessage handler as it causes duplicates
    // socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageDelivered', handleMessageDelivered);
      // leave the conversation room
      try {
        const roomId = [String(currentUser?.id || currentUser?._id), String(otherId)].sort().join('_');
        socket.emit('leaveRoom', roomId);
      } catch (e) { /* ignore */ }
    };
  }, [socket, otherId, currentUser]);

  useEffect(()=> { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    
    setSending(true);
    try {
      // Use socket if available
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
        setMessages(prev => [...prev, tempMsg]);

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
      setMessages(prev => [...prev, tempMsg]);
      
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
      setMessages(prev => [...prev, mediaMessage]);
    }
  };

  const isContact = contacts?.some(contact => 
    (contact._id || contact).toString() === otherId.toString()
  );

  if (!isContact) {
    return <Navigate to="/users" replace />;
  }
  
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
          messages.map(m => {
            const senderId = String(m.sender?._id || m.sender);
            const mine = senderId === String(currentUser.id || currentUser._id);
            
            return (
              <div key={m._id} className={mine ? 'msg me' : 'msg'} style={{ animationDelay: '0.1s' }}>
                {/* Render different message types */}
                {m.messageType === 'text' || !m.messageType ? (
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
        {/* Media Upload Buttons */}
        <MediaUpload 
          onSend={handleMediaSend}
          disabled={sending}
          receiverId={otherId}
        />
        
        {/* Text Message Form */}
        <form onSubmit={send} style={{ 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'flex-end'
        }}>
          <input 
            value={text} 
            onChange={e=>setText(e.target.value)} 
            placeholder="💭 Type a message..." 
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
              opacity: sending ? 0.6 : 1
            }}
          >
            {sending ? '⏳' : '✈️'} Send
          </button>
        </form>
      </div>
    </div>
  );
}
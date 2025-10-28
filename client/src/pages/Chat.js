import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { useParams } from 'react-router-dom';
import { getSocket } from '../socket';

export default function Chat({ currentUser }) {
  const { id: otherId } = useParams();
  const [messages, setMessages] = useState([]);
  const [other, setOther] = useState(null);
  const [text, setText] = useState('');
  const socket = getSocket();
  const endRef = useRef(null);

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
      if (msg._id) return prev.some(m => String(m._id) === String(msg._id));
      // fallback: match by exact text + timestamp (best-effort)
      return prev.some(m => m.message === msg.message && String(m.sender?._id || m.sender) === String(msg.sender?._id || msg.sender));
    };

    const handleReceiveMessage = (data) => {
      const msg = data.message || data;
      if (!msg) return;
      if (!([String(msg.sender?._id || msg.sender), String(msg.receiver?._id || msg.receiver)].includes(String(otherId)))) return;
      setMessages(prev => {
        if (dedupeExists(msg, prev)) return prev;
        return [...prev, msg];
      });
    };

    const handleNewMessage = ({ message }) => {
      const msg = message || {};
      if (!([String(msg.sender?._id || msg.sender), String(msg.receiver?._id || msg.receiver)].includes(String(otherId)))) return;
      setMessages(prev => {
        if (dedupeExists(msg, prev)) return prev;
        return [...prev, msg];
      });
    };

    // server confirms saved message for sender
    const handleMessageDelivered = (payload) => {
      const msg = payload.message || payload.data || payload;
      if (!msg) return;
      // only handle if part of this conversation
      const senderId = String(msg.sender?._id || msg.sender);
      const receiverId = String(msg.receiver?._id || msg.receiver);
      if (![senderId, receiverId].includes(String(otherId))) return;

      setMessages(prev => {
        // Remove matching pending temp messages (match by pending flag + identical text + sender)
        const filtered = prev.filter(m => {
          if (m.pending && m.message === msg.message) {
            const mSender = String(m.sender?._id || m.sender);
            const curSender = String(currentUser?.id || currentUser?._id);
            // remove only pending messages created by this client
            if (mSender === curSender) return false; // drop this temp
          }
          return true;
        });

        // Avoid adding duplicate if same _id already present
        if (msg._id && filtered.some(m => String(m._id) === String(msg._id))) return filtered;

        return [...filtered, msg];
      });
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('newMessage', handleNewMessage);
    socket.on('messageDelivered', handleMessageDelivered);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('newMessage', handleNewMessage);
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
    if (!text.trim()) return;
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
    } catch (err) { /* ignore */ }
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
          messages.map(m => {
            const senderId = String(m.sender?._id || m.sender);
            const mine = senderId === String(currentUser.id || currentUser._id);
            return (
              <div key={m._id} className={mine ? 'msg me' : 'msg'} style={{ animationDelay: '0.1s' }}>
                <div className="msg-text">{m.message}</div>
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
      
      <form onSubmit={send} style={{ 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'flex-end',
        background: 'var(--white)',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px var(--shadow)',
        border: '1px solid var(--border-color)' 
      }}>
        <input 
          value={text} 
          onChange={e=>setText(e.target.value)} 
          placeholder="💭 Type a message..." 
          style={{ 
            flex: 1, 
            margin: 0,
            borderRadius: '12px',
            fontSize: '16px'
          }}
        />
        <button 
          type="submit" 
          disabled={!text.trim()}
          style={{ 
            margin: 0,
            minWidth: '80px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          ✈️ Send
        </button>
      </form>
    </div>
  );
}
import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { useParams, Link } from 'react-router-dom';
import { getSocket } from '../socket';

export default function GroupChat({ currentUser }) {
  const { id: groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socket = getSocket();
  const endRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/groups/${groupId}`);
        setGroup(res.data.group || res.data);
      } catch (e) { /* ignore */ }

      try {
        const res2 = await api.get(`/groups/${groupId}/messages`);
        setMessages(res2.data.messages || []);
        // join group room
        if (socket) socket.emit('joinGroup', groupId);
      } catch (e) { /* ignore */ }
    })();

    return () => {
      if (socket) socket.emit('leaveGroup', groupId);
    };
  }, [groupId, socket]);

  useEffect(() => {
    if (!socket) return;

    const dedupeExists = (msg, prev) => {
      if (!msg) return false;
      if (msg._id) return prev.some(m => String(m._id) === String(msg._id));
      return prev.some(m => m.message === msg.message && String(m.sender?._id || m.sender) === String(msg.sender?._id || msg.sender));
    };

    const handleReceive = (payload) => {
      if (payload?.groupId && String(payload.groupId) === String(groupId)) {
        const msg = payload.message || payload;
        setMessages(prev => {
          // replace pending temp messages from this client that match text
          const filtered = prev.filter(m => !(m.pending && m.message === msg.message && String(m.sender?._id || m.sender) === String(currentUser.id || currentUser._id)));
          if (dedupeExists(msg, filtered)) return filtered;
          return [...filtered, msg];
        });
      }
    };

    socket.on('receiveGroupMessage', handleReceive);

    return () => {
      socket.off('receiveGroupMessage', handleReceive);
    };
  }, [socket, groupId, currentUser]);

  useEffect(()=> { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    try {
      if (socket) {
        const tempMsg = {
          _id: `temp-${Date.now()}`,
          sender: { _id: currentUser.id || currentUser._id, name: currentUser.name },
          group: groupId,
          message: text,
          messageType: 'text',
          createdAt: new Date().toISOString(),
          pending: true
        };
        setMessages(prev => [...prev, tempMsg]);
        socket.emit('sendGroupMessage', { groupId, message: text });
      } else {
        await api.post(`/groups/${groupId}/messages`, { message: text });
        const res = await api.get(`/groups/${groupId}/messages`);
        setMessages(res.data.messages || []);
      }
      setText('');
    } catch (err) { /* ignore */ }
  };

  return (
    <div className="fade-in">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>🎯 {group?.name || 'Group Chat'}</h2>
            <p className="text-light">
              👥 {group?.members?.length || group?.memberCount || 0} members • Group conversation
            </p>
          </div>
          <Link to="/groups" style={{
            padding: '10px 20px',
            background: 'var(--accent-light)',
            color: 'var(--primary-medium)',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}>
            ← Back to Groups
          </Link>
        </div>
      </div>
      
      <div className="chat-window">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
            <h3>🎉 Welcome to the group!</h3>
            <p>Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map(m => {
            const senderId = String(m.sender?._id || m.sender);
            const mine = senderId === String(currentUser.id || currentUser._id);
            return (
              <div key={m._id} className={mine ? 'msg me' : 'msg'}>
                {!mine && (
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: 'var(--primary-medium)', 
                    marginBottom: '4px' 
                  }}>
                    👤 {m.sender?.name || m.sender?.user?.name || 'Unknown'}
                  </div>
                )}
                <div className="msg-text">{m.message}</div>
                <div className="msg-meta">
                  {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { 
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
          placeholder="💭 Message the group..." 
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
          🚀 Send
        </button>
      </form>
      
      {group?.members && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h4 style={{ color: 'var(--primary-dark)', marginBottom: '15px' }}>👥 Group Members</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {group.members.map((member, idx) => (
              <span key={idx} style={{ 
                background: 'var(--accent-light)', 
                color: 'var(--primary-medium)', 
                padding: '6px 12px', 
                borderRadius: '16px', 
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid var(--primary-light)'
              }}>
                {member.name || member.email || 'Member'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
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
    <div>
      <h2>Group: {group?.name || 'Group'}</h2>
      <div style={{ marginBottom: 8 }}>
        <Link to="/groups">← Back to groups</Link>
      </div>
      <div className="chat-window">
        {messages.map(m => {
          const senderId = String(m.sender?._id || m.sender);
          const mine = senderId === String(currentUser.id || currentUser._id);
          return (
            <div key={m._id} className={mine ? 'msg me' : 'msg'}>
              <div style={{ fontSize: 12, color: '#666' }}>{m.sender?.name || m.sender?.user?.name}</div>
              <div className="msg-text">{m.message}</div>
              <div className="msg-meta">{new Date(m.createdAt || Date.now()).toLocaleString()}{m.pending ? ' • sending…' : ''}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
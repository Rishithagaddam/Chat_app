import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { useParams, Link } from 'react-router-dom';
import { getSocket } from '../socket';
import MessageControls from '../components/MessageControls';
import GroupTabs from '../components/GroupTabs';
import AnnouncementCreator from '../components/AnnouncementCreator';
import PollCreator from '../components/PollCreator';
import GroupRoleManager from '../components/GroupRoleManager';
import MediaUpload from '../components/MediaUpload';
import MediaMessages from '../components/MediaMessages';

export default function GroupChat({ currentUser }) {
  const { id: groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [polls, setPolls] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [showAnnouncementCreator, setShowAnnouncementCreator] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const socket = getSocket();
  const endRef = useRef(null);

  // Load group data
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/groups/${groupId}`);
        setGroup(res.data.group || res.data);
      } catch (e) { console.error('Failed to load group:', e); }

      // Load messages
      try {
        const res2 = await api.get(`/groups/${groupId}/messages`);
        setMessages(res2.data.messages || []);
        if (socket) socket.emit('joinGroup', groupId);
      } catch (e) { console.error('Failed to load messages:', e); }

      // Load announcements
      try {
        const res3 = await api.get(`/announcements/group/${groupId}`);
        setAnnouncements(res3.data.announcements || []);
      } catch (e) { console.error('Failed to load announcements:', e); }

      // Load polls
      try {
        const res4 = await api.get(`/polls/group/${groupId}`);
        setPolls(res4.data.polls || []);
      } catch (e) { console.error('Failed to load polls:', e); }

      // Load media files
      try {
        const res5 = await api.get(`/messages/group/${groupId}/media`);
        setMediaFiles(res5.data.media || []);
      } catch (e) { console.error('Failed to load media:', e); }
    })();

    return () => {
      if (socket) socket.emit('leaveGroup', groupId);
    };
  }, [groupId, socket]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (payload) => {
      if (payload?.groupId && String(payload.groupId) === String(groupId)) {
        const msg = payload.message || payload;
        setMessages(prev => {
          const filtered = prev.filter(m => {
            if (m.pending && m.message === msg.message) {
              const mSender = String(m.sender?._id || m.sender);
              const curSender = String(currentUser.id || currentUser._id);
              if (mSender === curSender) return false;
            }
            return true;
          });
          
          if (msg._id && filtered.some(m => String(m._id) === String(msg._id))) return filtered;
          return [...filtered, msg];
        });
      }
    };

    // Message update handlers
    const handleMessageEdited = (data) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId 
          ? { ...m, message: data.newContent, isEdited: true }
          : m
      ));
    };

    const handleMessageDeleted = (data) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId 
          ? { ...m, isDeleted: true, message: 'This message was deleted' }
          : m
      ));
    };

    socket.on('receiveGroupMessage', handleReceive);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);

    return () => {
      socket.off('receiveGroupMessage', handleReceive);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
    };
  }, [socket, groupId, currentUser]);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

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
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleAnnouncementSuccess = (announcement) => {
    setAnnouncements(prev => [announcement, ...prev]);
    setShowAnnouncementCreator(false);
  };

  const handlePollSuccess = (poll) => {
    setPolls(prev => [poll, ...prev]);
    setShowPollCreator(false);
  };

  const handleVote = async (pollId, optionId) => {
    try {
      await api.post(`/polls/${pollId}/vote`, { optionId });
      // Refresh polls
      const res = await api.get(`/polls/group/${groupId}`);
      setPolls(res.data.polls || []);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleMediaSend = (mediaMessage) => {
    console.log('📤 Group media message received:', mediaMessage);
    
    if (socket) {
      // Create optimistic temp message for immediate UI feedback
      const tempMsg = {
        _id: `temp-${Date.now()}`,
        sender: { _id: currentUser.id || currentUser._id, name: currentUser.name },
        group: groupId,
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
      socket.emit('sendGroupMessage', {
        groupId,
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
      // Also refresh media files list
      loadMediaFiles();
    }
  };

  const loadMediaFiles = async () => {
    try {
      const res = await api.get(`/messages/group/${groupId}/media`);
      setMediaFiles(res.data.media || []);
    } catch (e) {
      console.error('Failed to load media:', e);
    }
  };

  // Listen for media refresh events
  useEffect(() => {
    const handleMediaRefresh = (event) => {
      if (event.detail.groupId === groupId) {
        loadMediaFiles();
      }
    };

    window.addEventListener('refreshGroupMedia', handleMediaRefresh);
    return () => {
      window.removeEventListener('refreshGroupMedia', handleMediaRefresh);
    };
  }, [groupId]);

  const canCreateAnnouncements = group?.members.some(m => 
    m.user._id === currentUser.id && 
    (m.role === 'admin' || m.role === 'moderator')
  ) || group?.admin._id === currentUser.id;

  const canCreatePolls = group?.settings?.allowPolls !== false;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <>
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
                      <div className="msg-content">
                        <div className="msg-text-wrapper">
                          {/* Always show sender name in group chats */}
                          <div style={{ 
                            fontSize: '12px', 
                            fontWeight: '600',
                            color: mine ? 'rgba(255,255,255,0.8)' : 'var(--primary-medium)', 
                            marginBottom: '4px' 
                          }}>
                            👤 {mine ? 'You' : (m.sender?.name || m.sender?.user?.name || 'Unknown')}
                          </div>

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
                            {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {m.pending && <span style={{ marginLeft: '8px' }}>⏳</span>}
                          </div>
                        </div>

                        <div className="msg-controls-wrapper">
                          <MessageControls
                            message={m}
                            currentUser={currentUser}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            onQuote={() => {}}
                            isGroupChat={true}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>
            
            {/* Message Input */}
            <div style={{
              background: 'var(--white)',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 8px 32px var(--shadow)',
              border: '1px solid var(--border-color)',
              marginTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Media Upload Buttons */}
              <MediaUpload 
                onSend={handleMediaSend}
                disabled={false}
                groupId={groupId}
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
                    borderRadius: '12px'
                  }}
                >
                  🚀 Send
                </button>
              </form>
            </div>
          </>
        );

      case 'announcements':
        return (
          <div>
            {canCreateAnnouncements && (
              <div style={{ marginBottom: '20px' }}>
                {!showAnnouncementCreator ? (
                  <button
                    onClick={() => setShowAnnouncementCreator(true)}
                    style={{
                      background: 'var(--primary-medium)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    📢 Create Announcement
                  </button>
                ) : (
                  <AnnouncementCreator
                    groupId={groupId}
                    onSuccess={handleAnnouncementSuccess}
                    onCancel={() => setShowAnnouncementCreator(false)}
                  />
                )}
              </div>
            )}

            <div>
              {announcements.length === 0 ? (
                <div className="card text-center">
                  <h3>📢 No Announcements</h3>
                  <p className="text-light">No announcements have been made yet.</p>
                </div>
              ) : (
                announcements.map(announcement => (
                  <div key={announcement._id} className="card" style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h4 style={{ color: 'var(--primary-dark)', margin: 0 }}>
                        {announcement.isPinned && '📌 '}{announcement.title}
                      </h4>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: 
                          announcement.priority === 'urgent' ? '#ff6b6b' :
                          announcement.priority === 'high' ? '#ff9f43' :
                          announcement.priority === 'medium' ? '#feca57' : '#48dbfb',
                        color: 'white'
                      }}>
                        {announcement.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <p style={{ marginBottom: '10px' }}>{announcement.content}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-light)' }}>
                      <span>By {announcement.author.name}</span>
                      <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'polls':
        return (
          <div>
            {canCreatePolls && (
              <div style={{ marginBottom: '20px' }}>
                {!showPollCreator ? (
                  <button
                    onClick={() => setShowPollCreator(true)}
                    style={{
                      background: 'var(--primary-medium)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    📊 Create Poll
                  </button>
                ) : (
                  <PollCreator
                    groupId={groupId}
                    onSuccess={handlePollSuccess}
                    onCancel={() => setShowPollCreator(false)}
                  />
                )}
              </div>
            )}

            <div>
              {polls.length === 0 ? (
                <div className="card text-center">
                  <h3>📊 No Polls</h3>
                  <p className="text-light">No polls have been created yet.</p>
                </div>
              ) : (
                polls.map(poll => (
                  <div key={poll._id} className="card" style={{ marginBottom: '15px' }}>
                    <h4 style={{ color: 'var(--primary-dark)', marginBottom: '10px' }}>
                      📊 {poll.title}
                    </h4>
                    
                    {poll.description && (
                      <p style={{ marginBottom: '15px', color: 'var(--text-light)' }}>
                        {poll.description}
                      </p>
                    )}

                    <div style={{ marginBottom: '15px' }}>
                      {(poll.results || poll.options || []).map((result) => (
                        <div key={result._id} style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>{result.text}</span>
                            <span style={{ fontWeight: '600' }}>
                              {result.voteCount || result.votes?.length || 0} votes ({result.percentage || 0}%)
                            </span>
                          </div>
                          
                          <div style={{
                            width: '100%',
                            height: '8px',
                            background: 'var(--border-color)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${result.percentage || 0}%`,
                              height: '100%',
                              background: 'var(--primary-medium)',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          
                          {!poll.hasVoted && (
                            <button
                              onClick={() => handleVote(poll._id, result._id)}
                              style={{
                                background: 'var(--accent-light)',
                                color: 'var(--primary-medium)',
                                border: '1px solid var(--primary-light)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                marginTop: '4px'
                              }}
                            >
                              Vote
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '12px', 
                      color: 'var(--text-light)' 
                    }}>
                      <span>By {poll.creator?.name || 'Unknown'}</span>
                      <span>Total votes: {poll.totalVotes || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'media':
        return (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--primary-dark)' }}>🖼️ Shared Media ({mediaFiles.length})</h4>
              <button
                onClick={loadMediaFiles}
                style={{
                  background: 'var(--accent-light)',
                  color: 'var(--primary-medium)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {mediaFiles.length === 0 ? (
              <div className="card text-center">
                <h3>🖼️ No Media Files</h3>
                <p className="text-light">No media files have been shared yet.</p>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '10px' }}>
                  Use the media upload buttons in the Chat tab to share photos, videos, and files.
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '15px' 
              }}>
                {mediaFiles.map(file => (
                  <div key={file._id} className="card" style={{ padding: '12px' }}>
                    {file.messageType === 'image' && (
                      <img 
                        src={file.fileUrl.startsWith('blob:') ? file.fileUrl : `http://localhost:5000${file.fileUrl}`}
                        alt={file.fileName}
                        style={{ 
                          width: '100%', 
                          height: '150px', 
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const fullUrl = file.fileUrl.startsWith('blob:') ? file.fileUrl : `http://localhost:5000${file.fileUrl}`;
                          window.open(fullUrl, '_blank');
                        }}
                      />
                    )}
                    
                    {file.messageType === 'video' && (
                      <video 
                        style={{ 
                          width: '100%', 
                          height: '150px', 
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        controls
                      >
                        <source src={file.fileUrl.startsWith('blob:') ? file.fileUrl : `http://localhost:5000${file.fileUrl}`} />
                      </video>
                    )}

                    {(file.messageType === 'audio' || file.messageType === 'file') && (
                      <div style={{
                        height: '150px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--accent-light)',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                          {file.messageType === 'audio' ? '🎵' : '📄'}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>
                          {file.fileName}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {file.fileName}
                      </div>
                      <div style={{ color: 'var(--text-light)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>👤 {file.sender.name}</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'members':
        return (
          <GroupRoleManager
            group={group}
            currentUser={currentUser}
            onUpdate={() => {
              // Refresh group data
              api.get(`/groups/${groupId}`).then(res => {
                setGroup(res.data.group || res.data);
              });
            }}
          />
        );

      default:
        return null;
    }
  };

  if (!group) {
    return (
      <div className="fade-in">
        <div className="card text-center">
          <h3>Loading group...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>🎯 {group.name}</h2>
            <p className="text-light">
              👥 {group.members?.length || 0} members • Group conversation
            </p>
          </div>
          <Link to="/groups" style={{
            padding: '10px 20px',
            background: 'var(--accent-light)',
            color: 'var(--primary-medium)',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}>
            ← Back to Groups
          </Link>
        </div>
      </div>

      <div className="card">
        <GroupTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          unreadCounts={{}}
        />
        
        {renderTabContent()}
      </div>
    </div>
  );
}
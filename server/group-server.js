const express = require('express');
const cors = require('cors');
const app = express();

// Store groups in memory
let groups = new Map();

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 Starting Group Chat Server...');

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server running!' });
});

// Create Group
app.post('/api/groups', (req, res) => {
  console.log('📝 POST /api/groups', req.body);
  
  const { name, members = [] } = req.body;
  const groupId = 'group_' + Date.now();
  
  const newGroup = {
    _id: groupId,
    name: name || 'New Group',
    description: '',
    admin: {
      _id: 'admin_user',
      name: 'Admin User',
      email: 'admin@example.com'
    },
    members: [
      {
        user: { _id: 'admin_user', name: 'Admin User', email: 'admin@example.com' },
        role: 'admin',
        joinedAt: new Date()
      },
      ...members.map((id, index) => ({
        user: { _id: id, name: `Member ${index + 1}`, email: `member${index + 1}@example.com` },
        role: 'member',
        joinedAt: new Date()
      }))
    ],
    memberCount: members.length + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };
  
  // Store the group
  groups.set(groupId, newGroup);
  
  console.log('✅ Group created:', groupId);
  console.log('📊 Total groups:', groups.size);
  
  res.status(201).json({ success: true, group: newGroup });
});

// Get All Groups
app.get('/api/groups', (req, res) => {
  console.log('📋 GET /api/groups');
  
  const allGroups = Array.from(groups.values());
  console.log('📊 Returning', allGroups.length, 'groups');
  
  res.json({ success: true, groups: allGroups });
});

// Get Specific Group
app.get('/api/groups/:groupId', (req, res) => {
  const { groupId } = req.params;
  console.log('🔍 GET /api/groups/' + groupId);
  
  const group = groups.get(groupId);
  
  if (!group) {
    console.log('❌ Group not found:', groupId);
    console.log('📊 Available groups:', Array.from(groups.keys()));
    return res.status(404).json({ 
      success: false, 
      message: 'Group not found',
      availableGroups: Array.from(groups.keys())
    });
  }
  
  console.log('✅ Group found:', group.name);
  res.json({ success: true, group });
});

// Get Group Messages
app.get('/api/groups/:groupId/messages', (req, res) => {
  const { groupId } = req.params;
  console.log('💬 GET /api/groups/' + groupId + '/messages');
  
  const group = groups.get(groupId);
  
  if (!group) {
    return res.status(404).json({ 
      success: false, 
      message: 'Group not found' 
    });
  }
  
  // Return sample messages with proper structure
  const messages = [
    {
      _id: 'msg1_' + Date.now(),
      message: `Welcome to ${group.name}! 🎉`,
      sender: {
        _id: 'admin_user',
        name: 'Admin User',
        email: 'admin@example.com'
      },
      group: groupId,
      messageType: 'text',
      createdAt: new Date(Date.now() - 300000),
      updatedAt: new Date(Date.now() - 300000)
    },
    {
      _id: 'msg2_' + Date.now(),
      message: 'This group chat is working perfectly! 💪',
      sender: {
        _id: 'member_1',
        name: 'Member 1', 
        email: 'member1@example.com'
      },
      group: groupId,
      messageType: 'text',
      createdAt: new Date(Date.now() - 120000),
      updatedAt: new Date(Date.now() - 120000)
    }
  ];
  
  console.log('✅ Returning', messages.length, 'messages');
  res.json({ success: true, messages });
});

// Get Group Announcements
app.get('/api/announcements/group/:groupId', (req, res) => {
  const { groupId } = req.params;
  console.log('📢 GET /api/announcements/group/' + groupId);
  
  const announcements = [
    {
      _id: 'ann_' + Date.now(),
      title: 'Welcome to the Group!',
      content: 'This is our first announcement. Feel free to share your thoughts and ideas here.',
      author: {
        _id: 'admin_user',
        name: 'Admin User',
        email: 'admin@example.com'
      },
      priority: 'high',
      isPinned: true,
      createdAt: new Date(Date.now() - 86400000) // 1 day ago
    }
  ];
  
  res.json({ success: true, announcements });
});

// Get Group Polls  
app.get('/api/polls/group/:groupId', (req, res) => {
  const { groupId } = req.params;
  console.log('📊 GET /api/polls/group/' + groupId);
  
  const polls = [
    {
      _id: 'poll_' + Date.now(),
      title: 'What should we discuss in our next meeting?',
      description: 'Help us decide the agenda for our upcoming group meeting.',
      creator: {
        _id: 'admin_user',
        name: 'Admin User',
        email: 'admin@example.com'
      },
      results: [
        {
          _id: 'opt1',
          text: 'Project Updates',
          voteCount: 5,
          percentage: 50
        },
        {
          _id: 'opt2',
          text: 'Budget Planning',
          voteCount: 3,
          percentage: 30
        },
        {
          _id: 'opt3',
          text: 'Team Building',
          voteCount: 2,
          percentage: 20
        }
      ],
      totalVotes: 10,
      hasVoted: false,
      createdAt: new Date(Date.now() - 43200000) // 12 hours ago
    }
  ];
  
  res.json({ success: true, polls });
});

// Get Group Media
app.get('/api/messages/group/:groupId/media', (req, res) => {
  const { groupId } = req.params;
  console.log('🖼️ GET /api/messages/group/' + groupId + '/media');
  
  const mediaFiles = [
    {
      _id: 'media1_' + Date.now(),
      messageType: 'image',
      fileName: 'sample-image.jpg',
      fileUrl: '/uploads/sample-image.jpg',
      sender: {
        _id: 'member_1',
        name: 'Member 1'
      },
      createdAt: new Date(Date.now() - 172800000) // 2 days ago
    }
  ];
  
  res.json({ success: true, media: mediaFiles });
});

// Send Message to Group
app.post('/api/groups/:groupId/messages', (req, res) => {
  const { groupId } = req.params;
  const { content } = req.body;
  console.log('📤 POST /api/groups/' + groupId + '/messages:', content);
  
  const group = groups.get(groupId);
  
  if (!group) {
    return res.status(404).json({ 
      success: false, 
      message: 'Group not found' 
    });
  }
  
  if (!content || !content.trim()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Message content required' 
    });
  }
  
  const message = {
    _id: 'msg_' + Date.now(),
    content: content.trim(),
    sender: {
      _id: 'current_user',
      name: 'You',
      email: 'you@example.com'
    },
    group: groupId,
    messageType: 'text',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log('✅ Message created:', message._id);
  res.status(201).json({ success: true, message });
});

// Dummy auth endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 POST /api/auth/login');
  res.json({
    success: true,
    user: { _id: 'current_user', name: 'Test User', email: 'test@example.com' },
    token: 'dummy_token'
  });
});

app.get('/api/users/contacts', (req, res) => {
  console.log('👥 GET /api/users/contacts');
  res.json({
    success: true,
    contacts: [
      { user: { _id: 'user1', name: 'Alice Johnson', email: 'alice@example.com' } },
      { user: { _id: 'user2', name: 'Bob Smith', email: 'bob@example.com' } },
      { user: { _id: 'user3', name: 'Carol Davis', email: 'carol@example.com' } }
    ]
  });
});

app.get('/api/users', (req, res) => {
  console.log('👤 GET /api/users');
  res.json({
    success: true,
    users: [
      { _id: 'user1', name: 'Alice Johnson', email: 'alice@example.com' },
      { _id: 'user2', name: 'Bob Smith', email: 'bob@example.com' },
      { _id: 'user3', name: 'Carol Davis', email: 'carol@example.com' }
    ]
  });
});

// Log all requests
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableRoutes: [
      'GET /api/groups',
      'POST /api/groups', 
      'GET /api/groups/:groupId',
      'GET /api/groups/:groupId/messages',
      'POST /api/groups/:groupId/messages'
    ]
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🎯 Server running on http://localhost:${PORT}`);
  console.log(`✨ Group chat functionality ready!`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /api/groups - Create group`);
  console.log(`   GET  /api/groups - List groups`);
  console.log(`   GET  /api/groups/:id - Get group details`);
  console.log(`   GET  /api/groups/:id/messages - Get messages`);
  console.log(`   POST /api/groups/:id/messages - Send message`);
  console.log(`   GET  /api/announcements/group/:id - Get announcements`);
  console.log(`   POST /api/announcements - Create announcement`);
  console.log(`   GET  /api/polls/group/:id - Get polls`);
  console.log(`   POST /api/polls - Create poll`);
  console.log(`   POST /api/polls/:id/vote - Vote on poll`);
  console.log(`   GET  /api/messages/group/:id/media - Get media files`);
});
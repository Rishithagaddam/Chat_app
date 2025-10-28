const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Import configurations and utilities
const connectDB = require('./config/database');
const { handleConnection } = require('./config/socket');
const authMiddleware = require('./middleware/authMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/contacts');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');
const pollRoutes = require('./routes/polls');
const announcementRoutes = require('./routes/announcements');
const mediaRoutes = require('./routes/media');
const profileRoutes = require('./routes/profile');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true
  },
  allowEIO3: true
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test route
app.get('/api/test-server', (req, res) => {
  res.json({ message: 'Server is updated and working', timestamp: new Date() });
});

// Debug route to check database connection and groups
app.get('/api/debug/groups', async (req, res) => {
  try {
    const Group = require('./models/Group');
    const groups = await Group.find({}).select('_id name admin createdAt').limit(10);
    res.json({ 
      success: true, 
      message: 'Debug info for groups',
      totalGroups: await Group.countDocuments({}),
      recentGroups: groups,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Debug endpoint failed', 
      error: error.message 
    });
  }
});

// Temporary debug route for development: list users (no auth)
app.get('/api/debug/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find({}).select('_id name email phoneNumber isOnline createdAt').limit(200);
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Debug users failed', error: error.message });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.path.includes('/groups/') && req.params) {
    console.log('Group request params:', req.params);
  }
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chat server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// API Routes
console.log('Registering API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/profile', profileRoutes);
console.log('✅ API routes registered');

// Handle Socket.IO connections
handleConnection(io);

// Make io accessible in routes
app.set('socketio', io);

// 404 handler
app.use((req, res) => {
  console.log(`404 ERROR: Route not found - ${req.method} ${req.path}`);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    requestedPath: req.path,
    availableRoutes: ['/api/auth', '/api/users', '/api/messages', '/api/groups']
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
🚀 Chat Server is running!
📱 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server URL: http://localhost:${PORT}
💾 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}
🔗 Socket.IO: Enabled
⚡ Ready to handle connections!
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { app, server, io };
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import configurations and utilities
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

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    // Default to local MongoDB if no URI provided
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatapp';
    
    console.log('🔄 Connecting to MongoDB...');
    console.log(`📍 URI: ${mongoURI.includes('@') ? mongoURI.split('@')[1] : mongoURI}`);
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(mongoURI, options);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Connected to: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\n💡 Troubleshooting Steps:');
    
    if (error.message.includes('Atlas')) {
      console.error('   🌐 MongoDB Atlas Issue:');
      console.error('   1. Go to https://cloud.mongodb.com');
      console.error('   2. Navigate to: Network Access → IP Access List');
      console.error('   3. Click "Add IP Address"');
      console.error('   4. Either add your current IP or use 0.0.0.0/0 (allow all - dev only)');
      console.error('   5. Wait 2-3 minutes for changes to propagate');
      console.error('\n   OR switch to local MongoDB:');
      console.error('   1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
      console.error('   2. Update .env: MONGODB_URI=mongodb://127.0.0.1:27017/chatapp');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('   🔧 Local MongoDB Issue:');
      console.error('   1. Make sure MongoDB is installed');
      console.error('   2. Start MongoDB service:');
      console.error('      Windows: net start MongoDB (as admin)');
      console.error('      Mac: brew services start mongodb-community');
      console.error('      Linux: sudo systemctl start mongod');
      console.error('   3. Or run: mongod --dbpath=/path/to/data');
    } else {
      console.error('   ⚠️  General MongoDB Issue:');
      console.error('   - Check your MONGODB_URI in .env file');
      console.error('   - Ensure MongoDB is running');
      console.error('   - Verify your credentials (if using Atlas)');
    }
    
    console.error('\n🔄 Attempting to use fallback local connection...');
    
    // Try fallback to local MongoDB
    if (process.env.MONGODB_URI !== 'mongodb://127.0.0.1:27017/chatapp') {
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/chatapp', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 3000,
        });
        console.log('✅ Connected to fallback local MongoDB');
        return;
      } catch (fallbackError) {
        console.error('❌ Fallback connection also failed');
      }
    }
    
    console.error('\n💥 Unable to connect to any MongoDB instance. Exiting...\n');
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Connect to database
connectDB();

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
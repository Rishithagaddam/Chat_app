const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const authMiddleware = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// Configure multer for voice uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const voiceDir = 'uploads/voice';
    try {
      await fs.mkdir(voiceDir, { recursive: true });
      cb(null, voiceDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `voice-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for voice messages
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio format. Only WebM, MP4, MP3, WAV, and OGG are allowed.'));
    }
  }
});

// @route   POST /api/voice/upload
// @desc    Upload voice message
// @access  Private
router.post('/upload', authMiddleware, upload.single('voice'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No voice file uploaded'
      });
    }

    const { receiverId, duration } = req.body;

    if (!receiverId) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create voice message
    const voiceMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      message: '', // Empty for voice messages
      messageType: 'voice',
      fileUrl: `/uploads/voice/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      duration: duration ? parseFloat(duration) : null
    });

    // Populate message
    const populatedMessage = await Message.findById(voiceMessage._id)
      .populate('sender', 'name email phoneNumber isOnline')
      .populate('receiver', 'name email phoneNumber isOnline');

    // Emit real-time event
    const io = req.app.get('socketio');
    if (io) {
      const { activeUsers } = require('../config/socket');
      const receiverSocket = activeUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit('receiveMessage', {
          message: populatedMessage
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Voice message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    console.error('Voice upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Voice file too large. Maximum size is 10MB.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload voice message'
    });
  }
});

// @route   GET /api/voice/messages
// @desc    Get voice messages
// @access  Private
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    // Find messages for the logged-in user
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
    .populate('sender', 'name email phoneNumber isOnline')
    .populate('receiver', 'name email phoneNumber isOnline')
    .sort({ createdAt: -1 }); // Newest first

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

module.exports = router;

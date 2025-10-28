const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createUploadMiddleware, getFileInfo } = require('../middleware/uploadMiddleware');
const imageProcessor = require('../utils/imageProcessor');
const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

/**
 * Upload and send image message
 * POST /api/media/upload/image
 */
router.post('/upload/image', authMiddleware, createUploadMiddleware('image'), async (req, res) => {
  try {
    const { receiverId, groupId, message: caption } = req.body;
    const file = req.file;
    
    // Validate recipients
    if (!receiverId && !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Either receiverId or groupId is required'
      });
    }

    if (receiverId && groupId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot specify both receiverId and groupId'
      });
    }

    // Process the image (compress and generate thumbnail)
    console.log('📸 Processing uploaded image...');
    const processingResult = await imageProcessor.processUploadedImage(file);
    
    // Get file information
    const fileInfo = getFileInfo(file, 'image');
    
    // Create message object
    const messageData = {
      sender: req.user._id,
      messageType: 'image',
      message: caption || '', // Optional caption
      fileUrl: fileInfo.url,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      dimensions: processingResult.compression.dimensions,
      thumbnailUrl: processingResult.thumbnailUrl
    };

    // Set recipient
    if (receiverId) {
      messageData.receiver = receiverId;
      
      // Verify receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: 'Receiver not found'
        });
      }
    } else {
      messageData.group = groupId;
      
      // Verify group exists and user is a member
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }
      
      const isMember = group.members.some(member => 
        member.user.toString() === req.user._id.toString()
      );
      
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group'
        });
      }
    }

    // Save message to database
    const newMessage = new Message(messageData);
    await newMessage.save();
    
    // Populate sender information
    await newMessage.populate('sender', 'name email');
    if (receiverId) {
      await newMessage.populate('receiver', 'name email');
    }

    // Emit real-time event
    const io = req.app.get('socketio');
    if (io) {
      if (receiverId) {
        // Direct message
        const roomId = [req.user._id.toString(), receiverId].sort().join('_');
        io.to(roomId).emit('receiveMessage', newMessage);
      } else {
        // Group message
        io.to(groupId).emit('receiveGroupMessage', {
          groupId,
          message: newMessage
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Image uploaded and sent successfully',
      data: {
        message: newMessage,
        processing: {
          compressionRatio: processingResult.compression.compressionRatio,
          originalSize: processingResult.compression.originalSize,
          compressedSize: processingResult.compression.compressedSize
        }
      }
    });

  } catch (error) {
    console.error('❌ Image upload failed:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: error.message
    });
  }
});

/**
 * Upload and send audio message
 * POST /api/media/upload/audio
 */
router.post('/upload/audio', authMiddleware, createUploadMiddleware('audio'), async (req, res) => {
  try {
    const { receiverId, groupId, duration } = req.body;
    const file = req.file;
    
    // Validation
    if (!receiverId && !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Either receiverId or groupId is required'
      });
    }

    const fileInfo = getFileInfo(file, 'audio');
    
    const messageData = {
      sender: req.user._id,
      messageType: 'audio',
      fileUrl: fileInfo.url,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      duration: parseFloat(duration) || 0
    };

    // Set recipient and validate
    if (receiverId) {
      messageData.receiver = receiverId;
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ success: false, message: 'Receiver not found' });
      }
    } else {
      messageData.group = groupId;
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
    }

    const newMessage = new Message(messageData);
    await newMessage.save();
    await newMessage.populate('sender', 'name email');

    // Real-time notification
    const io = req.app.get('socketio');
    if (io) {
      if (receiverId) {
        const roomId = [req.user._id.toString(), receiverId].sort().join('_');
        io.to(roomId).emit('receiveMessage', newMessage);
      } else {
        io.to(groupId).emit('receiveGroupMessage', { groupId, message: newMessage });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Audio uploaded and sent successfully',
      data: { message: newMessage }
    });

  } catch (error) {
    console.error('❌ Audio upload failed:', error);
    res.status(500).json({
      success: false,
      message: 'Audio upload failed',
      error: error.message
    });
  }
});

/**
 * Upload and send voice message
 * POST /api/media/upload/voice
 */
router.post('/upload/voice', authMiddleware, createUploadMiddleware('voice'), async (req, res) => {
  try {
    const { receiverId, groupId, duration } = req.body;
    const file = req.file;
    
    if (!receiverId && !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Either receiverId or groupId is required'
      });
    }

    const fileInfo = getFileInfo(file, 'voice');
    
    const messageData = {
      sender: req.user._id,
      messageType: 'voice',
      fileUrl: fileInfo.url,
      fileName: `voice_${Date.now()}.webm`, // Standard name for voice messages
      fileSize: file.size,
      mimeType: file.mimetype,
      duration: parseFloat(duration) || 0
    };

    // Set recipient
    if (receiverId) {
      messageData.receiver = receiverId;
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ success: false, message: 'Receiver not found' });
      }
    } else {
      messageData.group = groupId;
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
    }

    const newMessage = new Message(messageData);
    await newMessage.save();
    await newMessage.populate('sender', 'name email');

    // Real-time notification
    const io = req.app.get('socketio');
    if (io) {
      if (receiverId) {
        const roomId = [req.user._id.toString(), receiverId].sort().join('_');
        io.to(roomId).emit('receiveMessage', newMessage);
      } else {
        io.to(groupId).emit('receiveGroupMessage', { groupId, message: newMessage });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Voice message sent successfully',
      data: { message: newMessage }
    });

  } catch (error) {
    console.error('❌ Voice upload failed:', error);
    res.status(500).json({
      success: false,
      message: 'Voice message upload failed',
      error: error.message
    });
  }
});

/**
 * Upload and send video message
 * POST /api/media/upload/video
 */
router.post('/upload/video', authMiddleware, createUploadMiddleware('video'), async (req, res) => {
  try {
    const { receiverId, groupId, duration, message: caption } = req.body;
    const file = req.file;
    
    if (!receiverId && !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Either receiverId or groupId is required'
      });
    }

    const fileInfo = getFileInfo(file, 'video');
    
    // Generate video thumbnail (placeholder for now)
    const thumbnailPath = path.join('uploads/thumbnails', `${path.parse(file.filename).name}_thumb.png`);
    const thumbnailResult = await imageProcessor.generateVideoThumbnail(file.path, thumbnailPath);
    
    const messageData = {
      sender: req.user._id,
      messageType: 'video',
      message: caption || '',
      fileUrl: fileInfo.url,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      duration: parseFloat(duration) || 0,
      thumbnailUrl: `/uploads/thumbnails/${path.basename(thumbnailPath)}`
    };

    // Set recipient
    if (receiverId) {
      messageData.receiver = receiverId;
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ success: false, message: 'Receiver not found' });
      }
    } else {
      messageData.group = groupId;
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
    }

    const newMessage = new Message(messageData);
    await newMessage.save();
    await newMessage.populate('sender', 'name email');

    // Real-time notification
    const io = req.app.get('socketio');
    if (io) {
      if (receiverId) {
        const roomId = [req.user._id.toString(), receiverId].sort().join('_');
        io.to(roomId).emit('receiveMessage', newMessage);
      } else {
        io.to(groupId).emit('receiveGroupMessage', { groupId, message: newMessage });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Video uploaded and sent successfully',
      data: { message: newMessage }
    });

  } catch (error) {
    console.error('❌ Video upload failed:', error);
    res.status(500).json({
      success: false,
      message: 'Video upload failed',
      error: error.message
    });
  }
});

/**
 * Upload and send file (documents, PDFs, etc.)
 * POST /api/media/upload/file
 */
router.post('/upload/file', authMiddleware, createUploadMiddleware('file'), async (req, res) => {
  try {
    const { receiverId, groupId, message: caption } = req.body;
    const file = req.file;
    
    if (!receiverId && !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Either receiverId or groupId is required'
      });
    }

    const fileInfo = getFileInfo(file, 'file');
    
    const messageData = {
      sender: req.user._id,
      messageType: 'file',
      message: caption || '',
      fileUrl: fileInfo.url,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    };

    // Set recipient
    if (receiverId) {
      messageData.receiver = receiverId;
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ success: false, message: 'Receiver not found' });
      }
    } else {
      messageData.group = groupId;
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
    }

    const newMessage = new Message(messageData);
    await newMessage.save();
    await newMessage.populate('sender', 'name email');

    // Real-time notification
    const io = req.app.get('socketio');
    if (io) {
      if (receiverId) {
        const roomId = [req.user._id.toString(), receiverId].sort().join('_');
        io.to(roomId).emit('receiveMessage', newMessage);
      } else {
        io.to(groupId).emit('receiveGroupMessage', { groupId, message: newMessage });
      }
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded and sent successfully',
      data: { message: newMessage }
    });

  } catch (error) {
    console.error('❌ File upload failed:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
});

/**
 * Get file info (for previews)
 * GET /api/media/info/:messageId
 */
router.get('/info/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId)
      .populate('sender', 'name email')
      .populate('receiver', 'name email');
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user has access to this message
    const userId = req.user._id.toString();
    const hasAccess = message.sender._id.toString() === userId ||
                     (message.receiver && message.receiver._id.toString() === userId) ||
                     (message.group && await Group.findOne({ 
                       _id: message.group, 
                       'members.user': userId 
                     }));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        messageId: message._id,
        messageType: message.messageType,
        fileName: message.fileName,
        fileSize: message.fileSize,
        mimeType: message.mimeType,
        fileUrl: message.fileUrl,
        thumbnailUrl: message.thumbnailUrl,
        dimensions: message.dimensions,
        duration: message.duration
      }
    });

  } catch (error) {
    console.error('❌ Failed to get file info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file info'
    });
  }
});

module.exports = router;
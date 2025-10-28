const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/messages/:userId
// @desc    Get all messages between current user and another user
// @access  Private
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if the other user exists
    const otherUser = await User.findById(userId).select('-password');
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if users are contacts
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.contacts.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only chat with users in your contacts'
      });
    }

    // Get messages between current user and the specified user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'name email phoneNumber isOnline')
    .populate('receiver', 'name email phoneNumber isOnline')
    .sort({ createdAt: 1 }); // Sort by creation time (oldest first)

    // Mark messages as read where current user is the receiver
    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      count: messages.length,
      chatWith: otherUser,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
});

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      receiverId, 
      message, 
      messageType = 'text',
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      duration,
      dimensions
    } = req.body;
    const senderId = req.user._id;

    // Validation
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required'
      });
    }

    // For text messages, message is required
    // For media messages, fileUrl is required
    if (messageType === 'text' && !message) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required for text messages'
      });
    }

    if (['image', 'audio', 'video', 'file', 'voice'].includes(messageType) && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required for media messages'
      });
    }

    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create message data
    const messageData = {
      sender: senderId,
      receiver: receiverId,
      message: message ? message.trim() : '',
      messageType
    };

    // Add media-specific fields
    if (fileUrl) messageData.fileUrl = fileUrl;
    if (fileName) messageData.fileName = fileName;
    if (fileSize) messageData.fileSize = fileSize;
    if (mimeType) messageData.mimeType = mimeType;
    if (duration) messageData.duration = duration;
    if (dimensions) messageData.dimensions = dimensions;

    // Create new message
    const newMessage = await Message.create(messageData);

    // Populate sender and receiver information
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name email phoneNumber isOnline')
      .populate('receiver', 'name email phoneNumber isOnline');

    // Emit real-time event if socket.io is available
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
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid receiver ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Get unique conversations (users who have messaged with current user)
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', currentUserId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', currentUserId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            phoneNumber: '$user.phoneNumber',
            isOnline: '$user.isOnline',
            lastSeen: '$user.lastSeen'
          },
          lastMessage: '$lastMessage',
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations'
    });
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        receiver: currentUserId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    ).populate('sender', 'name email phoneNumber')
     .populate('receiver', 'name email phoneNumber');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or already read'
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while marking message as read'
    });
  }
});

// @route   GET /api/messages/group/:groupId
// @desc    Get all messages in a group
// @access  Private
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user._id;

    // Check if group exists and user is a member
    const Group = require('../models/Group');
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.isMember(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Get messages for this group
    const messages = await Message.find({
      group: groupId
    })
    .populate('sender', 'name email phoneNumber isOnline')
    .populate('isRead.user', 'name')
    .sort({ createdAt: 1 });

    // Mark messages as read by current user
    await Message.updateMany(
      {
        group: groupId,
        sender: { $ne: currentUserId },
        'isRead.user': { $ne: currentUserId }
      },
      {
        $addToSet: {
          isRead: { user: currentUserId }
        }
      }
    );

    res.json({
      success: true,
      count: messages.length,
      group: group,
      messages
    });
  } catch (error) {
    console.error('Get group messages error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching group messages'
    });
  }
});

// @route   GET /api/messages/group/:groupId/media
// @desc    Get media files for a group
// @access  Private
router.get('/group/:groupId/media', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if group exists and user is a member
    const Group = require('../models/Group');
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Get media messages for this group
    const mediaMessages = await Message.find({
      group: groupId,
      messageType: { $in: ['image', 'video', 'audio', 'file'] },
      isDeleted: false
    })
    .populate('sender', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: mediaMessages.length,
      media: mediaMessages
    });
  } catch (error) {
    console.error('Get group media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group media'
    });
  }
});

// @route   POST /api/messages/group
// @desc    Send a message to a group
// @access  Private
router.post('/group', authMiddleware, async (req, res) => {
  try {
    const { groupId, message, messageType = 'text' } = req.body;
    const senderId = req.user._id;

    // Validation
    if (!groupId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Group ID and message are required'
      });
    }

    // Check if group exists and user is a member
    const Group = require('../models/Group');
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.isMember(senderId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Create message
    const newMessage = new Message({
      sender: senderId,
      group: groupId,
      message: message.trim(),
      messageType,
      isRead: [{ user: senderId }] // Mark as read by sender
    });

    await newMessage.save();

    // Update group's updatedAt timestamp
    group.updatedAt = new Date();
    await group.save();

    // Populate the message for response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name email phoneNumber isOnline')
      .populate('group', 'name');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send group message error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

// @route   PUT /api/messages/:messageId/edit
// @desc    Edit a message (within time limit)
// @access  Private
router.put('/:messageId/edit', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message: newContent } = req.body;
    const userId = req.user._id;

    if (!newContent || !newContent.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (!message.canEdit(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit this message. Edit time limit exceeded or insufficient permissions.'
      });
    }

    message.editMessage(newContent.trim());
    await message.save();

    await message.populate('sender', 'name email');

    // Emit real-time update
    const io = req.app.get('socketio');
    if (io) {
      if (message.receiver) {
        const roomId = [message.sender._id.toString(), message.receiver.toString()].sort().join('_');
        io.to(roomId).emit('messageEdited', { messageId, newContent: message.message, isEdited: true });
      } else if (message.group) {
        io.to(message.group.toString()).emit('messageEdited', { 
          messageId, 
          newContent: message.message, 
          isEdited: true 
        });
      }
    }

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while editing message'
    });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message (soft delete)
// @access  Private
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (!message.canDelete(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete this message. Insufficient permissions.'
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;
    await message.save();

    // Emit real-time update
    const io = req.app.get('socketio');
    if (io) {
      if (message.receiver) {
        const roomId = [message.sender._id.toString(), message.receiver.toString()].sort().join('_');
        io.to(roomId).emit('messageDeleted', { messageId });
      } else if (message.group) {
        io.to(message.group.toString()).emit('messageDeleted', { messageId });
      }
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
});

// @route   POST /api/messages/:messageId/react
// @desc    Add or remove reaction to a message
// @access  Private
router.post('/:messageId/react', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(r => 
      r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.removeReaction(userId, emoji);
    } else {
      // Add reaction
      message.addReaction(userId, emoji);
    }

    await message.save();
    await message.populate('reactions.user', 'name');

    // Emit real-time update
    const io = req.app.get('socketio');
    if (io) {
      const reactionData = { 
        messageId, 
        reactions: message.reactions,
        userId,
        emoji,
        action: existingReaction ? 'removed' : 'added'
      };
      
      if (message.receiver) {
        const roomId = [message.sender._id.toString(), message.receiver.toString()].sort().join('_');
        io.to(roomId).emit('messageReaction', reactionData);
      } else if (message.group) {
        io.to(message.group.toString()).emit('messageReaction', reactionData);
      }
    }

    res.json({
      success: true,
      message: existingReaction ? 'Reaction removed' : 'Reaction added',
      data: { reactions: message.reactions }
    });
  } catch (error) {
    console.error('Message reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing reaction'
    });
  }
});

// @route   POST /api/messages/:messageId/pin
// @desc    Pin or unpin a message
// @access  Private
router.post('/:messageId/pin', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check permissions - only group admins or message sender can pin
    if (message.group) {
      const Group = require('../models/Group');
      const group = await Group.findById(message.group);
      if (!group || (group.admin.toString() !== userId.toString() && message.sender.toString() !== userId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Only group admins or message senders can pin messages'
        });
      }
    }

    // Toggle pin status
    message.isPinned = !message.isPinned;
    if (message.isPinned) {
      message.pinnedBy = userId;
      message.pinnedAt = new Date();
    } else {
      message.pinnedBy = undefined;
      message.pinnedAt = undefined;
    }

    await message.save();

    // Emit real-time update
    const io = req.app.get('socketio');
    if (io) {
      const pinData = { 
        messageId, 
        isPinned: message.isPinned,
        pinnedBy: userId,
        pinnedAt: message.pinnedAt
      };
      
      if (message.receiver) {
        const roomId = [message.sender._id.toString(), message.receiver.toString()].sort().join('_');
        io.to(roomId).emit('messagePinned', pinData);
      } else if (message.group) {
        io.to(message.group.toString()).emit('messagePinned', pinData);
      }
    }

    res.json({
      success: true,
      message: message.isPinned ? 'Message pinned' : 'Message unpinned',
      data: { isPinned: message.isPinned }
    });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while pinning message'
    });
  }
});

// @route   POST /api/messages/:messageId/forward
// @desc    Forward a message to another user/group
// @access  Private
router.post('/:messageId/forward', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { receiverId, groupId } = req.body;
    const userId = req.user._id;

    if (!receiverId && !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Either receiverId or groupId is required'
      });
    }

    const originalMessage = await Message.findById(messageId).populate('sender', 'name');
    if (!originalMessage || originalMessage.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Create forwarded message
    const forwardedMessage = new Message({
      sender: userId,
      receiver: receiverId,
      group: groupId,
      message: originalMessage.message,
      messageType: originalMessage.messageType,
      fileUrl: originalMessage.fileUrl,
      fileName: originalMessage.fileName,
      fileSize: originalMessage.fileSize,
      mimeType: originalMessage.mimeType,
      duration: originalMessage.duration,
      dimensions: originalMessage.dimensions,
      thumbnailUrl: originalMessage.thumbnailUrl,
      isForwarded: true,
      forwardedFrom: messageId
    });

    await forwardedMessage.save();
    await forwardedMessage.populate('sender', 'name email');

    // Emit real-time event
    const io = req.app.get('socketio');
    if (io) {
      if (receiverId) {
        const roomId = [userId.toString(), receiverId].sort().join('_');
        io.to(roomId).emit('receiveMessage', forwardedMessage);
      } else if (groupId) {
        io.to(groupId).emit('receiveGroupMessage', {
          groupId,
          message: forwardedMessage
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message forwarded successfully',
      data: forwardedMessage
    });
  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while forwarding message'
    });
  }
});

// @route   POST /api/messages/quote
// @desc    Send a message quoting another message
// @access  Private
router.post('/quote', authMiddleware, async (req, res) => {
  try {
    const { quotedMessageId, receiverId, groupId, message } = req.body;
    const userId = req.user._id;

    if (!receiverId && !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Either receiverId or groupId is required'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const quotedMessage = await Message.findById(quotedMessageId);
    if (!quotedMessage || quotedMessage.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Quoted message not found'
      });
    }

    // Create new message with quote
    const newMessage = new Message({
      sender: userId,
      receiver: receiverId,
      group: groupId,
      message: message.trim(),
      messageType: 'text',
      quotedMessage: quotedMessageId
    });

    await newMessage.save();
    await newMessage.populate('sender', 'name email');
    await newMessage.populate('quotedMessage');

    // Emit real-time event
    const io = req.app.get('socketio');
    if (io) {
      if (receiverId) {
        const roomId = [userId.toString(), receiverId].sort().join('_');
        io.to(roomId).emit('receiveMessage', newMessage);
      } else if (groupId) {
        io.to(groupId).emit('receiveGroupMessage', {
          groupId,
          message: newMessage
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Quoted message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Quote message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending quoted message'
    });
  }
});

// @route   GET /api/messages/:chatId/pinned
// @desc    Get pinned messages for a chat/group
// @access  Private
router.get('/:chatId/pinned', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { type } = req.query; // 'direct' or 'group'
    const userId = req.user._id;

    let query = { isPinned: true, isDeleted: false };

    if (type === 'group') {
      query.group = chatId;
    } else {
      query.$or = [
        { sender: userId, receiver: chatId },
        { sender: chatId, receiver: userId }
      ];
    }

    const pinnedMessages = await Message.find(query)
      .populate('sender', 'name email')
      .populate('pinnedBy', 'name')
      .sort({ pinnedAt: -1 });

    res.json({
      success: true,
      count: pinnedMessages.length,
      data: pinnedMessages
    });
  } catch (error) {
    console.error('Get pinned messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pinned messages'
    });
  }
});

// Mark messages as read
router.post('/mark-read', authMiddleware, async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user._id;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }

    // Update all messages
    const updatedMessages = await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId,
        'readStatus.isRead': false
      },
      {
        $set: {
          'readStatus.isRead': true,
          'readStatus.readAt': new Date()
        }
      }
    );

    // Get the updated messages for socket event
    const messages = await Message.find({ _id: { $in: messageIds }})
      .populate('sender', 'name');

    // Emit socket event to notify senders
    const io = req.app.get('socketio');
    if (io) {
      messages.forEach(msg => {
        const senderId = msg.sender._id.toString();
        io.to(`user_${senderId}`).emit('messageRead', {
          messageId: msg._id,
          readBy: userId,
          readAt: new Date()
        });
      });
    }

    res.json({
      success: true,
      message: 'Messages marked as read',
      count: updatedMessages.modifiedCount
    });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking messages as read'
    });
  }
});

module.exports = router;
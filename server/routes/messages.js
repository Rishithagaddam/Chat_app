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
        isRead: true,
        readAt: new Date()
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
    const { receiverId, message, messageType = 'text' } = req.body;
    const senderId = req.user._id;

    // Validation
    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message are required'
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

    // Create new message
    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      message: message.trim(),
      messageType
    });

    // Populate sender and receiver information
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name email phoneNumber isOnline')
      .populate('receiver', 'name email phoneNumber isOnline');

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

module.exports = router;
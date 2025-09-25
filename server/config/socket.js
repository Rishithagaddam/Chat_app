const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Store active users and their socket IDs
const activeUsers = new Map();

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

const handleConnection = (io) => {
  // Authentication middleware for socket connections
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);

    // Store user's socket ID
    activeUsers.set(userId, {
      socketId: socket.id,
      user: socket.user
    });

    // Update user's online status
    try {
      await User.findByIdAndUpdate(userId, { 
        isOnline: true,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error updating user online status:', error);
    }

    // Broadcast user's online status to all connected users
    socket.broadcast.emit('userOnline', {
      userId,
      user: socket.user,
      isOnline: true
    });

    // Send list of online users to the newly connected user
    const onlineUsersList = Array.from(activeUsers.values()).map(({ user }) => ({
      userId: user._id,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isOnline: true
      }
    }));

    socket.emit('onlineUsers', onlineUsersList);

    // Handle joining a room (conversation)
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.user.name} joined room: ${roomId}`);
    });

    // Handle leaving a room
    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.user.name} left room: ${roomId}`);
    });

    // Handle sending messages
    socket.on('sendMessage', async (data) => {
      try {
        const { receiverId, message, messageType = 'text' } = data;

        // Validation
        if (!receiverId || !message) {
          socket.emit('messageError', {
            error: 'Receiver ID and message are required'
          });
          return;
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit('messageError', {
            error: 'Receiver not found'
          });
          return;
        }

        // Save message to database
        const newMessage = await Message.create({
          sender: userId,
          receiver: receiverId,
          message: message.trim(),
          messageType
        });

        // Populate sender and receiver information
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'name email phoneNumber isOnline')
          .populate('receiver', 'name email phoneNumber isOnline');

        // Send message to sender (confirmation)
        socket.emit('messageDelivered', {
          success: true,
          message: populatedMessage
        });

        // Send message to receiver if they are online
        const receiverSocket = activeUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('receiveMessage', {
            message: populatedMessage
          });
        }

        // Create room ID for this conversation (consistent ordering)
        const roomId = [userId, receiverId].sort().join('_');
        
        // Broadcast to room (for multiple devices/tabs)
        socket.to(roomId).emit('newMessage', {
          message: populatedMessage
        });

        console.log(`Message sent from ${socket.user.name} to ${receiver.name}`);
      } catch (error) {
        console.error('Error handling sendMessage:', error);
        socket.emit('messageError', {
          error: 'Failed to send message'
        });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { receiverId, isTyping } = data;
      const receiverSocket = activeUsers.get(receiverId);
      
      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit('userTyping', {
          userId,
          user: socket.user,
          isTyping
        });
      }
    });

    // Handle message read receipts
    socket.on('markMessageRead', async (data) => {
      try {
        const { messageId } = data;
        
        const message = await Message.findOneAndUpdate(
          {
            _id: messageId,
            receiver: userId,
            isRead: false
          },
          {
            isRead: true,
            readAt: new Date()
          },
          { new: true }
        );

        if (message) {
          // Notify sender that message was read
          const senderSocket = activeUsers.get(message.sender.toString());
          if (senderSocket) {
            io.to(senderSocket.socketId).emit('messageRead', {
              messageId,
              readBy: userId,
              readAt: message.readAt
            });
          }
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle joining a group room
    socket.on('joinGroup', (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`User ${socket.user.name} joined group: ${groupId}`);
    });

    // Handle leaving a group room
    socket.on('leaveGroup', (groupId) => {
      socket.leave(`group_${groupId}`);
      console.log(`User ${socket.user.name} left group: ${groupId}`);
    });

    // Handle sending group messages
    socket.on('sendGroupMessage', async (data) => {
      try {
        const { groupId, message, messageType = 'text' } = data;

        // Validation
        if (!groupId || !message) {
          socket.emit('messageError', {
            error: 'Group ID and message are required'
          });
          return;
        }

        // Check if group exists and user is a member
        const Group = require('../models/Group');
        const group = await Group.findById(groupId);
        
        if (!group || !group.isMember(userId)) {
          socket.emit('messageError', {
            error: 'Group not found or you are not a member'
          });
          return;
        }

        // Create and save message
        const Message = require('../models/Message');
        const newMessage = new Message({
          sender: userId,
          group: groupId,
          message: message.trim(),
          messageType,
          isRead: [{ user: userId }] // Mark as read by sender
        });

        const savedMessage = await newMessage.save();

        // Update group's updatedAt timestamp
        group.updatedAt = new Date();
        await group.save();

        // Populate message for broadcasting
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate('sender', 'name email phoneNumber isOnline')
          .populate('group', 'name');

        // Emit to all group members
        io.to(`group_${groupId}`).emit('receiveGroupMessage', {
          message: populatedMessage,
          groupId: groupId
        });

        console.log(`Group message sent from ${socket.user.name} to group ${groupId}`);
      } catch (error) {
        console.error('Error sending group message:', error);
        socket.emit('messageError', {
          error: 'Failed to send group message'
        });
      }
    });

    // Handle group typing indicators
    socket.on('groupTyping', (data) => {
      const { groupId } = data;
      socket.to(`group_${groupId}`).emit('userGroupTyping', {
        userId,
        user: socket.user,
        groupId,
        isTyping: true
      });
    });

    socket.on('stopGroupTyping', (data) => {
      const { groupId } = data;
      socket.to(`group_${groupId}`).emit('userGroupTyping', {
        userId,
        user: socket.user,
        groupId,
        isTyping: false
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.name} disconnected`);
      
      // Remove user from active users
      activeUsers.delete(userId);

      // Update user's offline status
      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });
      } catch (error) {
        console.error('Error updating user offline status:', error);
      }

      // Broadcast user's offline status
      socket.broadcast.emit('userOffline', {
        userId,
        user: socket.user,
        isOnline: false,
        lastSeen: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

module.exports = { handleConnection, activeUsers };
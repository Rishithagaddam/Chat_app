const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// Send contact request
// POST /api/contacts/send-request
router.post('/send-request', authMiddleware, async (req, res) => {
  try {
    const fromId = req.user._id.toString();
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ success: false, message: 'toUserId is required' });
    if (toUserId === fromId) return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });

    const sender = await User.findById(fromId);
    const receiver = await User.findById(toUserId);
    if (!receiver) return res.status(404).json({ success: false, message: 'User not found' });

    // Already contacts?
    const senderContactIds = (sender.contacts || []).map(String);
    const receiverContactIds = (receiver.contacts || []).map(String);
    if (senderContactIds.includes(toUserId) || receiverContactIds.includes(fromId)) {
      return res.status(400).json({ success: false, message: 'Already contacts' });
    }

    // Already sent?
    if ((sender.requestsSent || []).map(String).includes(toUserId)) {
      return res.status(400).json({ success: false, message: 'Request already sent' });
    }

    // Add request entries (avoid duplicates)
    sender.requestsSent = sender.requestsSent || [];
    receiver.requestsReceived = receiver.requestsReceived || [];

    sender.requestsSent.push(toUserId);
    receiver.requestsReceived.push(fromId);

    await sender.save();
    await receiver.save();

    // Emit to specific receiver socket if available
    const io = req.app.get('socketio');
    if (io) {
      const { activeUsers } = require('../config/socket'); // activeUsers map
      const target = activeUsers.get(toUserId);
      const payload = { toUserId, from: { id: sender._id, name: sender.name, email: sender.email } };
      if (target && target.socketId) {
        io.to(target.socketId).emit('contactRequest', payload);
      } else {
        // fallback to broadcast (still useful)
        io.emit('contactRequest', payload);
      }
    }

    res.json({ success: true, message: 'Contact request sent' });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending request' });
  }
});

// Accept contact request
// POST /api/contacts/accept-request
router.post('/accept-request', authMiddleware, async (req, res) => {
  try {
    const toId = req.user._id.toString(); // current user (receiver)
    const { fromUserId } = req.body;
    if (!fromUserId) return res.status(400).json({ success: false, message: 'fromUserId is required' });
    if (fromUserId === toId) return res.status(400).json({ success: false, message: 'Invalid request' });

    const receiver = await User.findById(toId);
    const sender = await User.findById(fromUserId);
    if (!sender) return res.status(404).json({ success: false, message: 'Sender not found' });

    // Validate request existence
    const hasRequest = (receiver.requestsReceived || []).map(String).includes(fromUserId) &&
                       (sender.requestsSent || []).map(String).includes(toId);
    if (!hasRequest) {
      return res.status(400).json({ success: false, message: 'No such contact request' });
    }

    // Add each other to contacts if not already
    receiver.contacts = receiver.contacts || [];
    sender.contacts = sender.contacts || [];

    if (!receiver.contacts.map(String).includes(fromUserId)) receiver.contacts.push(fromUserId);
    if (!sender.contacts.map(String).includes(toId)) sender.contacts.push(toId);

    // Remove request entries
    receiver.requestsReceived = (receiver.requestsReceived || []).filter(id => id.toString() !== fromUserId);
    sender.requestsSent = (sender.requestsSent || []).filter(id => id.toString() !== toId);

    await receiver.save();
    await sender.save();

    // Emit real-time event to both parties (prefer targeted emit)
    const io = req.app.get('socketio');
    if (io) {
      const { activeUsers } = require('../config/socket');
      const targetSender = activeUsers.get(fromUserId);
      const targetReceiver = activeUsers.get(toId);
      const payload = {
        by: { id: receiver._id, name: receiver.name },
        to: { id: sender._id, name: sender.name }
      };
      if (targetSender && targetSender.socketId) io.to(targetSender.socketId).emit('contactAccepted', payload);
      if (targetReceiver && targetReceiver.socketId) io.to(targetReceiver.socketId).emit('contactAccepted', payload);
    }

    res.json({ success: true, message: 'Contact request accepted' });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ success: false, message: 'Server error while accepting request' });
  }
});

// Reject request (remove from arrays)
router.post('/reject-request', authMiddleware, async (req, res) => {
  try {
    const toId = req.user._id.toString();
    const { fromUserId } = req.body;
    if (!fromUserId) return res.status(400).json({ success: false, message: 'fromUserId is required' });

    const receiver = await User.findById(toId);
    const sender = await User.findById(fromUserId);
    if (!sender) return res.status(404).json({ success: false, message: 'Sender not found' });

    receiver.requestsReceived = receiver.requestsReceived.filter(id => id.toString() !== fromUserId);
    sender.requestsSent = sender.requestsSent.filter(id => id.toString() !== toId);

    await receiver.save();
    await sender.save();

    res.json({ success: true, message: 'Contact request rejected' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Server error while rejecting request' });
  }
});

// Get current user's contacts
// GET /api/contacts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('contacts', 'name email isOnline lastSeen');
    res.json({ success: true, contacts: user.contacts || [] });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching contacts' });
  }
});

// Get incoming / outgoing requests
// GET /api/contacts/requests
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('requestsReceived', 'name email isOnline')
      .populate('requestsSent', 'name email isOnline');

    res.json({
      success: true,
      requestsReceived: user.requestsReceived || [],
      requestsSent: user.requestsSent || []
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching requests' });
  }
});

// Withdraw contact request
// POST /api/contacts/withdraw-request
router.post('/withdraw-request', authMiddleware, async (req, res) => {
  try {
    const fromId = req.user._id.toString(); // Current user withdrawing their request
    const { toUserId } = req.body;
    
    if (!toUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'toUserId is required' 
      });
    }

    const sender = await User.findById(fromId);
    const receiver = await User.findById(toUserId);
    
    if (!receiver) {
      return res.status(404).json({ 
        success: false, 
        message: 'Receiver not found' 
      });
    }

    // Remove request from both users
    sender.requestsSent = (sender.requestsSent || []).filter(
      id => id.toString() !== toUserId
    );
    receiver.requestsReceived = (receiver.requestsReceived || []).filter(
      id => id.toString() !== fromId
    );

    await sender.save();
    await receiver.save();

    // Notify the receiver through socket if online
    const io = req.app.get('socketio');
    if (io) {
      const { activeUsers } = require('../config/socket');
      const targetReceiver = activeUsers.get(toUserId);
      if (targetReceiver) {
        io.to(targetReceiver.socketId).emit('requestWithdrawn', {
          fromId,
          fromName: sender.name
        });
      }
    }

    res.json({
      success: true,
      message: 'Request withdrawn successfully'
    });
  } catch (error) {
    console.error('Withdraw request error:', error);
    res.status(500).json({
      success: false, 
      message: 'Server error while withdrawing request'
    });
  }
});

module.exports = router;
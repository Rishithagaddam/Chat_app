const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users except current user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id }
    }).select('-password').sort({ name: 1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/users/contacts
// @desc    Get user's contacts (returns user objects)
// @access  Private
router.get('/contacts', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('contacts', 'name email isOnline lastSeen');
    res.json({
      success: true,
      count: (user.contacts || []).length,
      contacts: user.contacts || []
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching contacts'
    });
  }
});

// @route   POST /api/users/contacts/:userId
// @desc    Add a user to contacts (mutual add)
// @access  Private
router.post('/contacts/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();

    if (userId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot add yourself as a contact' });
    }

    const userToAdd = await User.findById(userId).select('-password');
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);

    const isAlreadyContact = (currentUser.contacts || []).map(String).includes(userId);
    if (isAlreadyContact) {
      return res.status(400).json({ success: false, message: 'User is already in your contacts' });
    }

    // Add to current user's contacts (as ObjectId)
    currentUser.contacts = currentUser.contacts || [];
    currentUser.contacts.push(userToAdd._id);
    await currentUser.save();

    // Also add current user to the other user's contacts
    userToAdd.contacts = userToAdd.contacts || [];
    if (!userToAdd.contacts.map(String).includes(currentUserId)) {
      userToAdd.contacts.push(currentUserId);
      await userToAdd.save();
    }

    res.json({
      success: true,
      message: 'Contact added successfully',
      contact: userToAdd
    });
  } catch (error) {
    console.error('Add contact error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    res.status(500).json({ success: false, message: 'Server error while adding contact' });
  }
});

// @route   DELETE /api/users/contacts/:userId
// @desc    Remove a user from contacts (mutual remove)
// @access  Private
router.delete('/contacts/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();

    const currentUser = await User.findById(currentUserId);
    currentUser.contacts = (currentUser.contacts || []).filter(id => id.toString() !== userId);
    await currentUser.save();

    const otherUser = await User.findById(userId);
    if (otherUser) {
      otherUser.contacts = (otherUser.contacts || []).filter(id => id.toString() !== currentUserId);
      await otherUser.save();
    }

    res.json({ success: true, message: 'Contact removed successfully' });
  } catch (error) {
    console.error('Remove contact error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    res.status(500).json({ success: false, message: 'Server error while removing contact' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    res.status(500).json({ success: false, message: 'Server error while fetching user' });
  }
});

module.exports = router;
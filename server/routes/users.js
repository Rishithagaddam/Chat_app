const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users except current user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get all users except the current user and exclude password
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

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;

    // Build update object
    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (email) updateFields.email = email.toLowerCase().trim();
    if (phoneNumber) updateFields.phoneNumber = phoneNumber.trim();

    // Check if email or phone already exists (exclude current user)
    if (email || phoneNumber) {
      const existingUser = await User.findOne({
        _id: { $ne: req.user._id },
        $or: [
          ...(email ? [{ email: email.toLowerCase() }] : []),
          ...(phoneNumber ? [{ phoneNumber }] : [])
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone number already exists'
        });
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   GET /api/users/search/:query
// @desc    Search users by name, email, or phone
// @access  Private
router.get('/search/:query', authMiddleware, async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phoneNumber: { $regex: query, $options: 'i' } }
      ]
    }).select('-password').limit(10);

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
});

// @route   GET /api/users/contacts
// @desc    Get user's contacts
// @access  Private
router.get('/contacts', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('contacts.user', '-password')
      .select('-password');

    res.json({
      success: true,
      count: user.contacts.length,
      contacts: user.contacts
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
// @desc    Add a user to contacts
// @access  Private
router.post('/contacts/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Can't add yourself as contact
    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself as a contact'
      });
    }

    // Check if user exists
    const userToAdd = await User.findById(userId).select('-password');
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already in contacts
    const currentUser = await User.findById(currentUserId);
    const isAlreadyContact = currentUser.contacts.some(
      contact => contact.user.toString() === userId
    );

    if (isAlreadyContact) {
      return res.status(400).json({
        success: false,
        message: 'User is already in your contacts'
      });
    }

    // Add to contacts
    currentUser.contacts.push({ user: userId });
    await currentUser.save();

    // Also add current user to the other user's contacts (mutual)
    const otherUser = await User.findById(userId);
    const isCurrentUserInOtherContacts = otherUser.contacts.some(
      contact => contact.user.toString() === currentUserId.toString()
    );

    if (!isCurrentUserInOtherContacts) {
      otherUser.contacts.push({ user: currentUserId });
      await otherUser.save();
    }

    res.json({
      success: true,
      message: 'Contact added successfully',
      contact: userToAdd
    });
  } catch (error) {
    console.error('Add contact error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding contact'
    });
  }
});

// @route   DELETE /api/users/contacts/:userId
// @desc    Remove a user from contacts
// @access  Private
router.delete('/contacts/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Remove from current user's contacts
    const currentUser = await User.findById(currentUserId);
    currentUser.contacts = currentUser.contacts.filter(
      contact => contact.user.toString() !== userId
    );
    await currentUser.save();

    // Also remove current user from the other user's contacts
    const otherUser = await User.findById(userId);
    if (otherUser) {
      otherUser.contacts = otherUser.contacts.filter(
        contact => contact.user.toString() !== currentUserId.toString()
      );
      await otherUser.save();
    }

    res.json({
      success: true,
      message: 'Contact removed successfully'
    });
  } catch (error) {
    console.error('Remove contact error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while removing contact'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (This must be last to avoid conflicts with specific routes)
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

module.exports = router;
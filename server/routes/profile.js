const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { profileUpload } = require('../middleware/profileUploadMiddleware');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// @route   GET /api/profile
// @desc    Get current user's profile
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        bio: user.bio,
        statusMessage: user.statusMessage,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile (bio, status, name)
// @access  Private
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, bio, statusMessage } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (statusMessage !== undefined) updateData.statusMessage = statusMessage.trim();

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // Broadcast profile update to other users
    const io = req.app.get('socketio');
    if (io) {
      io.emit('profileUpdate', {
        userId: user._id,
        name: user.name,
        bio: user.bio,
        statusMessage: user.statusMessage,
        profilePicture: user.profilePicture
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        bio: user.bio,
        statusMessage: user.statusMessage,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }
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

// @route   POST /api/profile/picture
// @desc    Upload profile picture
// @access  Private
router.post('/picture', authMiddleware, profileUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    // Delete old profile picture if it exists
    if (user.profilePicture) {
      try {
        const oldPath = path.join(process.cwd(), user.profilePicture.replace('/uploads', 'uploads'));
        await fs.unlink(oldPath);
      } catch (deleteError) {
        console.log('Failed to delete old profile picture:', deleteError.message);
      }
    }

    // Update user with new profile picture URL
    const profilePictureUrl = `/uploads/profilePics/${req.file.filename}`;
    user.profilePicture = profilePictureUrl;
    await user.save();

    // Broadcast profile picture update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('profileUpdate', {
        userId: user._id,
        name: user.name,
        bio: user.bio,
        statusMessage: user.statusMessage,
        profilePicture: user.profilePicture
      });
    }

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: profilePictureUrl
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while uploading profile picture'
    });
  }
});

// @route   DELETE /api/profile/picture
// @desc    Remove profile picture
// @access  Private
router.delete('/picture', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (user.profilePicture) {
      try {
        const imagePath = path.join(process.cwd(), user.profilePicture.replace('/uploads', 'uploads'));
        await fs.unlink(imagePath);
      } catch (deleteError) {
        console.log('Failed to delete profile picture file:', deleteError.message);
      }

      user.profilePicture = null;
      await user.save();

      // Broadcast profile update
      const io = req.app.get('socketio');
      if (io) {
        io.emit('profileUpdate', {
          userId: user._id,
          name: user.name,
          bio: user.bio,
          statusMessage: user.statusMessage,
          profilePicture: null
        });
      }
    }

    res.json({
      success: true,
      message: 'Profile picture removed successfully'
    });
  } catch (error) {
    console.error('Remove profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing profile picture'
    });
  }
});

module.exports = router;

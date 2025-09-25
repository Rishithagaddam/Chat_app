const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  console.log('Groups test route hit');
  res.json({ 
    success: true, 
    message: 'Groups routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Get all groups for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  console.log('GET /api/groups called');
  try {
    // For now, return empty array to test if route works
    res.json({
      success: true,
      groups: []
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching groups'
    });
  }
});

// Create new group
router.post('/', authMiddleware, async (req, res) => {
  console.log('POST /api/groups called');
  try {
    const { name, members } = req.body;
    
    if (!name || !members) {
      return res.status(400).json({
        success: false,
        message: 'Group name and members are required'
      });
    }

    // For now, return a mock group to test if route works
    const mockGroup = {
      _id: 'mock-id-' + Date.now(),
      name: name,
      admin: req.user._id,
      members: members,
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      group: mockGroup,
      message: 'Group created successfully'
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating group'
    });
  }
});

module.exports = router;
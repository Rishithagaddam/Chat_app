const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

console.log('Groups routes module loaded');

// Mock data for now - replace with database operations later
let groups = [];
let groupIdCounter = 1;

// Test route to verify the module is working
router.get('/test', (req, res) => {
  res.json({ message: 'Groups route is working!' });
});

// @route   GET /api/groups
// @desc    Get all groups for the authenticated user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  console.log('GET /api/groups called by user:', req.user?._id);
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.user._id;
    
    // Filter groups where user is a member or admin
    const userGroups = groups.filter(group => 
      group.members.some(member => member.toString() === userId.toString()) ||
      group.admin.toString() === userId.toString()
    );

    res.json({
      success: true,
      groups: userGroups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching groups'
    });
  }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  console.log('POST /api/groups called by user:', req.user._id);
  try {
    const { name, members } = req.body;
    const adminId = req.user._id;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one member is required'
      });
    }

    // Create new group with mock data
    const newGroup = {
      _id: 'group_' + groupIdCounter++,
      name: name.trim(),
      admin: adminId,
      members: [...new Set([adminId, ...members])], // Include admin as member, remove duplicates
      createdAt: new Date(),
      updatedAt: new Date()
    };

    groups.push(newGroup);

    res.status(201).json({
      success: true,
      group: newGroup,
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

// @route   GET /api/groups/:groupId
// @desc    Get specific group details
// @access  Private
router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = groups.find(g => g._id === groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member
    const isMember = group.members.some(member => member.toString() === userId.toString()) ||
                    group.admin.toString() === userId.toString();

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    res.json({
      success: true,
      group: group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group'
    });
  }
});

module.exports = router;
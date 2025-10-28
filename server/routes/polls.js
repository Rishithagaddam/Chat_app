const express = require('express');
const Poll = require('../models/Poll');
const Group = require('../models/Group');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new poll
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, groupId, options, settings, expiresAt } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!title || !groupId || !options || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Title, group, and at least 2 options are required'
      });
    }

    // Check if group exists and user has permission
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.canUserPerformAction(userId, 'canCreatePolls')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create polls in this group'
      });
    }

    // Create poll
    const poll = new Poll({
      title: title.trim(),
      description: description ? description.trim() : '',
      creator: userId,
      group: groupId,
      options: options.map(opt => ({ text: opt.trim() })),
      settings: settings || {},
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await poll.save();
    await poll.populate('creator', 'name email');

    res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      poll
    });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating poll'
    });
  }
});

// Get polls for a group
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if user is member of group
    const group = await Group.findById(groupId);
    if (!group || !group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    const polls = await Poll.find({
      group: groupId,
      isActive: true
    })
    .populate('creator', 'name email')
    .sort({ createdAt: -1 });

    // Add user vote information
    const pollsWithVotes = polls.map(poll => {
      const pollObj = poll.toObject();
      pollObj.userVote = poll.getUserVote(userId);
      pollObj.hasVoted = poll.hasUserVoted(userId);
      pollObj.results = poll.getResults();
      return pollObj;
    });

    res.json({
      success: true,
      polls: pollsWithVotes
    });
  } catch (error) {
    console.error('Get group polls error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching polls'
    });
  }
});

// Vote on a poll
router.post('/:pollId/vote', authMiddleware, async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const userId = req.user._id;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: 'Option ID is required'
      });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if user is member of the group
    const group = await Group.findById(poll.group);
    if (!group || !group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Add vote
    poll.addVote(userId, optionId);
    await poll.save();

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      results: poll.getResults()
    });
  } catch (error) {
    console.error('Vote on poll error:', error);
    
    if (error.message === 'Poll is no longer active' || 
        error.message === 'User has already voted' ||
        error.message === 'Invalid option') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while recording vote'
    });
  }
});

// Remove vote from poll
router.delete('/:pollId/vote/:optionId', authMiddleware, async (req, res) => {
  try {
    const { pollId, optionId } = req.params;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if user is member of the group
    const group = await Group.findById(poll.group);
    if (!group || !group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Remove vote
    poll.removeVote(userId, optionId);
    await poll.save();

    res.json({
      success: true,
      message: 'Vote removed successfully',
      results: poll.getResults()
    });
  } catch (error) {
    console.error('Remove vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing vote'
    });
  }
});

// Delete poll (creator or admin only)
router.delete('/:pollId', authMiddleware, async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check permissions
    const group = await Group.findById(poll.group);
    if (poll.creator.toString() !== userId.toString() && !group.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this poll'
      });
    }

    poll.isActive = false;
    await poll.save();

    res.json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting poll'
    });
  }
});

module.exports = router;

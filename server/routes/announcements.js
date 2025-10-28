const express = require('express');
const Announcement = require('../models/Announcement');
const Group = require('../models/Group');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create announcement
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, groupId, priority, attachments, expiresAt } = req.body;
    const userId = req.user._id;

    if (!title || !content || !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and group are required'
      });
    }

    // Check permissions
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.canUserPerformAction(userId, 'canMakeAnnouncements')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to make announcements'
      });
    }

    const announcement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      author: userId,
      group: groupId,
      priority: priority || 'medium',
      attachments: attachments || [],
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await announcement.save();
    await announcement.populate('author', 'name email');

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating announcement'
    });
  }
});

// Get group announcements
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if user is member
    const group = await Group.findById(groupId);
    if (!group || !group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    const announcements = await Announcement.find({
      group: groupId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    })
    .populate('author', 'name email')
    .sort({ isPinned: -1, createdAt: -1 });

    // Mark announcements as read and add read status
    const announcementsWithStatus = announcements.map(ann => {
      const annObj = ann.toObject();
      annObj.isRead = ann.isReadBy(userId);
      return annObj;
    });

    res.json({
      success: true,
      announcements: announcementsWithStatus
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching announcements'
    });
  }
});

// Mark announcement as read
router.post('/:announcementId/read', authMiddleware, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const userId = req.user._id;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    announcement.markAsReadBy(userId);
    await announcement.save();

    res.json({
      success: true,
      message: 'Announcement marked as read'
    });
  } catch (error) {
    console.error('Mark announcement read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking announcement as read'
    });
  }
});

// Pin/unpin announcement
router.post('/:announcementId/pin', authMiddleware, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const userId = req.user._id;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check permissions
    const group = await Group.findById(announcement.group);
    if (!group.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can pin announcements'
      });
    }

    announcement.isPinned = !announcement.isPinned;
    announcement.pinnedAt = announcement.isPinned ? new Date() : undefined;
    await announcement.save();

    res.json({
      success: true,
      message: `Announcement ${announcement.isPinned ? 'pinned' : 'unpinned'} successfully`
    });
  } catch (error) {
    console.error('Pin announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while pinning announcement'
    });
  }
});

// Delete announcement
router.delete('/:announcementId', authMiddleware, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const userId = req.user._id;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check permissions (author or admin)
    const group = await Group.findById(announcement.group);
    if (announcement.author.toString() !== userId.toString() && !group.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this announcement'
      });
    }

    announcement.isActive = false;
    await announcement.save();

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting announcement'
    });
  }
});

module.exports = router;

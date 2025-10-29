const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Group = require('../models/Group');
const User = require('../models/User');
const Message = require('../models/Message');

const router = express.Router();

console.log('✅ Groups routes module loaded');

// ----------------------
// GET all groups for authenticated user
// ----------------------
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Getting groups for user:', userId);

    // Find all groups where user is a member
    const groups = await Group.find({
      'members.user': userId,
      isActive: true
    })
    .populate('admin', 'name email')
    .populate('members.user', 'name email isOnline lastSeen')
    .sort({ updatedAt: -1 });

    console.log('Found groups:', groups.length);
    res.json({ success: true, groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching groups' });
  }
});

// ----------------------
// Create new group
// ----------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const adminId = req.user._id;

    console.log('Creating group:', { name, description, members, adminId });

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one member is required' });
    }

    // Verify all members exist and are in admin's contacts
    const adminUser = await User.findById(adminId);
    const adminContactIds = (adminUser.contacts || []).map(c => c.toString());

    const validMembers = [];
    for (const memberId of members) {
      if (adminContactIds.includes(memberId.toString())) {
        const memberExists = await User.findById(memberId);
        if (memberExists) {
          validMembers.push({
            user: memberId,
            role: 'member',
            joinedAt: new Date()
          });
        }
      }
    }

    if (validMembers.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid members found in your contacts' });
    }

    // Add admin as member
    validMembers.push({
      user: adminId,
      role: 'admin',
      joinedAt: new Date()
    });

    // Create group
    const group = new Group({
      name: name.trim(),
      description: description ? description.trim() : '',
      admin: adminId,
      members: validMembers,
      settings: {
        allowMembersToAddOthers: true,
        allowMembersToEditGroupInfo: false
      }
    });

    console.log('Saving group to database...');
    await group.save();
    console.log('Group saved successfully:', group._id);

    // Populate the saved group
    const populatedGroup = await Group.findById(group._id)
      .populate('admin', 'name email')
      .populate('members.user', 'name email isOnline');

    // Create system message
    const systemMessage = new Message({
      sender: adminId,
      group: group._id,
      message: `${req.user.name} created the group`,
      messageType: 'system'
    });
    await systemMessage.save();

    console.log('Group created successfully:', populatedGroup._id);
    res.status(201).json({ 
      success: true, 
      group: populatedGroup, 
      message: 'Group created successfully' 
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating group' });
  }
});

// ----------------------
// Debug route - TEMPORARY
// ----------------------
router.get('/debug/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    console.log('=== DEBUG GROUP ACCESS ===');
    console.log('User ID:', userId.toString());
    console.log('Group ID:', groupId);

    const group = await Group.findById(groupId)
      .populate('admin', 'name email')
      .populate('members.user', 'name email');

    if (!group) {
      return res.json({
        success: false,
        debug: {
          groupFound: false,
          message: 'Group not found'
        }
      });
    }

    const isMemberResult = group.isMember(userId);
    const isAdminResult = group.admin._id.toString() === userId.toString();

    const debug = {
      groupFound: true,
      groupId: group._id.toString(),
      groupName: group.name,
      groupAdmin: {
        id: group.admin._id.toString(),
        name: group.admin.name,
        email: group.admin.email
      },
      isActive: group.isActive,
      currentUserId: userId.toString(),
      isMember: isMemberResult,
      isAdmin: isAdminResult,
      hasAccess: isMemberResult || isAdminResult,
      members: group.members.map(m => ({
        id: m.user._id.toString(),
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        isCurrentUser: m.user._id.toString() === userId.toString()
      })),
      membershipCheck: {
        totalMembers: group.members.length,
        userFoundInMembers: group.members.some(m => m.user._id.toString() === userId.toString()),
        adminMatch: group.admin._id.toString() === userId.toString()
      }
    };

    console.log('Debug info:', debug);

    res.json({
      success: true,
      debug
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      debug: {
        error: error.message,
        stack: error.stack
      }
    });
  }
});

// ----------------------
// Get group details
// ----------------------
router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { debug } = req.query;
    const userId = req.user._id;

    console.log('Getting group details for:', { groupId, userId: userId.toString(), debug: !!debug });

    const group = await Group.findById(groupId)
      .populate('admin', 'name email')
      .populate('members.user', 'name email isOnline lastSeen');

    if (!group || !group.isActive) {
      console.log('Group not found or inactive:', { found: !!group, isActive: group?.isActive });
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    console.log('Group found:', { 
      groupId: group._id.toString(), 
      adminId: group.admin._id.toString(),
      memberIds: group.members.map(m => m.user._id.toString()),
      userIsAdmin: group.admin._id.toString() === userId.toString()
    });

    // Check if user is member or admin
    const isAdmin = group.admin._id.toString() === userId.toString();
    const isMember = group.isMember(userId);

    // If debug mode, return detailed information
    if (debug === 'true') {
      const debugInfo = {
        groupFound: true,
        groupId: group._id.toString(),
        groupName: group.name,
        groupAdmin: {
          id: group.admin._id.toString(),
          name: group.admin.name,
          email: group.admin.email
        },
        isActive: group.isActive,
        currentUserId: userId.toString(),
        isMember: isMember,
        isAdmin: isAdmin,
        hasAccess: isMember || isAdmin,
        members: group.members.map(m => ({
          id: m.user._id.toString(),
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          isCurrentUser: m.user._id.toString() === userId.toString()
        })),
        membershipCheck: {
          totalMembers: group.members.length,
          userFoundInMembers: group.members.some(m => m.user._id.toString() === userId.toString()),
          adminMatch: group.admin._id.toString() === userId.toString()
        }
      };

      console.log('=== DEBUG GROUP ACCESS ===');
      console.log('Debug info:', debugInfo);

      return res.json({
        success: true,
        debug: debugInfo
      });
    }
    
    if (!isMember && !isAdmin) {
      console.log('User is not a member or admin of the group:', { 
        userId: userId.toString(), 
        isAdmin,
        isMember,
        adminId: group.admin._id.toString(),
        members: group.members.map(m => ({ id: m.user._id.toString(), name: m.user.name }))
      });
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('Get group error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid group ID' });
    }
    res.status(500).json({ success: false, message: 'Server error while fetching group' });
  }
});

// Fix the get messages route syntax
router.get('/:groupId/messages', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    console.log('Getting group messages for:', { groupId, userId: userId.toString() });

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      console.log('Group not found or inactive for messages:', { found: !!group, isActive: group?.isActive });
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is member or admin
    const isAdmin = group.admin._id.toString() === userId.toString();
    const isMember = group.isMember(userId);
    
    if (!isMember && !isAdmin) {
      console.log('User is not a member or admin of the group (messages):', { 
        userId: userId.toString(),
        isAdmin,
        isMember,
        adminId: group.admin._id.toString(),
        members: group.members.map(m => m.user.toString())
      }); // Add missing closing brace here
      
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    // Get messages for this group
    const messages = await Message.find({ group: groupId })
      .populate('sender', 'name email isOnline')
      .sort({ createdAt: 1 });

    // Mark messages as read by current user
    await Message.updateMany(
      {
        group: groupId,
        'isRead.user': { $ne: userId }
      },
      {
        $push: { isRead: { user: userId } }
      }
    );

    console.log('Group messages fetched:', messages.length);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get group messages error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid group ID' });
    }
    res.status(500).json({ success: false, message: 'Server error while fetching messages' });
  }
});
router.post('/:groupId/messages', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message, messageType = 'text' } = req.body;
    const senderId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!group.isMember(senderId)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
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
      .populate('sender', 'name email isOnline')
      .populate('group', 'name');

    console.log('Group message sent successfully');
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send group message error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: errors[0] });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid group ID' });
    }

    res.status(500).json({ success: false, message: 'Server error while sending message' });
  }
});

// @route   PUT /api/groups/:groupId/members/:memberId/role
// @desc    Update member role in group
// @access  Private
router.put('/:groupId/members/:memberId/role', authMiddleware, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user._id;

    console.log('Updating member role:', { groupId, memberId, role, userId: userId.toString() });

    // Validate role
    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, moderator, or member'
      });
    }

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if current user is admin
    if (!group.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can change member roles'
      });
    }

    // Check if target member exists in group
    if (!group.isMember(memberId)) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in group'
      });
    }

    // Cannot change own role
    if (userId.toString() === memberId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    // Update member role
    const updated = group.updateMemberRole(memberId, role);
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update member role'
      });
    }

    await group.save();

    // Populate the updated group
    const updatedGroup = await Group.findById(groupId)
      .populate('admin', 'name email')
      .populate('members.user', 'name email isOnline');

    res.json({
      success: true,
      message: `Member role updated to ${role}`,
      group: updatedGroup
    });
  } catch (error) {
    console.error('Update member role error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid group or member ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating member role'
    });
  }
});

// @route   DELETE /api/groups/:groupId/members/:memberId
// @desc    Remove member from group
// @access  Private
router.delete('/:groupId/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check permissions (admin or removing self)
    const canRemove = group.isAdmin(userId) || userId.toString() === memberId.toString();
    if (!canRemove) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to remove member'
      });
    }

    // Cannot remove group admin
    if (group.admin.toString() === memberId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group admin'
      });
    }

    // Remove member
    const removed = group.removeMember(memberId);
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in group'
      });
    }

    await group.save();

    res.json({
      success: true,
      message: 'Member removed from group'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member'
    });
  }
});

// Add these new routes
router.delete('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Only admin can delete group
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only admin can delete group' });
    }

    // Delete all messages in group
    await Message.deleteMany({ group: groupId });
    // Delete the group
    await Group.deleteOne({ _id: groupId });

    // Notify members through socket
    const io = req.app.get('socketio');
    if (io) {
      io.to(groupId).emit('groupDeleted', { groupId, name: group.name });
    }

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting group' });
  }
});

router.put('/:groupId/name', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Only admin can change name
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only admin can change group name' });
    }

    group.name = name.trim();
    await group.save();

    // Notify members through socket
    const io = req.app.get('socketio');
    if (io) {
      io.to(groupId).emit('groupNameChanged', { groupId, newName: name });
    }

    res.json({ success: true, message: 'Group name updated', group });
  } catch (error) {
    console.error('Update group name error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating group name' });
  }
});

// Add this route to handle adding members
router.post('/:groupId/members', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only admin can add members' });
    }

    // Filter out existing members
    const existingMemberIds = group.members.map(m => m.user.toString());
    const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id.toString()));

    // Add new members
    const newMembers = newMemberIds.map(memberId => ({
      user: memberId,
      role: 'member',
      joinedAt: new Date()
    }));

    group.members.push(...newMembers);
    await group.save();

    // Populate member details
    const updatedGroup = await Group.findById(groupId)
      .populate('members.user', 'name email')
      .populate('admin', 'name email');

    // Emit socket event to notify group members
    const io = req.app.get('socketio');
    if (io) {
      io.to(groupId).emit('groupMembersAdded', {
        groupId,
        newMembers: newMembers.map(m => ({
          _id: m.user,
          role: m.role,
          joinedAt: m.joinedAt
        })),
        addedBy: userId
      });
    }

    res.json({
      success: true,
      message: 'Members added successfully',
      group: updatedGroup
    });

  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ success: false, message: 'Server error while adding members' });
  }
});

module.exports = router;

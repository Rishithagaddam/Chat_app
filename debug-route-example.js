// Add this temporary route to server/routes/groups.js for debugging

// Temporary debugging route - add this to your groups.js routes
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
    const isAdminResult = group.isAdmin(userId);

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

// You can call this route with: GET /api/groups/debug/68d4d88f2c6e4c5747628108
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Group description cannot be more than 500 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Group admin is required']
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    permissions: {
      canSendMessages: { type: Boolean, default: true },
      canDeleteMessages: { type: Boolean, default: false },
      canAddMembers: { type: Boolean, default: false },
      canRemoveMembers: { type: Boolean, default: false },
      canEditGroup: { type: Boolean, default: false },
      canCreatePolls: { type: Boolean, default: true },
      canMakeAnnouncements: { type: Boolean, default: false }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Group Settings
  settings: {
    allowMembersToAddOthers: { type: Boolean, default: false },
    allowMembersToEditGroupInfo: { type: Boolean, default: false },
    requireAdminApproval: { type: Boolean, default: false },
    allowPolls: { type: Boolean, default: true },
    allowAnnouncements: { type: Boolean, default: true },
    allowMediaSharing: { type: Boolean, default: true },
    muteNonAdmins: { type: Boolean, default: false }
  },
  
  // Group Categories
  category: {
    type: String,
    enum: ['general', 'work', 'family', 'friends', 'study', 'project', 'other'],
    default: 'general'
  },
  
  // Group Privacy
  privacy: {
    type: String,
    enum: ['public', 'private', 'secret'],
    default: 'private'
  },
  
  // Join Requests (for private groups)
  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: String,
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Banned Members
  bannedMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: String,
    bannedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
groupSchema.index({ admin: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ category: 1, privacy: 1 });
groupSchema.index({ createdAt: -1 });

// Virtuals
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

groupSchema.virtual('adminCount').get(function() {
  return this.members.filter(m => m.role === 'admin').length;
});

groupSchema.virtual('moderatorCount').get(function() {
  return this.members.filter(m => m.role === 'moderator').length;
});

// Methods
groupSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

groupSchema.methods.isAdmin = function(userId) {
  return this.admin.toString() === userId.toString() || 
         this.members.some(member => 
           member.user.toString() === userId.toString() && member.role === 'admin'
         );
};

groupSchema.methods.isModerator = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && 
    (member.role === 'admin' || member.role === 'moderator')
  );
};

groupSchema.methods.getMemberRole = function(userId) {
  if (this.admin.toString() === userId.toString()) return 'admin';
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

groupSchema.methods.getMemberPermissions = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) return null;
  
  // Admin has all permissions
  if (member.role === 'admin' || this.admin.toString() === userId.toString()) {
    return {
      canSendMessages: true,
      canDeleteMessages: true,
      canAddMembers: true,
      canRemoveMembers: true,
      canEditGroup: true,
      canCreatePolls: true,
      canMakeAnnouncements: true
    };
  }
  
  return member.permissions;
};

groupSchema.methods.addMember = function(userId, role = 'member', invitedBy = null) {
  if (!this.isMember(userId)) {
    const permissions = {
      canSendMessages: true,
      canDeleteMessages: role === 'moderator',
      canAddMembers: role === 'moderator' ? this.settings.allowMembersToAddOthers : false,
      canRemoveMembers: false,
      canEditGroup: role === 'moderator' ? this.settings.allowMembersToEditGroupInfo : false,
      canCreatePolls: this.settings.allowPolls,
      canMakeAnnouncements: role === 'moderator'
    };
    
    this.members.push({ 
      user: userId, 
      role,
      permissions,
      invitedBy
    });
    return true;
  }
  return false;
};

groupSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.user.toString() === userId.toString()
  );
  if (memberIndex > -1) {
    this.members.splice(memberIndex, 1);
    return true;
  }
  return false;
};

groupSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (member) {
    member.role = newRole;
    // Update permissions based on role
    if (newRole === 'moderator') {
      member.permissions.canDeleteMessages = true;
      member.permissions.canAddMembers = this.settings.allowMembersToAddOthers;
      member.permissions.canEditGroup = this.settings.allowMembersToEditGroupInfo;
      member.permissions.canMakeAnnouncements = true;
    } else if (newRole === 'member') {
      member.permissions.canDeleteMessages = false;
      member.permissions.canAddMembers = false;
      member.permissions.canRemoveMembers = false;
      member.permissions.canEditGroup = false;
      member.permissions.canMakeAnnouncements = false;
    }
    return true;
  }
  return false;
};

groupSchema.methods.canUserPerformAction = function(userId, action) {
  const permissions = this.getMemberPermissions(userId);
  if (!permissions) return false;
  return permissions[action] === true;
};

module.exports = mongoose.model('Group', groupSchema);
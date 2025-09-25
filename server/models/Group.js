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
    maxlength: [500, 'Group description cannot be more than 500 characters'],
    default: ''
  },
  avatar: {
    type: String, // URL to group avatar image
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
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    allowMembersToAddOthers: {
      type: Boolean,
      default: false
    },
    allowMembersToEditGroupInfo: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Index for efficient queries
groupSchema.index({ 'members.user': 1, isActive: 1 });
groupSchema.index({ admin: 1 });
groupSchema.index({ createdAt: -1 });
groupSchema.index({ lastActivity: -1 });

// Pre-save middleware to update lastActivity
groupSchema.pre('save', function(next) {
  if (this.isModified() && !this.isModified('lastActivity')) {
    this.lastActivity = new Date();
  }
  next();
});

// Method to add a member
groupSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (!existingMember) {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
  }
  
  return this;
};

// Method to remove a member
groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
  return this;
};

// Method to check if user is member
groupSchema.methods.isMember = function(userId) {
  if (!userId || !this.members) return false;
  
  const userIdStr = userId.toString();
  return this.members.some(member => {
    if (!member || !member.user) return false;
    return member.user.toString() === userIdStr;
  });
};

// Method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  return this.admin.toString() === userId.toString() ||
         this.members.some(member => 
           member.user.toString() === userId.toString() && member.role === 'admin'
         );
};

module.exports = mongoose.model('Group', groupSchema);
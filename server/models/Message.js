const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.group; // Required only if not a group message
    }
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: function() {
      return !this.receiver; // Required only if not a direct message
    }
  },
  message: {
    type: String,
    required: function() {
      return this.messageType === 'text' || this.messageType === 'system';
    },
    trim: true,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'file', 'voice', 'system'],
    default: 'text'
  },
  // File-related fields for media messages
  fileUrl: {
    type: String,
    required: function() {
      return ['image', 'audio', 'video', 'file', 'voice'].includes(this.messageType);
    }
  },
  fileName: {
    type: String,
    required: function() {
      return ['file', 'audio', 'video'].includes(this.messageType);
    }
  },
  fileSize: {
    type: Number, // Size in bytes
    required: function() {
      return ['image', 'audio', 'video', 'file', 'voice'].includes(this.messageType);
    }
  },
  mimeType: {
    type: String,
    required: function() {
      return ['image', 'audio', 'video', 'file', 'voice'].includes(this.messageType);
    }
  },
  duration: {
    type: Number, // Duration in seconds for audio/video/voice
    required: function() {
      return ['audio', 'video', 'voice'].includes(this.messageType);
    }
  },
  thumbnailUrl: {
    type: String // Thumbnail for videos and large images
  },
  dimensions: {
    width: Number,
    height: Number
  }, // For images and videos
  
  // Enhanced read tracking for both individual and group messages
  isRead: {
    type: mongoose.Schema.Types.Mixed,
    default: function() {
      if (this.group) {
        return []; // Array for group messages
      } else {
        return false; // Boolean for individual messages
      }
    }
  },
  readAt: {
    type: Date
  },

  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Message Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true,
      maxlength: 10
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Pinned Message Status
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pinnedAt: {
    type: Date
  },

  // Message Editing
  isEdited: {
    type: Boolean,
    default: false
  },
  originalMessage: {
    type: String
  },
  editHistory: [{
    previousContent: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: {
    type: Date
  },

  // Message Forwarding/Quoting
  isForwarded: {
    type: Boolean,
    default: false
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  quotedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient querying
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ sender: 1, group: 1, createdAt: -1 });
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ group: 1, messageType: 1, createdAt: -1 }); // For media queries
messageSchema.index({ messageType: 1, createdAt: -1 }); // For media type filtering

// Virtual for conversation participants
messageSchema.virtual('participants').get(function() {
  if (this.group) {
    return null; // For group messages, participants are in the group model
  }
  return [this.sender, this.receiver];
});

// Method to check if message is read by user (works for both individual and group)
messageSchema.methods.isReadByUser = function(userId) {
  if (this.group) {
    return Array.isArray(this.isRead) && this.isRead.some(read => read.user.toString() === userId.toString());
  } else {
    return this.isRead === true;
  }
};

// Method to mark as read by user
messageSchema.methods.markAsReadBy = function(userId) {
  if (this.group) {
    if (!this.isReadByUser(userId)) {
      this.isRead.push({ user: userId });
    }
  } else {
    this.isRead = true;
    this.readAt = new Date();
  }
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  // Add new reaction
  this.reactions.push({ user: userId, emoji });
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId, emoji) {
  this.reactions = this.reactions.filter(r => 
    !(r.user.toString() === userId.toString() && r.emoji === emoji)
  );
};

// Method to check if message can be edited (within 15 minutes)
messageSchema.methods.canEdit = function(userId) {
  if (this.sender.toString() !== userId.toString()) return false;
  if (this.isDeleted) return false;
  const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
  return (Date.now() - this.createdAt.getTime()) < editTimeLimit;
};

// Method to check if message can be deleted
messageSchema.methods.canDelete = function(userId, userRole = 'member') {
  if (this.isDeleted) return false;
  if (this.sender.toString() === userId.toString()) return true;
  if (this.group && (userRole === 'admin' || userRole === 'moderator')) return true;
  return false;
};

// Method to edit message
messageSchema.methods.editMessage = function(newContent) {
  if (!this.originalMessage) {
    this.originalMessage = this.message;
  }
  this.editHistory.push({
    previousContent: this.message,
    editedAt: new Date()
  });
  this.message = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
};

// Static method to get media messages for a group
messageSchema.statics.getGroupMedia = async function(groupId, messageTypes = ['image', 'video', 'audio', 'file']) {
  return this.find({
    group: groupId,
    messageType: { $in: messageTypes },
    isDeleted: false
  })
  .populate('sender', 'name email')
  .sort({ createdAt: -1 });
};

// Static method to get message statistics for a group
messageSchema.statics.getGroupStats = async function(groupId) {
  const stats = await this.aggregate([
    { $match: { group: new mongoose.Types.ObjectId(groupId), isDeleted: false } },
    {
      $group: {
        _id: '$messageType',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalSize: stat.totalSize || 0
    };
    return acc;
  }, {});
};

module.exports = mongoose.model('Message', messageSchema);
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
  }]
}, {
  timestamps: true
});

// Create compound indexes for efficient querying
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ sender: 1, group: 1, createdAt: -1 });
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

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

module.exports = mongoose.model('Message', messageSchema);
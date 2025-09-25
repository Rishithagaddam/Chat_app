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
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  isRead: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
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
messageSchema.index({ receiver: 1, 'isRead.user': 1 });

// Virtual for conversation participants
messageSchema.virtual('participants').get(function() {
  if (this.group) {
    return null; // For group messages, participants are in the group model
  }
  return [this.sender, this.receiver];
});

// Method to check if message is read by user
messageSchema.methods.isReadByUser = function(userId) {
  return this.isRead.some(read => read.user.toString() === userId.toString());
};

// Method to mark as read by user
messageSchema.methods.markAsReadBy = function(userId) {
  if (!this.isReadByUser(userId)) {
    this.isRead.push({ user: userId });
  }
};

module.exports = mongoose.model('Message', messageSchema);
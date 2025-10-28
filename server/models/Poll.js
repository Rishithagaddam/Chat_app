const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Poll title is required'],
    trim: true,
    maxlength: [200, 'Poll title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Poll description cannot be more than 500 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Poll creator is required']
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group is required for poll']
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Option text cannot be more than 100 characters']
    },
    votes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  settings: {
    allowMultipleVotes: {
      type: Boolean,
      default: false
    },
    anonymousVoting: {
      type: Boolean,
      default: false
    },
    showResultsBeforeVoting: {
      type: Boolean,
      default: false
    },
    allowAddOptions: {
      type: Boolean,
      default: false
    }
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default to 7 days from creation
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
pollSchema.index({ group: 1, createdAt: -1 });
pollSchema.index({ creator: 1 });
pollSchema.index({ expiresAt: 1 });

// Virtual for checking if poll is expired
pollSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Method to check if user has voted
pollSchema.methods.hasUserVoted = function(userId) {
  return this.options.some(option => 
    option.votes.some(vote => vote.user.toString() === userId.toString())
  );
};

// Method to get user's vote
pollSchema.methods.getUserVote = function(userId) {
  for (let option of this.options) {
    const vote = option.votes.find(vote => vote.user.toString() === userId.toString());
    if (vote) {
      return option._id;
    }
  }
  return null;
};

// Method to add vote
pollSchema.methods.addVote = function(userId, optionId) {
  if (this.isExpired || !this.isActive) {
    throw new Error('Poll is no longer active');
  }
  
  const option = this.options.id(optionId);
  if (!option) {
    throw new Error('Invalid option');
  }
  
  // Check if user already voted
  if (!this.settings.allowMultipleVotes && this.hasUserVoted(userId)) {
    throw new Error('User has already voted');
  }
  
  // Add vote
  option.votes.push({ user: userId });
  this.totalVotes += 1;
  
  return true;
};

// Method to remove vote
pollSchema.methods.removeVote = function(userId, optionId) {
  const option = this.options.id(optionId);
  if (!option) {
    throw new Error('Invalid option');
  }
  
  const voteIndex = option.votes.findIndex(vote => vote.user.toString() === userId.toString());
  if (voteIndex > -1) {
    option.votes.splice(voteIndex, 1);
    this.totalVotes -= 1;
    return true;
  }
  
  return false;
};

// Method to get poll results
pollSchema.methods.getResults = function() {
  return this.options.map(option => ({
    _id: option._id,
    text: option.text,
    voteCount: option.votes.length,
    percentage: this.totalVotes > 0 ? (option.votes.length / this.totalVotes * 100).toFixed(1) : 0,
    voters: this.settings.anonymousVoting ? [] : option.votes.map(vote => vote.user)
  }));
};

module.exports = mongoose.model('Poll', pollSchema);

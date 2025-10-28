const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },

  // Contacts now stored as array of ObjectId
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Contact request tracking
  requestsSent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  requestsReceived: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // New profile fields
  profilePicture: {
    type: String,
    default: null // URL to profile image
  },
  bio: {
    type: String,
    default: '',
    maxlength: [150, 'Bio cannot be more than 150 characters']
  },
  statusMessage: {
    type: String,
    default: '',
    maxlength: [100, 'Status message cannot be more than 100 characters']
  }

}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
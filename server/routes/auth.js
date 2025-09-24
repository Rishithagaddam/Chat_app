const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('Registering user with data:', req.body);
    const { name, email, phoneNumber, password } = req.body;

    // Validation
    if (!name || !email || !phoneNumber || !password) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (password.length < 6) {
      console.log('Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Convert email to lowercase for consistent storage
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Checking for existing user with email:', normalizedEmail);

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phoneNumber }
      ]
    });

    if (existingUser) {
      console.log('User already exists');
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone number'
      });
    }

    console.log('Creating new user...');
    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phoneNumber: phoneNumber.trim(),
      password
    });
    console.log('User created successfully with ID:', user._id);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isOnline: user.isOnline,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `User already exists with this ${field}`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt with data:', req.body);
    const { emailOrPhone, password } = req.body;

    // Validation
    if (!emailOrPhone || !password) {
      console.log('Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone and password'
      });
    }

    // Convert email to lowercase if it's an email
    const searchValue = emailOrPhone.includes('@') ? emailOrPhone.toLowerCase() : emailOrPhone;
    console.log('Searching for user with:', searchValue);

    // Check if user exists (by email or phone)
    const user = await User.findOne({
      $or: [
        { email: searchValue },
        { phoneNumber: searchValue }
      ]
    });

    console.log('Found user:', user ? 'Yes' : 'No');
    if (!user) {
      console.log('User not found in database');
      return res.status(400).json({
        success: false,
        message: 'User not found with this email or phone number'
      });
    }

    console.log('Checking password match...');
    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    console.log('Password match:', isPasswordMatch);

    if (!isPasswordMatch) {
      console.log('Invalid password provided');
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Update user online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);
    console.log('Login successful for user:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Update user offline status
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date()
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

module.exports = router;
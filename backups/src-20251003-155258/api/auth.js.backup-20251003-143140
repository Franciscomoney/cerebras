const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models');
const { sendVerificationEmail } = require('../services/emailService');
const logger = require('../utils/logger');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await user.comparePassword(password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isVerified && !user.isAdmin) {
      return res.status(401).json({ error: 'Please verify your email first' });
    }
    
    // Set session
    req.session.userId = user.id;
    req.session.isAdmin = user.isAdmin;
    req.session.userEmail = user.email;
    
    // Update last login
    await user.update({ lastLoginAt: new Date() });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const verificationToken = uuidv4();
    const user = await User.create({
      email,
      password,
      verificationToken,
      isVerified: false,
      isAdmin: false
    });
    
    await sendVerificationEmail(email, verificationToken);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.'
    });
    
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }
    
    const user = await User.findOne({ where: { verificationToken: token } });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    await user.update({
      isVerified: true,
      verificationToken: null
    });
    
    res.json({
      success: true,
      message: 'Email verified successfully. You can now login.'
    });
    
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check auth status
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: !!req.session.userId,
    isAdmin: !!req.session.isAdmin,
    email: req.session.userEmail || null
  });
});

module.exports = router;
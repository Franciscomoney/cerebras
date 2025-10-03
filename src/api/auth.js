const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { User, Alert } = require('../models');
const { sendVerificationEmail, sendAlertEmail } = require('../services/emailService');
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

// Register with alert data (for homepage flow)
router.post('/register-with-alert', async (req, res) => {
  try {
    const { email, password, alertName, keywords } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    if (!alertName || !keywords) {
      return res.status(400).json({ error: 'Alert name and keywords required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user with pending alert data (DO NOT create alert yet)
    const user = await User.create({
      email,
      password: password || `Intel${crypto.randomBytes(8).toString('hex')}!`,
      verificationToken,
      isVerified: false,
      isAdmin: false,
      pendingAlertData: {
        alertName,
        keywords,
        frequency: 'weekly',
        createdAt: new Date().toISOString()
      }
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken, alertName);

    logger.info(`User registered with pending alert: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Check your email to verify your account and activate your alert.'
    });

  } catch (error) {
    logger.error('Registration with alert error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify email via GET with token in URL path
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Verification Failed</h1>
          <p>Invalid verification link. Please check your email for the correct link.</p>
          <p><a href="/">Return to Homepage</a></p>
        </body>
        </html>
      `);
    }

    const user = await User.findOne({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Invalid Verification Token</h1>
          <p>This verification link is invalid or has already been used.</p>
          <p><a href="/">Return to Homepage</a></p>
        </body>
        </html>
      `);
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationToken = null;
    await user.save();

    logger.info(`Email verified for: ${user.email}`);

    // NOW create the alert from pendingAlertData
    let alert = null;
    if (user.pendingAlertData) {
      const alertData = user.pendingAlertData;
      alert = await Alert.create({
        userId: user.id,
        name: alertData.alertName,
        keywords: alertData.keywords,
        isActive: true,
        frequency: alertData.frequency || 'weekly'
      });

      logger.info(`Alert created after verification: ${alert.name} for ${user.email}`);

      // Clear pending data
      user.pendingAlertData = null;
      await user.save();

      // Send immediate welcome email with first alert
      try {
        const alertProcessor = require('../workers/alertProcessor');
        await alertProcessor.sendAlertEmail(alert.id);
        logger.info(`Welcome email sent to ${user.email}`);
      } catch (emailError) {
        logger.error('Error sending welcome email:', emailError);
        // Don't fail verification if email fails
      }
    }

    // Redirect to success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified!</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          .success { color: #16a34a; }
          .card {
            background: #f0fdf4;
            border: 2px solid #16a34a;
            border-radius: 8px;
            padding: 30px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px;
          }
          .button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1 class="success">✅ Email Verified Successfully!</h1>
          <p><strong>Your intelligence alert has been activated.</strong></p>
          ${alert ? `
            <p>Alert Name: <strong>${alert.name}</strong></p>
            <p>Keywords: ${alert.keywords}</p>
            <p>Frequency: Weekly</p>
            <hr>
            <p>📧 You should receive your first intelligence report shortly!</p>
          ` : ''}
          <p>You'll receive weekly intelligence reports every ${process.env.ALERT_DAY || 'Monday'}.</p>
        </div>
        <a href="/login" class="button">Login to Dashboard</a>
        <a href="/" class="button">Return to Homepage</a>
      </body>
      </html>
    `);

  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .error { color: #dc2626; }
        </style>
      </head>
      <body>
        <h1 class="error">❌ Verification Failed</h1>
        <p>An error occurred while verifying your email. Please try again or contact support.</p>
        <p><a href="/">Return to Homepage</a></p>
      </body>
      </html>
    `);
  }
});

// Legacy verify email endpoint (query parameter)
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
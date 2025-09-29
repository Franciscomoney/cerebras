const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { User, Alert } = require('../models');
const { sendVerificationEmail } = require('../services/emailService');
const logger = require('../utils/logger');

// Create a new alert
router.post('/', async (req, res) => {
  try {
    const { query, email } = req.body;
    
    if (!query || !email) {
      return res.status(400).json({ error: 'Query and email are required' });
    }
    
    // Check if user exists or create new one
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Create new user with verification token
      const verificationToken = uuidv4();
      user = await User.create({
        email,
        verificationToken,
        isVerified: false,
      });
      
      // Send verification email
      await sendVerificationEmail(user.email, verificationToken);
      logger.info(`New user created: ${email}`);
    }
    
    // Create the alert
    const alert = await Alert.create({
      userId: user.id,
      query,
      frequency: 'weekly',
      isActive: !user.isVerified, // Will be activated after email verification
    });
    
    logger.info(`Alert created for user ${email}: ${query}`);
    
    res.status(201).json({
      message: user.isVerified 
        ? 'Alert created successfully' 
        : 'Alert created. Please check your email to verify your account.',
      alertId: alert.id,
    });
    
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Get user's alerts (requires authentication)
router.get('/', async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const alerts = await Alert.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    
    res.json(alerts);
    
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Update an alert
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const alert = await Alert.findOne({
      where: { id, userId },
    });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    const { query, frequency, isActive } = req.body;
    
    await alert.update({
      query: query || alert.query,
      frequency: frequency || alert.frequency,
      isActive: isActive !== undefined ? isActive : alert.isActive,
    });
    
    res.json(alert);
    
  } catch (error) {
    logger.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete an alert
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const deleted = await Alert.destroy({
      where: { id, userId },
    });
    
    if (deleted === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ message: 'Alert deleted successfully' });
    
  } catch (error) {
    logger.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

module.exports = router;
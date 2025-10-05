const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { User, Alert } = require('../models');
const { sendVerificationEmail } = require('../services/emailService');
const logger = require('../utils/logger');

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Create a new alert
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, keywords, frequency = 'weekly', isActive = true } = req.body;
    const userId = req.session.userId;
    
    if (!name || !keywords) {
      return res.status(400).json({ error: 'Name and keywords are required' });
    }
    
    // Create the alert
    const alert = await Alert.create({
      userId,
      name,
      keywords,
      query: keywords, // Keep for backward compatibility
      frequency,
      isActive
    });
    
    logger.info(`Alert created for user ${userId}: ${name}`);
    
    res.status(201).json(alert);
    
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Get alert statistics - MUST BE BEFORE /:id route
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get active alerts count
    const activeAlerts = await Alert.count({
      where: { userId, isActive: true }
    });
    
    // Get total reports sent
    const { Report, EmailLog } = require('../models');
    const totalReports = await Report.count({
      include: [
        {
          model: Alert,
          as: 'alert',
          where: { userId }
        }
      ]
    });
    
    // Get last email date
    const lastEmail = await EmailLog.findOne({
      where: { userId },
      order: [['sentAt', 'DESC']]
    });
    
    res.json({
      activeAlerts,
      totalReports,
      lastEmailDate: lastEmail?.sentAt || null
    });
    
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get user's alerts (requires authentication)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
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

// Get alert by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    
    const alert = await Alert.findOne({
      where: { id, userId }
    });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(alert);
    
  } catch (error) {
    logger.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// Update an alert
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    
    const alert = await Alert.findOne({
      where: { id, userId },
    });
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    const { name, keywords, query, frequency, isActive } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (keywords !== undefined) {
      updateData.keywords = keywords;
      updateData.query = keywords; // Keep for backward compatibility
    }
    if (query !== undefined) updateData.query = query;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    await alert.update(updateData);
    
    res.json(alert);
    
  } catch (error) {
    logger.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete an alert
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    
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
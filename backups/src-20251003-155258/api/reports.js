const express = require('express');
const router = express.Router();
const { Report, Alert, Document, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get user's reports
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { page = 1, limit = 12, alertId, sentiment, dateRange } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build where clause for filtering
    const whereClause = {};
    const alertWhereClause = { userId };
    
    if (alertId) {
      whereClause.alertId = alertId;
    }
    
    if (dateRange) {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (startDate) {
        whereClause.sentAt = { [Op.gte]: startDate };
      }
    }
    
    // Get reports with documents and alerts
    const { count, rows: reports } = await Report.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Alert,
          as: 'alert',
          where: alertWhereClause,
          attributes: ['id', 'name', 'keywords']
        },
        {
          model: Document,
          as: 'document',
          attributes: ['id', 'code', 'title', 'aiAnalysis', 'processedAt'],
          where: sentiment ? {
            'aiAnalysis.sentiment': sentiment
          } : {}
        }
      ],
      order: [['sentAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      reports,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalReports: count
    });
    
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get report details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;
    
    const report = await Report.findOne({
      where: { id },
      include: [
        {
          model: Alert,
          as: 'alert',
          where: { userId },
          attributes: ['id', 'name', 'keywords']
        },
        {
          model: Document,
          as: 'document',
          attributes: ['id', 'code', 'title', 'content', 'aiAnalysis', 'pdfUrl', 'processedAt']
        }
      ]
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
    
  } catch (error) {
    logger.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Mark report as read
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;
    
    const report = await Report.findOne({
      where: { id },
      include: [{
        model: Alert,
        as: 'alert',
        where: { userId }
      }]
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    await report.update({ readAt: new Date() });
    
    res.json({ success: true });
    
  } catch (error) {
    logger.error('Error marking report as read:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

module.exports = router;
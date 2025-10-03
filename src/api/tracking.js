const express = require('express');
const router = express.Router();
const { EmailLog, Alert, Document } = require('../models');
const logger = require('../utils/logger');

// Email open tracking pixel
router.get('/email-open', async (req, res) => {
  try {
    const { alertId, userId } = req.query;
    
    if (alertId && userId) {
      // Update email log to mark as opened
      await EmailLog.update(
        { 
          openedAt: new Date(),
          status: 'opened'
        },
        {
          where: {
            alertId,
            userId,
            openedAt: null // Only update if not already marked as opened
          }
        }
      );
      
      logger.info(`Email opened for alert ${alertId} by user ${userId}`);
    }
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.end(pixel);
    
  } catch (error) {
    logger.error('Error tracking email open:', error);
    // Still return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length
    });
    res.end(pixel);
  }
});

// Track link clicks
router.get('/click', async (req, res) => {
  try {
    const { url, alertId, userId, documentId, type = 'document' } = req.query;
    
    if (!url) {
      return res.status(400).send('Missing URL parameter');
    }
    
    // Log the click
    if (alertId && userId) {
      await EmailLog.create({
        userId,
        alertId,
        emailType: 'click',
        sentAt: new Date(),
        metadata: {
          url,
          documentId,
          type // 'document', 'sponsored', 'dashboard', etc.
        }
      });
      
      // Update email status to clicked if not already
      await EmailLog.update(
        { 
          clickedAt: new Date(),
          status: 'clicked'
        },
        {
          where: {
            alertId,
            userId,
            emailType: 'alert',
            clickedAt: null
          }
        }
      );
      
      logger.info(`Link clicked for alert ${alertId} by user ${userId}: ${type}`);
    }
    
    // Redirect to the actual URL
    res.redirect(decodeURIComponent(url));
    
  } catch (error) {
    logger.error('Error tracking click:', error);
    // Still redirect even on error
    const url = req.query.url || '/';
    res.redirect(decodeURIComponent(url));
  }
});

// Get analytics data for admin
router.get('/analytics', async (req, res) => {
  try {
    // Check admin access
    if (!req.session?.isAdmin) {
      return res.status(401).json({ error: 'Admin access required' });
    }
    
    const { startDate, endDate } = req.query;
    const whereClause = {};
    
    if (startDate || endDate) {
      whereClause.sentAt = {};
      if (startDate) whereClause.sentAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.sentAt[Op.lte] = new Date(endDate);
    }
    
    // Get email metrics
    const emailStats = await EmailLog.findAll({
      where: {
        ...whereClause,
        emailType: 'alert'
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSent'],
        [sequelize.fn('COUNT', sequelize.col('openedAt')), 'totalOpened'],
        [sequelize.fn('COUNT', sequelize.col('clickedAt')), 'totalClicked'],
        [sequelize.fn('DATE', sequelize.col('sentAt')), 'date']
      ],
      group: [sequelize.fn('DATE', sequelize.col('sentAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('sentAt')), 'DESC']]
    });
    
    // Calculate rates
    const openRate = emailStats.reduce((acc, day) => {
      const rate = day.totalSent > 0 ? (day.totalOpened / day.totalSent) * 100 : 0;
      return acc + rate;
    }, 0) / emailStats.length;
    
    const clickRate = emailStats.reduce((acc, day) => {
      const rate = day.totalOpened > 0 ? (day.totalClicked / day.totalOpened) * 100 : 0;
      return acc + rate;
    }, 0) / emailStats.length;
    
    // Get document engagement
    const documentEngagement = await EmailLog.findAll({
      where: {
        ...whereClause,
        emailType: 'click',
        'metadata.type': 'document'
      },
      attributes: [
        'metadata.documentId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'clicks']
      ],
      group: ['metadata.documentId'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      include: [{
        model: Document,
        as: 'document',
        attributes: ['code', 'title']
      }]
    });
    
    res.json({
      summary: {
        averageOpenRate: openRate.toFixed(1),
        averageClickRate: clickRate.toFixed(1),
        totalEmailsSent: emailStats.reduce((acc, day) => acc + day.totalSent, 0),
        totalOpens: emailStats.reduce((acc, day) => acc + day.totalOpened, 0),
        totalClicks: emailStats.reduce((acc, day) => acc + day.totalClicked, 0)
      },
      dailyStats: emailStats,
      topDocuments: documentEngagement
    });
    
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
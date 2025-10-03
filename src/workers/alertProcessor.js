const { Op } = require('sequelize');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const CerebrasService = require('../services/cerebras');
const { Alert, User, Document, TopicArea, Sponsor, Report, sequelize } = require('../models');

class AlertProcessor {
  constructor() {
    this.cerebras = new CerebrasService();
  }

  async processAlerts() {
    logger.info('Starting alert processing...');
    
    try {
      // Get all active alerts that need processing
      const alerts = await Alert.findAll({
        where: {
          isActive: true,
          [Op.or]: [
            { lastSentAt: null },
            {
              lastSentAt: {
                [Op.lt]: this.getFrequencyCutoff('weekly') // For MVP, we're using weekly
              }
            }
          ]
        },
        include: [
          {
            model: User,
            as: 'user',
            where: { isVerified: true }
          }
        ]
      });
      
      logger.info(`Found ${alerts.length} alerts to process`);
      
      let successCount = 0;
      let failureCount = 0;
      
      // Process each alert
      for (const alert of alerts) {
        try {
          await this.processAlert(alert);
          successCount++;
        } catch (error) {
          logger.error(`Error processing alert ${alert.id}:`, error);
          failureCount++;
        }
      }
      
      logger.info(`Alert processing complete. Success: ${successCount}, Failures: ${failureCount}`);
      
      return {
        processed: alerts.length,
        success: successCount,
        failures: failureCount
      };
      
    } catch (error) {
      logger.error('Error in alert processing:', error);
      throw error;
    }
  }

  async processAlert(alert) {
    const user = alert.user;
    
    logger.info(`Processing alert ${alert.id} for user ${user.email}`);
    
    try {
      // Find relevant documents based on alert keywords
      const documents = await this.findRelevantDocuments(alert);
      
      if (documents.length === 0) {
        logger.info(`No new documents found for alert ${alert.id}`);
        return;
      }
      
      // Personalize summaries for the user's specific interests
      const personalizedDocs = await this.personalizeDocuments(documents, alert);
      
      // Get top 5 most relevant documents
      const topDocuments = personalizedDocs
        .sort((a, b) => (b.aiAnalysis?.relevanceScore || 0) - (a.aiAnalysis?.relevanceScore || 0))
        .slice(0, 5);
      
      // Get sponsored content if applicable
      const sponsoredContent = await this.getRelevantSponsoredContent(alert);
      
      // Send email
      await emailService.sendAlertEmail(user, alert, topDocuments, sponsoredContent);
      
      // Update alert last sent timestamp
      await alert.update({ lastSentAt: new Date() });
      
      // Create report records for tracking
      for (const doc of topDocuments) {
        await Report.create({
          alertId: alert.id,
          documentId: doc.id,
          sentAt: new Date()
        });
      }
      
      logger.info(`Alert ${alert.id} processed successfully. Sent ${topDocuments.length} documents.`);
      
    } catch (error) {
      logger.error(`Error processing alert ${alert.id}:`, error);
      throw error;
    }
  }

  async findRelevantDocuments(alert) {
    const cutoffDate = this.getFrequencyCutoff(alert.frequency);
    
    // Parse alert keywords
    const keywords = this.parseKeywords(alert.keywords);
    
    // Find documents that match keywords and are recent
    const documents = await Document.findAll({
      where: {
        processedAt: {
          [Op.gte]: cutoffDate
        },
        [Op.or]: [
          // Match in title
          {
            title: {
              [Op.or]: keywords.map(keyword => ({
                [Op.iLike]: `%${keyword}%`
              }))
            }
          },
          // Match in AI themes
          sequelize.literal(`"aiAnalysis"->>'themes' ILIKE ANY(ARRAY[${keywords.map(k => `'%${k}%'`).join(',')}])`)
        ]
      },
      include: [{
        model: sequelize.models.Source,
        as: 'source',
        include: [{
          model: TopicArea,
          as: 'topicArea'
        }]
      }],
      order: [['processedAt', 'DESC']]
    });
    
    return documents;
  }

  async personalizeDocuments(documents, alert) {
    // For each document, generate a personalized summary based on user's interests
    const personalizedDocs = [];
    
    for (const doc of documents) {
      try {
        // Skip if no content
        if (!doc.content || !doc.aiAnalysis) {
          personalizedDocs.push(doc);
          continue;
        }
        
        // Generate personalized summary
        const personalizedAnalysis = await this.cerebras.personalizeDocument(
          doc.content,
          alert.keywords,
          doc.aiAnalysis
        );
        
        // Create a copy with personalized analysis
        const personalizedDoc = {
          ...doc.toJSON(),
          aiAnalysis: {
            ...doc.aiAnalysis,
            ...personalizedAnalysis
          }
        };
        
        personalizedDocs.push(personalizedDoc);
        
      } catch (error) {
        logger.error(`Error personalizing document ${doc.id}:`, error);
        personalizedDocs.push(doc);
      }
    }
    
    return personalizedDocs;
  }

  async getRelevantSponsoredContent(alert) {
    try {
      // Find active sponsored content for this alert's topics
      const sponsor = await Sponsor.findOne({
        where: {
          isActive: true,
          startDate: { [Op.lte]: new Date() },
          endDate: { [Op.gte]: new Date() }
        },
        include: [{
          model: TopicArea,
          as: 'topicAreas',
          where: {
            keywords: {
              [Op.overlap]: this.parseKeywords(alert.keywords)
            }
          }
        }],
        order: sequelize.random() // Random selection if multiple
      });
      
      if (!sponsor) return null;
      
      // Track impression
      await sponsor.increment('impressions');
      
      return {
        title: sponsor.title,
        description: sponsor.description,
        link: sponsor.link
      };
      
    } catch (error) {
      logger.error('Error getting sponsored content:', error);
      return null;
    }
  }

  parseKeywords(keywordsString) {
    if (!keywordsString) return [];
    return keywordsString
      .split(/[,\s]+/)
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }
  
  getFrequencyCutoff(frequency) {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default weekly
    }
  }
  
  // Run as a scheduled job
  async runScheduledJob() {
    try {
      logger.info('Alert processor scheduled job starting...');
      const result = await this.processAlerts();
      logger.info('Alert processor scheduled job completed:', result);
    } catch (error) {
      logger.error('Alert processor scheduled job failed:', error);
    }
  }

  // Send alert email by ID (for welcome emails)
  async sendAlertEmail(alertId) {
    try {
      const alert = await Alert.findByPk(alertId, {
        include: [{
          model: User,
          as: 'user',
          where: { isVerified: true }
        }]
      });

      if (!alert) {
        throw new Error(`Alert ${alertId} not found or user not verified`);
      }

      await this.processAlert(alert);
      logger.info(`Welcome email sent for alert ${alertId}`);
    } catch (error) {
      logger.error(`Error sending welcome email for alert ${alertId}:`, error);
      throw error;
    }
  }
}

// Export both the class and a singleton instance
const alertProcessorInstance = new AlertProcessor();

module.exports = alertProcessorInstance;
module.exports.AlertProcessor = AlertProcessor;
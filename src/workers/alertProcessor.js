const { Op } = require('sequelize');
const logger = require('../utils/logger');
const DocumentProcessor = require('../services/documentProcessor');
const CerebrasService = require('../services/cerebras');
const emailService = require('../services/email');
const { Alert, Document, Summary, Source, TopicArea, User, EmailLog, Sponsor } = require('../models');

class AlertProcessor {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.documentProcessor = new DocumentProcessor(sequelize);
    this.cerebrasService = new CerebrasService();
  }

  async processAlerts() {
    try {
      logger.info('Starting alert processing cycle');
      
      const now = new Date();
      const activeAlerts = await Alert.findAll({
        where: {
          isActive: true,
          [Op.or]: [
            { lastSentAt: null },
            {
              frequency: 'daily',
              lastSentAt: { [Op.lt]: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
            },
            {
              frequency: 'weekly',
              lastSentAt: { [Op.lt]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
            },
            {
              frequency: 'monthly',
              lastSentAt: { [Op.lt]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
            }
          ]
        },
        include: [{ model: Document, as: 'documents' }]
      });

      logger.info(`Found ${activeAlerts.length} alerts to process`);

      for (const alert of activeAlerts) {
        try {
          await this.processUserAlert(alert);
        } catch (error) {
          logger.error(`Failed to process alert ${alert.id}`, { error: error.message });
        }
      }

      logger.info('Alert processing cycle completed');
    } catch (error) {
      logger.error('Alert processing cycle failed', { error: error.message });
      throw error;
    }
  }

  async processUserAlert(alert) {
    logger.info(`Processing alert for user ${alert.userId}`, { alertId: alert.id });
    
    try {
      // Fetch documents for the alert
      const documents = await this.fetchDocumentsForAlert(alert);
      
      if (documents.length === 0) {
        logger.info('No new documents found for alert', { alertId: alert.id });
        return;
      }

      // Analyze documents
      const analysis = await this.analyzeDocuments(documents, alert);
      
      // Generate email content
      const emailContent = await this.generateEmailContent(analysis, alert);
      
      // Send email
      await this.sendAlertEmail(emailContent, alert);
      
      // Update last sent timestamp
      await alert.update({ lastSentAt: new Date() });
      
      // Save summary to database
      await Summary.create({
        id: require('uuid').v4(),
        alertId: alert.id,
        content: emailContent,
        createdAt: new Date()
      });

      logger.info(`Alert processed successfully for user ${alert.userId}`, { alertId: alert.id });
    } catch (error) {
      logger.error(`Failed processing alert for user ${alert.userId}`, { 
        alertId: alert.id, 
        error: error.message 
      });
      throw error;
    }
  }

  async fetchDocumentsForAlert(alert) {
    logger.info('Fetching documents for alert', { alertId: alert.id });
    
    try {
      const sources = await alert.getSources();
      const documents = [];
      
      for (const source of sources) {
        try {
          const sourceDocs = await this.documentProcessor.processDocument(source);
          documents.push(...sourceDocs);
        } catch (error) {
          logger.error(`Failed to fetch documents from source ${source.name}`, { 
            sourceId: source.id, 
            error: error.message 
          });
        }
      }
      
      // Filter documents by date (only new since last alert)
      const lastSentAt = alert.lastSentAt || new Date(0);
      const newDocuments = documents.filter(doc => 
        doc.publishedAt && new Date(doc.publishedAt) > lastSentAt
      );
      
      logger.info(`Fetched ${newDocuments.length} new documents for alert`, { alertId: alert.id });
      return newDocuments;
    } catch (error) {
      logger.error('Document fetching failed', { alertId: alert.id, error: error.message });
      throw error;
    }
  }

  async analyzeDocuments(documents, alert) {
    logger.info('Analyzing documents with Cerebras', { 
      alertId: alert.id, 
      documentCount: documents.length 
    });
    
    try {
      const documentContents = documents.map(doc => doc.markdownContent);
      const analysis = await this.cerebrasService.generateSummary(documentContents, alert.query);
      
      // Add individual document analysis
      const detailedAnalysis = [];
      for (const document of documents) {
        try {
          const docAnalysis = await this.cerebrasService.analyzeDocument(
            document.markdownContent, 
            alert.query.split(' ')
          );
          detailedAnalysis.push({
            documentId: document.id,
            title: document.title,
            ...docAnalysis
          });
        } catch (error) {
          logger.error(`Failed to analyze document ${document.id}`, { error: error.message });
        }
      }
      
      return {
        summary: analysis,
        detailedAnalysis: detailedAnalysis
      };
    } catch (error) {
      logger.error('Document analysis failed', { alertId: alert.id, error: error.message });
      throw error;
    }
  }

  async generateEmailContent(analysis, alert) {
    logger.info('Generating email content', { alertId: alert.id });
    
    try {
      const { summary, detailedAnalysis } = analysis;
      const user = await alert.getUser();
      
      // Generate sponsored content if applicable
      let sponsoredContent = null;
      if (alert.settings.includeSponsored) {
        sponsoredContent = await this.generateSponsoredContent(alert);
      }
      
      // Create HTML email template
      const htmlContent = this.createEmailTemplate({
        user,
        alert,
        summary,
        detailedAnalysis,
        sponsoredContent
      });
      
      return htmlContent;
    } catch (error) {
      logger.error('Email content generation failed', { alertId: alert.id, error: error.message });
      throw error;
    }
  }

  createEmailTemplate(data) {
    const { user, alert, summary, detailedAnalysis, sponsoredContent } = data;
    
    // Executive summary section
    const executiveSummarySection = `
      <div class="executive-summary">
        <h2>Executive Summary</h2>
        <p>${summary.executiveSummary}</p>
      </div>
    `;
    
    // Key insights section
    const insightsSection = `
      <div class="key-insights">
        <h2>Key Insights</h2>
        <ul>
          ${summary.detailedInsights.map(insight => 
            `<li>${insight.text} <em>(${insight.citation})</em></li>`
          ).join('')}
        </ul>
      </div>
    `;
    
    // Detailed analysis section
    const detailedAnalysisSection = `
      <div class="detailed-analysis">
        <h2>Detailed Analysis</h2>
        ${detailedAnalysis.map(item => `
          <div class="analysis-item">
            <h3>${item.title}</h3>
            <p><strong>Themes:</strong> ${item.themes.join(', ')}</p>
            <p><strong>Sentiment:</strong> ${item.sentiment}</p>
            <p><strong>Urgency:</strong> ${item.urgency}</p>
            <p><strong>Relevance Score:</strong> ${item.relevanceScore}/100</p>
          </div>
        `).join('')}
      </div>
    `;
    
    // Sponsored content section
    const sponsoredSection = sponsoredContent ? `
      <div class="sponsored-content">
        <h2>Sponsored Content</h2>
        <p>${sponsoredContent}</p>
      </div>
    ` : '';
    
    // Full reports section
    const reportsSection = `
      <div class="full-reports">
        <h2>Full Reports</h2>
        <p>Access all documents in your dashboard:</p>
        <p><a href="https://yourapp.com/dashboard">View Dashboard</a></p>
      </div>
    `;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Intelligence Alert: ${alert.query}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #eee;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            h1, h2, h3 {
              color: #2c3e50;
            }
            .executive-summary, .key-insights, .detailed-analysis, .sponsored-content, .full-reports {
              margin-bottom: 30px;
            }
            ul {
              padding-left: 20px;
            }
            a {
              color: #3498db;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            .analysis-item {
              border: 1px solid #eee;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 5px;
            }
            @media (max-width: 600px) {
              body {
                padding: 10px;
              }
              .analysis-item {
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Intelligence Alert</h1>
            <p>Topic: ${alert.query}</p>
          </div>
          
          ${executiveSummarySection}
          
          ${insightsSection}
          
          ${detailedAnalysisSection}
          
          ${sponsoredSection}
          
          ${reportsSection}
        </body>
      </html>
    `;
  }

  async generateSponsoredContent(alert) {
    // Placeholder for sponsored content generation
    // In a real implementation, this would fetch from a sponsored content service
    return "Special offer from our partners";
  }

  async sendAlertEmail(emailContent, alert) {
    logger.info('Sending alert email', { alertId: alert.id });
    
    try {
      const user = await alert.getUser();
      
      await emailService.sendEmail({
        to: user.email,
        subject: `Intelligence Alert: ${alert.query}`,
        html: emailContent
      });
      
      logger.info('Alert email sent successfully', { 
        alertId: alert.id, 
        userEmail: user.email 
      });
    } catch (error) {
      logger.error('Failed to send alert email', { 
        alertId: alert.id, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = AlertProcessor;
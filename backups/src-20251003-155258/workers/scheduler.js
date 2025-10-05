const cron = require('node-cron');
const logger = require('../utils/logger');
const AlertProcessor = require('./alertProcessor');
const SourceProcessor = require('./sourceProcessor');
const { sequelize } = require('../models');

class Scheduler {
  constructor() {
    this.alertProcessor = new AlertProcessor();
    this.sourceProcessor = new SourceProcessor();
    this.tasks = [];
    this.isProcessingAlerts = false;
    this.isProcessingSources = false;
  }

  start() {
    logger.info('Starting Scheduler Service');
    
    // Schedule source processing - daily at 2 AM
    const sourceTask = cron.schedule(process.env.PDF_FETCH_SCHEDULE || '0 2 * * *', async () => {
      if (this.isProcessingSources) {
        logger.info('Source processing already running, skipping');
        return;
      }
      
      this.isProcessingSources = true;
      logger.info('Source processing started');
      
      try {
        await this.sourceProcessor.processAllSources();
      } catch (error) {
        logger.error('Error in source processing', { error: error.message });
      } finally {
        this.isProcessingSources = false;
        logger.info('Source processing completed');
      }
    });
    this.tasks.push(sourceTask);
    
    // Schedule alert processing - weekly on TUESDAY at 9 AM ET (14:00 UTC, 2 PM UTC)
    // ET is UTC-5, so 9 AM ET = 2 PM UTC = 14:00 UTC
    const alertTask = cron.schedule(process.env.EMAIL_SEND_SCHEDULE || '0 14 * * 2', async () => {
      if (this.isProcessingAlerts) {
        logger.info('Alert processing already running, skipping');
        return;
      }
      
      this.isProcessingAlerts = true;
      logger.info('Alert processing started - Tuesday 9 AM ET');
      
      try {
        await this.alertProcessor.processAlerts();
      } catch (error) {
        logger.error('Error in alert processing', { error: error.message });
      } finally {
        this.isProcessingAlerts = false;
        logger.info('Alert processing completed');
      }
    });
    this.tasks.push(alertTask);
    
    // Also run alert processing every 4 hours for testing
    const frequentAlertTask = cron.schedule('0 */4 * * *', async () => {
      logger.info('Running frequent alert check');
      try {
        await this.alertProcessor.runScheduledJob();
      } catch (error) {
        logger.error('Error in frequent alert check', { error: error.message });
      }
    });
    this.tasks.push(frequentAlertTask);

    logger.info('Scheduler started with following schedules:');
    logger.info('- Source processing:', process.env.PDF_FETCH_SCHEDULE || '0 2 * * * (Daily at 2 AM)');
    logger.info('- Alert processing:', process.env.EMAIL_SEND_SCHEDULE || '0 14 * * 2 (Tuesday at 9 AM ET / 2 PM UTC)');
    logger.info('- Frequent alert check: Every 4 hours');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  stop() {
    logger.info('Stopping Scheduler Service');
    
    // Stop all cron tasks
    this.tasks.forEach(task => task.stop());
    
    sequelize.close()
      .then(() => {
        logger.info('Database connection closed');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('Error closing database connection', { error: error.message });
        process.exit(1);
      });
  }
}

// Only start the scheduler if this file is run directly
if (require.main === module) {
  const scheduler = new Scheduler();
  scheduler.start();
}

module.exports = Scheduler;

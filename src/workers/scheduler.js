const cron = require('node-cron');
const logger = require('./utils/logger');
const AlertProcessor = require('./workers/alertProcessor');
const { sequelize } = require('./models');

class AlertScheduler {
  constructor() {
    this.alertProcessor = new AlertProcessor(sequelize);
    this.task = null;
    this.isRunning = false;
  }

  start() {
    logger.info('Starting Alert Scheduler');
    
    // Schedule the task to run every 30 minutes
    this.task = cron.schedule('*/30 * * * *', async () => {
      if (this.isRunning) {
        logger.info('Alert processing cycle already running, skipping');
        return;
      }
      
      this.isRunning = true;
      logger.info('Alert processing cycle started');
      
      try {
        await this.alertProcessor.processAlerts();
      } catch (error) {
        logger.error('Error in alert processing cycle', { error: error.message });
      } finally {
        this.isRunning = false;
        logger.info('Alert processing cycle completed');
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  stop() {
    logger.info('Stopping Alert Scheduler');
    if (this.task) {
      this.task.stop();
    }
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

const scheduler = new AlertScheduler();
scheduler.start();
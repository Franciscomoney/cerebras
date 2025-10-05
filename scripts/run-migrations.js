require('dotenv').config();
const { sequelize } = require('../src/models');
const logger = require('../src/utils/logger');

async function runMigrations() {
  try {
    logger.info('Running database migrations...');
    
    // Add name and keywords columns to Alerts table if they don't exist
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if columns already exist
    const alertsTable = await queryInterface.describeTable('Alerts');
    
    if (!alertsTable.name) {
      logger.info('Adding name column to Alerts table...');
      await queryInterface.addColumn('Alerts', 'name', {
        type: sequelize.Sequelize.STRING,
        allowNull: true
      });
      
      // Update existing records
      await sequelize.query(`
        UPDATE "Alerts" 
        SET name = COALESCE(SUBSTRING(query FROM 1 FOR 50), 'Alert')
        WHERE name IS NULL
      `);
      
      // Make column not nullable
      await queryInterface.changeColumn('Alerts', 'name', {
        type: sequelize.Sequelize.STRING,
        allowNull: false
      });
    }
    
    if (!alertsTable.keywords) {
      logger.info('Adding keywords column to Alerts table...');
      await queryInterface.addColumn('Alerts', 'keywords', {
        type: sequelize.Sequelize.TEXT,
        allowNull: true
      });
      
      // Update existing records
      await sequelize.query(`
        UPDATE "Alerts" 
        SET keywords = query
        WHERE keywords IS NULL
      `);
      
      // Make column not nullable
      await queryInterface.changeColumn('Alerts', 'keywords', {
        type: sequelize.Sequelize.TEXT,
        allowNull: false
      });
    }
    
    logger.info('Migrations completed successfully!');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
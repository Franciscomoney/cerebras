require('dotenv').config();
const AlertProcessor = require('../src/workers/alertProcessor');
const logger = require('../src/utils/logger');

async function processAlertsNow() {
  try {
    console.log('\n📧 Franciscomoney Intel - Manual Alert Processing\n');
    
    const processor = new AlertProcessor();
    
    console.log('🔄 Processing all active alerts...\n');
    
    const result = await processor.processAlerts();
    
    console.log('\n✅ Alert processing completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Alerts processed: ${result.processed}`);
    console.log(`   - Emails sent: ${result.success}`);
    console.log(`   - Failed: ${result.failures}`);
    
    if (result.success > 0) {
      console.log('\n🎉 Emails have been sent to users!');
    } else if (result.processed === 0) {
      console.log('\n⚠️  No alerts found to process.');
      console.log('   Make sure you have:');
      console.log('   1. Active alerts in the database');
      console.log('   2. Verified users');
      console.log('   3. Documents that match alert keywords');
    }
    
  } catch (error) {
    console.error('\n❌ Error processing alerts:', error.message);
    logger.error('Manual alert processing failed:', error);
  } finally {
    await require('../src/models').sequelize.close();
  }
}

// Run
console.log('Starting manual alert processing...');
processAlertsNow()
  .then(() => {
    console.log('\n✅ Process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Process failed:', error);
    process.exit(1);
  });
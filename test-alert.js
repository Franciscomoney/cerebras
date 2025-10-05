const AlertProcessor = require('./src/workers/alertProcessor');
const { Alert, User } = require('./src/models');

async function runAlert() {
  try {
    console.log('Starting alert processing test...');
    
    // Get the specific alert
    const alert = await Alert.findOne({
      where: {
        id: 'ea216cf3-c32d-4123-88ae-1fec4f065c37'
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });
    
    if (!alert) {
      console.error('Alert not found!');
      process.exit(1);
    }
    
    console.log(`Found alert: ${alert.name}`);
    console.log(`User: ${alert.user.email}`);
    
    // Create processor instance
    const processor = new AlertProcessor();
    
    // Process the alert
    console.log('Processing alert...');
    await processor.processAlert(alert);
    
    console.log('✅ SUCCESS! Alert processed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runAlert();

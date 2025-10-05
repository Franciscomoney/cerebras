const AlertProcessor = require('./src/workers/alertProcessor');
const { Alert, User } = require('./src/models');

const ALERT_IDS = [
  'ea216cf3-c32d-4123-88ae-1fec4f065c37', // privacy chat law in europe
  '2bf98c2a-1cc7-4230-b1a7-8eb9150493fb'  // military drones
];

async function sendAlerts() {
  const processor = new AlertProcessor();
  
  for (const alertId of ALERT_IDS) {
    try {
      console.log(`\n=== Fetching Alert: ${alertId} ===`);
      
      // Fetch alert with user relationship
      const alert = await Alert.findByPk(alertId, {
        include: [
          {
            model: User,
            as: 'user'
          }
        ]
      });
      
      if (!alert) {
        console.error(`❌ Alert ${alertId} not found`);
        continue;
      }
      
      console.log(`Found alert: ${alert.name} for user ${alert.user.email}`);
      console.log(`Last sent: ${alert.lastSentAt || 'Never'}`);
      
      console.log(`\n=== Processing Alert ===`);
      const result = await processor.processAlert(alert);
      console.log('✅ Success:', JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error(`❌ Failed for ${alertId}:`, error.message);
      console.error(error.stack);
    }
    
    // Wait 3 seconds between alerts
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Check results
  console.log('\n=== Checking Email Logs ===');
  const { sequelize } = require('./src/models');
  
  // Get Francisco's user ID first
  const userResult = await sequelize.query(`
    SELECT id FROM "Users" WHERE email = 'francisco@moctezumatech.com';
  `);
  
  const userId = userResult[0][0]?.id;
  console.log(`Francisco's userId: ${userId}`);
  
  if (userId) {
    const emailLogs = await sequelize.query(`
      SELECT 
        type,
        subject,
        "sentAt",
        "createdAt"
      FROM "EmailLogs"
      WHERE "userId" = '${userId}'
      ORDER BY "createdAt" DESC
      LIMIT 5;
    `);
    console.table(emailLogs[0]);
  }
  
  console.log('\n=== Checking Alert Status ===');
  const alertStatus = await sequelize.query(`
    SELECT 
      name,
      "lastSentAt"
    FROM "Alerts"
    WHERE id IN ('ea216cf3-c32d-4123-88ae-1fec4f065c37', '2bf98c2a-1cc7-4230-b1a7-8eb9150493fb')
    ORDER BY "createdAt" DESC;
  `);
  console.table(alertStatus[0]);
  
  process.exit(0);
}

sendAlerts().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

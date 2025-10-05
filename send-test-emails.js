const { Alert, User } = require('./src/models');
const { sendAlertEmail } = require('./src/services/emailService');
const logger = require('./src/utils/logger');

async function sendTestEmails() {
  try {
    // Get Francisco's alerts
    const alerts = await Alert.findAll({
      where: {
        userId: '882b91a0-e7d0-4e22-b74d-3f03e8044fe3'
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    console.log(`Found ${alerts.length} alerts for Francisco`);

    // Send alert email for each one
    for (const alert of alerts) {
      console.log(`Sending alert email for: ${alert.name}`);
      
      // Send with empty documents array (welcome/test email)
      await sendAlertEmail(alert.user, alert, [], null);

      console.log(`Email sent successfully to ${alert.user.email}`);
    }

    console.log('\nAll emails sent!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

sendTestEmails();

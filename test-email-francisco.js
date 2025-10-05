const emailService = require('./src/services/emailService');
const { User, Alert } = require('./src/models');

async function testEmail() {
  try {
    // Get Francisco's user and alert
    const user = await User.findOne({
      where: { email: 'francisco@moctezumatech.com' }
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    const alert = await Alert.findOne({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']]
    });
    
    if (!alert) {
      console.error('❌ No alerts found');
      return;
    }
    
    console.log(`✅ Found user: ${user.email}`);
    console.log(`✅ Found alert: ${alert.name}`);
    console.log(`\n=== Sending Test Email ===`);
    
    // Create test document data
    const testDocuments = [
      {
        title: 'Test Document: Privacy Chat Law Update',
        summary: 'This is a test document to verify the email system is working. In a production environment, this would contain actual intelligence about privacy chat law in Europe.',
        url: 'https://example.com/test',
        source: 'Test Source',
        publishedAt: new Date()
      }
    ];
    
    // Send email using the email service
    const result = await emailService.sendAlertEmail(
      user,
      alert,
      testDocuments
    );
    
    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
    
    // Update alert's lastSentAt
    await alert.update({ lastSentAt: new Date() });
    console.log('✅ Alert lastSentAt updated');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

testEmail();

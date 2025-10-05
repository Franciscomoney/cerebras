require('dotenv').config();

// Enable test mode - emails will be logged to console instead of sent
process.env.EMAIL_TEST_MODE = 'true';

const { sendVerificationEmail, sendAlertEmail } = require('../src/services/emailService');
const logger = require('../src/utils/logger');

async function testEmailSystem() {
  console.log('\n📧 Testing Franciscomoney Intel Email System\n');
  
  console.log('Current SMTP Configuration:');
  console.log('- Host:', process.env.SMTP_HOST || 'localhost');
  console.log('- Port:', process.env.SMTP_PORT || '25');
  console.log('- From:', process.env.EMAIL_FROM || 'alerts@franciscomoney.com');
  console.log('- Test Mode: ENABLED (emails will be logged, not sent)\n');
  
  // Test verification email
  console.log('1. Testing Verification Email:');
  console.log('================================');
  try {
    await sendVerificationEmail('test@example.com', 'test-token-12345');
    console.log('✅ Verification email would be sent!\n');
  } catch (error) {
    console.log('❌ Verification email failed:', error.message, '\n');
  }
  
  // Test alert email
  console.log('2. Testing Alert Email:');
  console.log('================================');
  
  const mockUser = {
    id: 1,
    email: 'test@example.com'
  };
  
  const mockAlert = {
    id: 1,
    name: 'CBDC Tracker',
    keywords: 'CBDC, digital currency'
  };
  
  const mockReports = [{
    code: 'A001',
    title: 'Test Document About CBDCs',
    aiAnalysis: {
      summary: 'This is a test summary about CBDCs and digital currencies.',
      facts: [
        'Fact 1: CBDCs are being explored by 90% of central banks',
        'Fact 2: China leads in CBDC implementation',
        'Fact 3: Privacy concerns remain a key challenge'
      ],
      relevanceScore: 85,
      sentiment: 'neutral',
      urgency: 'high'
    }
  }];
  
  try {
    await sendAlertEmail(mockUser, mockAlert, mockReports);
    console.log('✅ Alert email would be sent!\n');
  } catch (error) {
    console.log('❌ Alert email failed:', error.message, '\n');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Choose an email service (SendGrid, Gmail, etc.)');
  console.log('2. Update .env with SMTP credentials');
  console.log('3. Remove EMAIL_TEST_MODE to send real emails');
  console.log('\nExample configurations in: .env.sendgrid.example');
}

// Override transporter.sendMail for test mode
const emailService = require('../src/services/emailService');
const originalSendMail = emailService.transporter.sendMail.bind(emailService.transporter);

emailService.transporter.sendMail = function(mailOptions, callback) {
  console.log('\n📨 EMAIL PREVIEW:');
  console.log('To:', mailOptions.to);
  console.log('Subject:', mailOptions.subject);
  console.log('From:', mailOptions.from);
  
  if (mailOptions.html) {
    // Extract text preview from HTML
    const textPreview = mailOptions.html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 200);
    console.log('Preview:', textPreview + '...');
  }
  
  console.log('\nFull email content saved to: email-preview.html');
  require('fs').writeFileSync('email-preview.html', mailOptions.html || mailOptions.text || '');
  
  if (callback) {
    callback(null, { messageId: 'test-message-id' });
  }
  
  return Promise.resolve({ messageId: 'test-message-id' });
};

// Run test
testEmailSystem()
  .then(() => {
    console.log('\n✅ Email system test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
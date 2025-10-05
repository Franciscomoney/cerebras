const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.franciscomoney.com',
  port: 465,
  secure: true,
  auth: {
    user: 'intelligence@franciscomoney.com',
    pass: '@KoeoL58FOaw'
  }
});

async function testEmail() {
  try {
    console.log('Testing SMTP to intelligence@franciscomoney.com...');
    
    const info = await transporter.sendMail({
      from: 'Francisco Money Intel <intelligence@franciscomoney.com>',
      to: 'intelligence@franciscomoney.com',
      subject: 'Test Email - Alert System',
      html: '<h1>Test Email</h1><p>This is a test from the Francisco Money Intel alert system.</p>',
      text: 'Test Email\n\nThis is a test from the Francisco Money Intel alert system.'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    process.exit(0);
  } catch (error) {
    console.error('❌ SMTP Test Failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testEmail();

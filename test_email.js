const nodemailer = require('nodemailer');
require('dotenv').config();

const transporterConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
};

console.log('📧 Email Configuration:');
console.log('Host:', transporterConfig.host);
console.log('Port:', transporterConfig.port);
console.log('Secure:', transporterConfig.secure);
console.log('User:', transporterConfig.auth.user);
console.log('');

const transporter = nodemailer.createTransport(transporterConfig);

async function testEmail() {
  try {
    console.log('🔄 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    console.log('📨 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Email from Franciscomoney Intel',
      text: 'This is a test email to verify SMTP configuration.',
      html: '<p>This is a <strong>test email</strong> to verify SMTP configuration.</p><p>If you receive this, the email server is working correctly!</p>'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    if (error.command) console.error('Failed Command:', error.command);
  }
}

testEmail();

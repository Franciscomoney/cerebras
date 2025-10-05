const nodemailer = require('nodemailer');

// SMTP settings from .env
const transporter = nodemailer.createTransport({
  host: 'mail.franciscomoney.com',
  port: 465,
  secure: true,
  auth: {
    user: 'intelligence@franciscomoney.com',
    pass: '@KoeoL58FOaw'
  }
});

async function sendTest() {
  try {
    console.log('Sending test email...');
    
    const info = await transporter.sendMail({
      from: 'Franciscomoney Intel <intelligence@franciscomoney.com>',
      to: 'francisco@moctezumatech.com',
      subject: 'Test Alert Email from Franciscomoney Intel',
      html: `
        <h1>Alert Test Successful!</h1>
        <p>This is a test email to verify that alerts are working correctly.</p>
        <p>Your alert system is configured and ready to send intelligence reports.</p>
      `
    });

    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    process.exit(0);
  } catch (error) {
    console.error('Error sending email:',error);
    process.exit(1);
  }
}

sendTest();

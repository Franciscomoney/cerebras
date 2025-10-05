const { Alert, User, EmailLog } = require('./src/models');
const nodemailer = require('nodemailer');
const logger = require('./src/utils/logger');

// SMTP configuration
const transporter = nodemailer.createTransporter({
  host: 'mail.franciscomoney.com',
  port: 465,
  secure: true,
  auth: {
    user: 'intelligence@franciscomoney.com',
    pass: '@KoeoL58FOaw'
  }
});

async function sendAlertEmails() {
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

    console.log(`Found ${alerts.length} alerts for Francisco (${alerts[0]?.user.email})`);

    // Send email for each alert
    for (const alert of alerts) {
      console.log(`\nSending alert: ${alert.name}`);
      
      const info = await transporter.sendMail({
        from: 'Franciscomoney Intel <intelligence@franciscomoney.com>',
        to: alert.user.email,
        subject: `Intelligence Alert Active: ${alert.name}`,
        html: `
          <h1>🎯 Your Intelligence Alert is Active!</h1>
          <h2>${alert.name}</h2>
          <p><strong>Keywords:</strong> ${alert.keywords}</p>
          <p>You will receive weekly intelligence reports matching these topics.</p>
          <p>Reports are sent every ${process.env.ALERT_DAY || 'Tuesday'} at 9 AM ET.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">This is an automated message from Franciscomoney Intel.</p>
        `
      });

      console.log(`✅ Email sent: ${info.messageId}`);
      console.log(`   Response: ${info.response}`);

      // Log the email
      await EmailLog.create({
        userId: alert.user.id,
        type: 'alert',
        subject: `Intelligence Alert Active: ${alert.name}`,
        sentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`   Logged in EmailLogs table`);
    }

    console.log('\n✅ All emails sent successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

sendAlertEmails();

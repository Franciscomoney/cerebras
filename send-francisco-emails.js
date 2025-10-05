const { Alert, User, EmailLog } = require('./src/models');
const { transporter } = require('./src/services/emailService');

async function sendEmails() {
  try {
    const alerts = await Alert.findAll({
      where: { userId: '882b91a0-e7d0-4e22-b74d-3f03e8044fe3' },
      include: [{ model: User, as: 'user' }]
    });

    console.log(`Found ${alerts.length} alerts for ${alerts[0]?.user.email}`);

    for (const alert of alerts) {
      console.log(`\nSending: ${alert.name}`);
      
      const info = await transporter.sendMail({
        from: 'Franciscomoney Intel <intelligence@franciscomoney.com>',
        to: alert.user.email,
        subject: `Intelligence Alert Active: ${alert.name}`,
        html: `
          <h1>🎯 Your Intelligence Alert is Active!</h1>
          <h2>${alert.name}</h2>
          <p><strong>Keywords:</strong> ${alert.keywords}</p>
          <p>You will receive weekly intelligence reports matching these topics.</p>
          <p>Reports are sent every Tuesday at 9 AM ET.</p>
        `
      });

      console.log(`✅ Sent: ${info.messageId}`);

      await EmailLog.create({
        userId: alert.user.id,
        type: 'alert',
        subject: `Intelligence Alert Active: ${alert.name}`,
        sentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('\n✅ All emails sent!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

sendEmails();

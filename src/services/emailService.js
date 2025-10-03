const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const generateAlertEmail = require('../templates/emails/alertEmail');
const { EmailLog } = require('../models');

// Create transporter for sending emails
const transporterConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT) || 25,
  secure: process.env.SMTP_SECURE === 'true',
  tls: {
    rejectUnauthorized: false
  }
};

// Add auth if credentials provided
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporterConfig.auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  };
}

const transporter = nodemailer.createTransport(transporterConfig);

// Console mode for testing without SMTP
if (process.env.EMAIL_MODE === 'console') {
  const fs = require('fs').promises;
  const path = require('path');
  
  // Override sendMail to save to file
  transporter.sendMail = async function(mailOptions) {
    const emailDir = path.join(__dirname, '../../storage/emails');
    await fs.mkdir(emailDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${mailOptions.to}.html`;
    const filepath = path.join(emailDir, filename);
    
    const emailContent = `
<!-- Email Details -->
<!-- To: ${mailOptions.to} -->
<!-- Subject: ${mailOptions.subject} -->
<!-- From: ${mailOptions.from} -->
<!-- Date: ${new Date().toLocaleString()} -->

${mailOptions.html || mailOptions.text}
`;
    
    await fs.writeFile(filepath, emailContent);
    logger.info(`Email saved to file: ${filename}`);
    
    return { messageId: `console-${timestamp}` };
  };
  
  logger.info('Email system running in CONSOLE mode - emails will be saved to files');
} else {
  // Test SMTP connection
  transporter.verify(function(error, success) {
    if (error) {
      logger.error('SMTP connection error:', error);
    } else {
      logger.info('SMTP server is ready to send emails');
    }
  });
}

async function sendVerificationEmail(email, token, alertName) {
  try {
    const verificationUrl = `${process.env.SITE_URL}/api/auth/verify-email/${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #2563eb; }
          .alert-info { background: white; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Verify Your Email to Activate Your Intelligence Alert</h1>
          </div>
          <div class="content">
            <p>Welcome to Franciscomoney Intel!</p>

            <div class="alert-info">
              <strong>Your Alert:</strong> ${alertName || 'Intelligence Alert'}<br>
              <strong>Status:</strong> Pending verification
            </div>

            <p>You're one click away from receiving weekly intelligence reports tailored to your interests.</p>

            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">
                ✅ Verify Email & Activate Alert
              </a>
            </p>

            <p style="font-size: 14px; color: #6b7280;">
              Or copy this link: <br>
              <code style="background: #e5e7eb; padding: 5px; border-radius: 3px; display: inline-block; margin-top: 5px;">${verificationUrl}</code>
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p><strong>What happens next?</strong></p>
            <ol>
              <li>Click the verification button above</li>
              <li>Your alert will be activated immediately</li>
              <li>You'll receive your first intelligence report right away</li>
              <li>Weekly reports will arrive every ${process.env.ALERT_DAY || 'Monday'}</li>
            </ol>

            <div class="footer">
              <p>If you didn't create this account, please ignore this email.</p>
              <p>© ${new Date().getFullYear()} Franciscomoney Intel. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `Franciscomoney Intel <${process.env.EMAIL_FROM || 'noreply@franciscomoney.com'}>`,
      to: email,
      subject: `🔔 Verify Your Email to Activate "${alertName || 'Your Alert'}"`,
      html
    });

    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw error;
  }
}

async function sendAlertEmail(user, alert, reports, sponsoredContent = null) {
  try {
    // Prepare email data
    const emailData = {
      userName: user.email.split('@')[0], // Extract name from email
      alertName: alert.name,
      alertId: alert.id,
      userId: user.id,
      reports: reports.map(doc => ({
        code: doc.code,
        title: doc.title,
        summary: doc.aiAnalysis?.summary || 'No summary available',
        keyPoints: doc.aiAnalysis?.facts?.slice(0, 3) || [],
        relevanceScore: doc.aiAnalysis?.relevanceScore || 0,
        sentiment: doc.aiAnalysis?.sentiment || 'neutral',
        urgency: doc.aiAnalysis?.urgency || 'low'
      })),
      sponsoredContent
    };
    
    // Generate email content
    const { html, text } = generateAlertEmail(emailData);
    
    // Send email
    const info = await transporter.sendMail({
      from: `Franciscomoney Intel <${process.env.EMAIL_FROM || 'alerts@franciscomoney.com'}>`,
      to: user.email,
      subject: `Your ${alert.name} Intel: ${reports.length} Key Developments This Week`,
      html,
      text,
      headers: {
        'X-Alert-ID': alert.id.toString(),
        'List-Unsubscribe': `<${process.env.SITE_URL}/unsubscribe?alertId=${alert.id}&token=${generateUnsubscribeToken(user.id, alert.id)}>`
      }
    });
    
    // Log email sent
    await EmailLog.create({
      userId: user.id,
      alertId: alert.id,
      emailType: 'alert',
      sentAt: new Date(),
      messageId: info.messageId,
      status: 'sent'
    });
    
    logger.info(`Alert email sent to ${user.email} for alert ${alert.name}`);
    return info;
  } catch (error) {
    logger.error('Error sending alert email:', error);
    
    // Log failed email
    await EmailLog.create({
      userId: user.id,
      alertId: alert.id,
      emailType: 'alert',
      sentAt: new Date(),
      status: 'failed',
      error: error.message
    });
    
    throw error;
  }
}

async function sendWelcomeEmail(user) {
  try {
    await transporter.sendMail({
      from: `Franciscomoney Intel <${process.env.EMAIL_FROM || 'alerts@franciscomoney.com'}>`,
      to: user.email,
      subject: 'Welcome to Franciscomoney Intel!',
      html: `
        <h1>Welcome to Franciscomoney Intel!</h1>
        <p>Your account has been verified successfully.</p>
        <p>You can now create alerts to receive personalized intelligence reports.</p>
        <p><a href="${process.env.SITE_URL}/dashboard">Go to Dashboard</a></p>
      `,
      text: `Welcome to Franciscomoney Intel!
      
Your account has been verified successfully.
You can now create alerts to receive personalized intelligence reports.

Go to Dashboard: ${process.env.SITE_URL}/dashboard`
    });
    
    logger.info(`Welcome email sent to ${user.email}`);
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    throw error;
  }
}

// Generate unsubscribe token
function generateUnsubscribeToken(userId, alertId) {
  const crypto = require('crypto');
  const data = `${userId}:${alertId}:${process.env.SESSION_SECRET}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

module.exports = {
  sendVerificationEmail,
  sendAlertEmail,
  sendWelcomeEmail,
  transporter,
};
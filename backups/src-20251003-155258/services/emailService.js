const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const generateAlertEmail = require("../templates/emails/alertEmail");
const { EmailLog } = require("../models");

// Create transporter for sending emails
const transporterConfig = {
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT) || 25,
  secure: process.env.SMTP_SECURE === "true",
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
if (process.env.EMAIL_MODE === "console") {
  const fs = require("fs").promises;
  const path = require("path");
  
  // Override sendMail to save to file
  transporter.sendMail = async function(mailOptions) {
    const emailDir = path.join(__dirname, "../../storage/emails");
    await fs.mkdir(emailDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
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
  
  logger.info("Email system running in CONSOLE mode - emails will be saved to files");
} else {
  // Test SMTP connection
  transporter.verify(function(error, success) {
    if (error) {
      logger.error("SMTP connection error:", error);
    } else {
      logger.info("SMTP server is ready to send emails");
    }
  });
}

async function sendVerificationEmail(email, token) {
  try {
    const siteUrl = process.env.SITE_URL || "http://51.178.253.51:3000";
    const verificationUrl = `${siteUrl}/api/auth/verify-email/${token}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@franciscomoney.com",
      to: email,
      subject: "Verify Your Email - Franciscomoney Intel",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #2563eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .url-box { background: #f3f4f6; padding: 12px; border-radius: 4px; word-break: break-all; margin: 15px 0; font-size: 12px; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">📧 Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Welcome to Franciscomoney Intel!</h2>
            <p>Thank you for registering. Please verify your email address to activate your intelligence alert and start receiving curated reports.</p>
            
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            
            <p><strong>Or copy this link:</strong></p>
            <div class="url-box">${verificationUrl}</div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              If you did not create an account, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Franciscomoney Intel. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Franciscomoney Intel!

Please verify your email address by clicking the link below:

${verificationUrl}

If you did not create an account, please ignore this email.

© 2025 Franciscomoney Intel
      `
    });
    
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error("Error sending verification email:", error);
    throw error;
  }
}

async function sendAlertEmail(user, alert, reports, sponsoredContent = null) {
  try {
    const subject = reports.length > 0 
      ? `Your ${alert.name} Intel: ${reports.length} Key Developments This Week`
      : `Welcome to ${alert.name} - Your Alert is Active!`;
    
    // Prepare email data
    const emailData = {
      userName: user.email.split("@")[0],
      alertName: alert.name,
      alertId: alert.id,
      userId: user.id,
      reports: reports.map(doc => ({
        code: doc.code,
        title: doc.title,
        summary: doc.aiAnalysis?.summary || "No summary available",
        keyPoints: doc.aiAnalysis?.facts?.slice(0, 3) || [],
        relevanceScore: doc.aiAnalysis?.relevanceScore || 0,
        sentiment: doc.aiAnalysis?.sentiment || "neutral",
        urgency: doc.aiAnalysis?.urgency || "low"
      })),
      sponsoredContent
    };
    
    // Generate email content
    const { html, text } = generateAlertEmail(emailData);
    
    // Send email
    const info = await transporter.sendMail({
      from: `Franciscomoney Intel <${process.env.EMAIL_FROM || "alerts@franciscomoney.com"}>`,
      to: user.email,
      subject,
      html,
      text,
      headers: {
        "X-Alert-ID": alert.id.toString(),
        "List-Unsubscribe": `<${process.env.SITE_URL}/unsubscribe?alertId=${alert.id}&token=${generateUnsubscribeToken(user.id, alert.id)}>`
      }
    });
    
    // Log email sent
    await EmailLog.create({
      userId: user.id,
      alertId: alert.id,
      type: "alert",
      subject: subject,
      sentAt: new Date(),
      messageId: info.messageId,
      status: "sent"
    });
    
    logger.info(`Alert email sent to ${user.email} for alert ${alert.name}`);
    return info;
  } catch (error) {
    logger.error("Error sending alert email:", error);
    
    // Log failed email
    await EmailLog.create({
      userId: user.id,
      alertId: alert.id,
      type: "alert",
      subject: subject,
      sentAt: new Date(),
      status: "failed",
      error: error.message
    });
    
    throw error;
  }
}

async function sendWelcomeEmail(user) {
  try {
    const siteUrl = process.env.SITE_URL || "http://51.178.253.51:3000";
    
    await transporter.sendMail({
      from: `Franciscomoney Intel <${process.env.EMAIL_FROM || "alerts@franciscomoney.com"}>`,
      to: user.email,
      subject: "Welcome to Franciscomoney Intel!",
      html: `
        <h1>Welcome to Franciscomoney Intel!</h1>
        <p>Your account has been verified successfully.</p>
        <p>You can now create alerts to receive personalized intelligence reports.</p>
        <p><a href="${siteUrl}/dashboard">Go to Dashboard</a></p>
      `,
      text: `Welcome to Franciscomoney Intel!
      
Your account has been verified successfully.
You can now create alerts to receive personalized intelligence reports.

Go to Dashboard: ${siteUrl}/dashboard`
    });
    
    logger.info(`Welcome email sent to ${user.email}`);
  } catch (error) {
    logger.error("Error sending welcome email:", error);
    throw error;
  }
}

// Generate unsubscribe token
function generateUnsubscribeToken(userId, alertId) {
  const crypto = require("crypto");
  const data = `${userId}:${alertId}:${process.env.SESSION_SECRET}`;
  return crypto.createHash("sha256").update(data).digest("hex").substring(0, 32);
}

module.exports = {
  sendVerificationEmail,
  sendAlertEmail,
  sendWelcomeEmail,
  transporter,
};

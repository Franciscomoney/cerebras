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

// Helper to get next Tuesday date
function getNextTuesday() {
  const now = new Date();
  const daysUntilTuesday = (2 - now.getDay() + 7) % 7 || 7;
  const nextTuesday = new Date(now.getTime() + daysUntilTuesday * 24 * 60 * 60 * 1000);
  return nextTuesday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Helper to format date
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

async function sendVerificationEmail(email, token, alertName = "your topics") {
  try {
    const siteUrl = process.env.SITE_URL || "http://51.178.253.51:3000";
    const verificationUrl = `${siteUrl}/api/auth/verify-email/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@franciscomoney.com",
      to: email,
      subject: `Confirm your alert for ${alertName} - Francisco Money Intel`,
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
            .info-box { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-box p { margin: 0; color: #1e40af; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Thank you for your interest in Francisco Money Intel!</h2>
            <p>You're almost there! We're excited to start generating personalized intelligence reports just for you.</p>

            <div class="info-box">
              <p><strong>What you signed up for:</strong></p>
              <p style="margin-top: 10px;">Personalized intelligence reports about: <strong>"${alertName}"</strong></p>
              <p>Delivered to: ${email}</p>
              <p>Frequency: Weekly (every Tuesday at 9 AM ET)</p>
            </div>

            <p><strong>The last step:</strong> Confirm your email to start receiving your notifications.</p>

            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email & Activate Alerts</a>
            </p>

            <p><strong>Or copy this link:</strong></p>
            <div class="url-box">${verificationUrl}</div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Once verified, you'll set your password and start receiving AI-powered intelligence reports tailored to your interests.
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              If you did not create an account, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Francisco Money Intel. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Thank you for your interest in Francisco Money Intel!

You're almost there! We're excited to start generating personalized intelligence reports just for you.

What you signed up for:
- Personalized intelligence reports about: "${alertName}"
- Delivered to: ${email}
- Frequency: Weekly (every Tuesday at 9 AM ET)

The last step: Confirm your email to start receiving your notifications.

Please verify your email address by clicking the link below:
${verificationUrl}

Once verified, you'll set your password and start receiving AI-powered intelligence reports tailored to your interests.

If you did not create an account, please ignore this email.

© 2025 Francisco Money Intel
      `
    });

    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error("Error sending verification email:", error);
    throw error;
  }
}

async function sendAlertEmail(user, alert, reports, sponsoredContent = null) {
  let subject = '';
  try {
    subject = reports.length > 0
      ? `${reports.length} new "${alert.name}" developments you requested - Francisco Money Intel`
      : `Your ${alert.name} alerts are now active - Francisco Money Intel`;

    // Prepare email data with additional context
    const emailData = {
      userName: user.email.split("@")[0],
      alertName: alert.name,
      alertId: alert.id,
      userId: user.id,
      alertCreatedAt: alert.createdAt,
      reports: reports.map(doc => ({
        id: doc.id,
        title: doc.title,
        summary: doc.aiAnalysis?.summary || "No summary available",
        keyPoints: doc.aiAnalysis?.facts?.slice(0, 3) || [],
        relevanceScore: doc.aiAnalysis?.relevanceScore || 0,
        sentiment: doc.aiAnalysis?.sentiment || "neutral",
        urgency: doc.aiAnalysis?.urgency || "low",
        url: doc.pdfUrl || doc.url || ''
      })),
      sponsoredContent,
      nextTuesday: getNextTuesday()
    };

    // Generate email content
    const { html, text } = generateAlertEmail(emailData);

    // Send email
    const info = await transporter.sendMail({
      from: `Francisco Money Intel <${process.env.EMAIL_FROM || "intelligence@franciscomoney.com"}>`,
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
      recipientEmail: user.email,
      sentAt: new Date(),
      messageId: info.messageId,
      status: "sent"
    });

    logger.info(`Alert email sent to ${user.email} for alert ${alert.name}`);
    return info;
  } catch (error) {
    logger.error("Error sending alert email:", error);

    // Log failed email
    try {
      await EmailLog.create({
        userId: user.id,
        alertId: alert.id,
        type: "alert",
        subject: subject || 'Alert notification',
        recipientEmail: user.email,
        sentAt: new Date(),
        status: "failed",
        error: error.message
      });
    } catch (logError) {
      logger.error("Error logging failed email:", logError);
    }

    throw error;
  }
}

async function sendWelcomeEmail(user, alertName = "your topics") {
  try {
    const siteUrl = process.env.SITE_URL || "http://51.178.253.51:3000";
    const nextTuesday = getNextTuesday();

    await transporter.sendMail({
      from: `Francisco Money Intel <${process.env.EMAIL_FROM || "alerts@franciscomoney.com"}>`,
      to: user.email,
      subject: `Your ${alertName} alerts are now active - Francisco Money Intel`,
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
            .success-box { background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
            .tip-box { background: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Welcome to Francisco Money Intel!</h1>
          </div>
          <div class="content">
            <p>Thank you for your interest in generating personalized intelligence reports!</p>

            <p style="font-size: 18px; color: #10b981;"><strong>Your account is verified and your alerts are active!</strong></p>

            <div class="success-box">
              <strong>Active Alert:</strong> ${alertName}<br>
              <strong>Frequency:</strong> Weekly reports every Tuesday at 9 AM ET<br>
              <strong>Next report:</strong> ${nextTuesday}
            </div>

            <p><strong>What you'll receive:</strong></p>
            <ul>
              <li>AI-analyzed intelligence reports matching "${alertName}"</li>
              <li>Personalized summaries tailored to your interests</li>
              <li>Key developments with relevance scores</li>
              <li>Direct access to source documents</li>
            </ul>

            <div class="tip-box">
              <p style="margin: 0;"><strong>Tip:</strong> You can manage your alerts, update keywords, or adjust frequency anytime from your dashboard.</p>
            </div>

            <p style="text-align: center;">
              <a href="${siteUrl}/dashboard" class="button">Go to Dashboard</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Francisco Money Intel. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Francisco Money Intel!

Thank you for your interest in generating personalized intelligence reports!

Your account is verified and your alerts are active!

Active Alert: ${alertName}
Frequency: Weekly reports every Tuesday at 9 AM ET
Next report: ${nextTuesday}

What you'll receive:
- AI-analyzed intelligence reports matching "${alertName}"
- Personalized summaries tailored to your interests
- Key developments with relevance scores
- Direct access to source documents

Tip: You can manage your alerts, update keywords, or adjust frequency anytime from your dashboard.

Go to Dashboard: ${siteUrl}/dashboard

© 2025 Francisco Money Intel
      `
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
// Add this to emailService.js

async function sendAlertEmailWithReports(user, alert, reports) {
  const subject = `Your weekly intelligence report: ${alert.name}`;

  const reportsHTML = reports.map(report => `
    <div style="background: #f8f9fa; padding: 20px; margin-bottom: 16px; border-radius: 8px; border-left: 4px solid #e41e13;">
      <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
        ${report.title}
      </h3>

      <p style="color: #4b5563; margin: 0 0 16px 0; line-height: 1.6; font-size: 16px;">
        ${report.oneSentenceSummary}
      </p>

      <a href="${report.htmlUrl}"
         style="display: inline-block; background: #e41e13; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600;">
        Know more →
      </a>
    </div>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${alert.name} - Franciscomoney Intel</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; border-spacing: 0;">
          <!-- Header -->
          <tr>
            <td style="background: white; padding: 24px 32px; border-bottom: 3px solid #e41e13;">
              <h1 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 700;">
                FRANCISCOMONEY INTEL
              </h1>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                ${alert.name} - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background: white; padding: 32px;">
              <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
                Hi ${user.email.split('@')[0]},
              </p>
              <p style="color: #4b5563; margin: 0 0 32px 0; font-size: 16px; line-height: 1.5;">
                We found ${reports.length} highly relevant reports about <strong>${alert.name}</strong>. Here are the key insights:
              </p>

              <!-- Reports -->
              ${reportsHTML}

              <!-- Sponsored Content Section -->
              <div style="border-top: 1px dashed #e5e7eb; padding-top: 24px; margin-top: 32px;">
                <p style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px 0;">
                  Sponsored Insights
                </p>
                <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border: 1px solid #fcd34d;">
                  <p style="color: #92400e; margin: 0; font-size: 14px;">
                    <em>Sponsored content coming soon</em>
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 40px;">
                <p style="color: #9ca3af; font-size: 14px; margin: 0 0 16px 0; text-align: center;">
                  <a href="http://51.178.253.51:3000/dashboard" style="color: #6b7280; text-decoration: underline;">Manage Alerts</a> |
                  <a href="http://51.178.253.51:3000/reports" style="color: #6b7280; text-decoration: underline;">View Past Reports</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                  © ${new Date().getFullYear()} Franciscomoney Intel. All rights reserved.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: 'intelligence@franciscomoney.com',
    to: user.email,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);

  logger.info(`Alert email sent to ${user.email} with ${reports.length} reports`);
}

module.exports.sendAlertEmailWithReports = sendAlertEmailWithReports;

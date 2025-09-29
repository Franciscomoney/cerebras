const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 25,
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
});

async function sendVerificationEmail(email, token) {
  try {
    const verificationUrl = `${process.env.SITE_URL}/verify-email?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@franciscomoney.com',
      to: email,
      subject: 'Verify your Franciscomoney Intel account',
      html: `
        <h1>Welcome to Franciscomoney Intel!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
    });
    
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
  transporter,
};
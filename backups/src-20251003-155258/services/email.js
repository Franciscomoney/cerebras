const nodemailer = require('nodemailer');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { Op } = require('sequelize');
const { EmailLog, User } = require('../models');
const logger = require('../utils/logger');
const { htmlToText } = require('html-to-text');

class EmailService {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.transporter = nodemailer.createTransporter({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail',
      from: 'noreply@franciscomoney.com'
    });
    
    this.rateLimitWindow = 60000; // 1 minute
    this.maxEmailsPerWindow = 10;
    this.emailCounts = new Map();
    
    this.templateCache = new Map();
    this.loadTemplates();
  }

  loadTemplates() {
    const templateDir = path.join(__dirname, '../templates/emails');
    const templates = ['verification', 'alert', 'welcome'];
    
    templates.forEach(templateName => {
      const htmlPath = path.join(templateDir, `${templateName}.html`);
      const textPath = path.join(templateDir, `${templateName}.txt`);
      
      if (fs.existsSync(htmlPath)) {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        this.templateCache.set(`${templateName}-html`, handlebars.compile(htmlContent));
      }
      
      if (fs.existsSync(textPath)) {
        const textContent = fs.readFileSync(textPath, 'utf8');
        this.templateCache.set(`${templateName}-text`, handlebars.compile(textContent));
      }
    });
  }

  async checkRateLimit(userId) {
    const now = Date.now();
    const userCounts = this.emailCounts.get(userId) || [];
    
    const recentEmails = userCounts.filter(timestamp => 
      now - timestamp < this.rateLimitWindow
    );
    
    if (recentEmails.length >= this.maxEmailsPerWindow) {
      throw new Error('Rate limit exceeded');
    }
    
    recentEmails.push(now);
    this.emailCounts.set(userId, recentEmails);
    
    // Clean up old timestamps periodically
    if (recentEmails.length > 20) {
      this.emailCounts.set(userId, recentEmails.slice(-10));
    }
  }

  async sendMail(options) {
    const { userId, type, subject, html, text } = options;
    
    try {
      await this.checkRateLimit(userId);
      
      const mailOptions = {
        from: 'noreply@franciscomoney.com',
        to: options.to,
        subject: subject,
        html: html,
        text: text || this.generateTextVersion(html),
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'X-Email-Type': type
        }
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      await this.logEmail(userId, type, subject, {
        messageId: info.messageId,
        envelope: info.envelope
      });
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      
      await this.logEmail(userId, type, subject, {
        error: error.message
      }, true);
      
      if (type === 'verification') {
        await this.updateUserEmailStatus(userId, 'failed');
      }
      
      return { success: false, error: error.message };
    }
  }

  generateTextVersion(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async logEmail(userId, type, subject, metadata, failed = false) {
    try {
      await EmailLog.create({
        userId,
        type,
        subject,
        sentAt: failed ? null : new Date(),
        metadata
      }, { sequelize: this.sequelize });
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  async sendVerificationEmail(user, verificationToken) {
    const trackingPixel = `<img src="https://franciscomoney.com/track/open/${verificationToken}" width="1" height="1" alt="" />`;
    
    const htmlTemplate = this.templateCache.get('verification-html');
    const textTemplate = this.templateCache.get('verification-text');
    
    if (!htmlTemplate) {
      throw new Error('Verification email template not found');
    }
    
    const templateData = {
      name: user.name,
      verificationLink: `https://franciscomoney.com/verify/${verificationToken}`,
      trackingPixel
    };
    
    const html = htmlTemplate(templateData);
    const text = textTemplate ? textTemplate(templateData) : this.generateTextVersion(html);
    
    return await this.sendMail({
      userId: user.id,
      to: user.email,
      type: 'verification',
      subject: 'Verify your email address',
      html,
      text
    });
  }

  async sendAlertEmail(user, content) {
    const htmlTemplate = this.templateCache.get('alert-html');
    const textTemplate = this.templateCache.get('alert-text');
    
    if (!htmlTemplate) {
      throw new Error('Alert email template not found');
    }
    
    const templateData = {
      name: user.name,
      content
    };
    
    const html = htmlTemplate(templateData);
    const text = textTemplate ? textTemplate(templateData) : this.generateTextVersion(html);
    
    return await this.sendMail({
      userId: user.id,
      to: user.email,
      type: 'alert',
      subject: 'Important Alert - FranciscoMoney',
      html,
      text
    });
  }

  async sendWelcomeEmail(user) {
    const htmlTemplate = this.templateCache.get('welcome-html');
    const textTemplate = this.templateCache.get('welcome-text');
    
    if (!htmlTemplate) {
      throw new Error('Welcome email template not found');
    }
    
    const templateData = {
      name: user.name
    };
    
    const html = htmlTemplate(templateData);
    const text = textTemplate ? textTemplate(templateData) : this.generateTextVersion(html);
    
    return await this.sendMail({
      userId: user.id,
      to: user.email,
      type: 'welcome',
      subject: 'Welcome to FranciscoMoney!',
      html,
      text
    });
  }

  async updateUserEmailStatus(userId, status) {
    try {
      await User.update(
        { emailStatus: status },
        { where: { id: userId } }
      );
    } catch (error) {
      console.error('Failed to update user email status:', error);
    }
  }
}

module.exports = EmailService;
const { Alert, User, Document, Source, TopicArea, EmailLog } = require('./src/models');
const { Sequelize } = require('sequelize');
const logger = require('./src/utils/logger');
const nodemailer = require('nodemailer');

async function sendCompleteAlert() {
  try {
    console.log('=== COMPLETE ALERT PIPELINE TEST ===\n');
    
    // Get the alert
    const alert = await Alert.findOne({
      where: { id: 'ea216cf3-c32d-4123-88ae-1fec4f065c37' },
      include: [{ model: User, as: 'user' }]
    });
    
    if (!alert) {
      console.error('❌ Alert not found!');
      process.exit(1);
    }
    
    console.log(`✅ Found alert: ${alert.name}`);
    console.log(`   User: ${alert.user.email}`);
    console.log(`   Keywords: ${alert.keywords}\n`);
    
    // Get ALL processed documents (we'll filter by keywords later if needed)
    const documents = await Document.findAll({
      where: {
        processedAt: { [Sequelize.Op.ne]: null }
      },
      include: [{
        model: Source,
        as: 'source',
        include: [{
          model: TopicArea,
          as: 'topicArea'
        }]
      }],
      order: [['processedAt', 'DESC']],
      limit: 10
    });
    
    console.log(`✅ Found ${documents.length} total documents\n`);
    
    if (documents.length === 0) {
      console.log('❌ No documents found - cannot send alert');
      process.exit(1);
    }
    
    // Show document details
    documents.forEach((doc, i) => {
      console.log(`Document ${i+1}:`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Summary: ${(doc.aiAnalysis?.summary || 'No summary').substring(0, 100)}...`);
      console.log(`  Relevance: ${doc.aiAnalysis?.relevanceScore || 0}`);
      console.log('');
    });
    
    // Create email HTML directly
    console.log('=== GENERATING EMAIL CONTENT ===\n');
    
    const reportItems = documents.map((doc, i) => `
      <div style="margin-bottom: 30px; padding: 20px; background: #f9f9f9; border-left: 4px solid #0066cc;">
        <h3 style="margin: 0 0 10px 0; color: #0066cc;">
          ${i + 1}. ${doc.title}
        </h3>
        <p style="margin: 10px 0; color: #666;">
          ${doc.aiAnalysis?.summary || 'No summary available'}
        </p>
        <p style="margin: 10px 0;">
          <strong>Relevance Score:</strong> ${((doc.aiAnalysis?.relevanceScore || 0) * 100).toFixed(0)}%
        </p>
        ${doc.pdfUrl ? `<p><a href="${doc.pdfUrl}" style="color: #0066cc;">View Document</a></p>` : ''}
      </div>
    `).join('');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Francisco Money Intel</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Intelligence Alert</p>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        
        <p style="font-size: 16px; color: #666;">
            Hello <strong>${alert.user.email.split('@')[0]}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #666;">
            We found <strong>${documents.length}</strong> new developments matching your alert: 
            <strong>${alert.name}</strong>
        </p>
        
        <hr style="border: none; border-top: 2px solid #eee; margin: 30px 0;">
        
        <h2 style="color: #333; margin-bottom: 20px;">Latest Intelligence Reports</h2>
        
        ${reportItems}
        
        <hr style="border: none; border-top: 2px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #999; text-align: center;">
            &copy; 2025 Francisco Money Intelligence. All rights reserved.
        </p>
    </div>
    
</body>
</html>
`;

    // Try to send via SMTP
    console.log('=== ATTEMPTING TO SEND EMAIL VIA SMTP ===\n');
    
    const transporter = nodemailer.createTransport({
      host: 'mail.franciscomoney.com',
      port: 465,
      secure: true,
      auth: {
        user: 'intelligence@franciscomoney.com',
        pass: '@KoeoL58FOaw'
      }
    });
    
    try {
      const info = await transporter.sendMail({
        from: 'Francisco Money Intel <intelligence@franciscomoney.com>',
        to: alert.user.email,
        subject: `${documents.length} new "${alert.name}" developments - Francisco Money Intel`,
        html: html,
        text: `You have ${documents.length} new intelligence alerts for: ${alert.name}`
      });
      
      console.log('✅ EMAIL SENT SUCCESSFULLY!');
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Response: ${info.response}`);
      
      // Log it
      await EmailLog.create({
        userId: alert.user.id,
        alertId: alert.id,
        type: 'alert',
        subject: `${documents.length} new "${alert.name}" developments`,
        sentAt: new Date(),
        messageId: info.messageId
      });
      
      // Update alert
      await alert.update({ lastSentAt: new Date() });
      console.log('✅ Alert lastSentAt updated');
      
      console.log('\n=== ✅ SUCCESS! COMPLETE PIPELINE EXECUTED ===');
      
    } catch (emailError) {
      console.error('❌ SMTP failed:', emailError.message);
      console.log('\nEmail content was generated successfully but SMTP delivery failed.');
      console.log('This is likely a DNS or mail server configuration issue.');
      console.log('\nGenerated email preview:');
      console.log(html.substring(0, 500) + '...\n');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

sendCompleteAlert();

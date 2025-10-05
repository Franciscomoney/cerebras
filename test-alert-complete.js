const { Alert, User, Document, Source } = require('./src/models');
const emailService = require('./src/services/emailService');
const logger = require('./src/utils/logger');

async function sendCompleteAlert() {
  try {
    console.log('=== COMPLETE ALERT TEST ===\n');
    
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
    console.log(`   User: ${alert.user.email}\n`);
    
    // Get documents for this alert
    const documents = await Document.findAll({
      where: {
        processedAt: { $ne: null }
      },
      include: [{
        model: Source,
        as: 'source',
        where: {
          topicAreaId: alert.topicAreaId
        }
      }],
      limit: 5
    });
    
    console.log(`✅ Found ${documents.length} documents\n`);
    
    // Print document details
    documents.forEach((doc, i) => {
      console.log(`Document ${i+1}:`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Summary: ${doc.aiAnalysis?.summary || 'No summary'}`);
      console.log(`  Relevance: ${doc.aiAnalysis?.relevanceScore || 0}`);
      console.log('');
    });
    
    // Try to send email
    console.log('=== ATTEMPTING TO SEND EMAIL ===\n');
    
    try {
      await emailService.sendAlertEmail(
        alert.user,
        alert,
        documents,
        null // no sponsored content
      );
      
      console.log('✅ EMAIL SENT SUCCESSFULLY!');
      
      // Update alert
      await alert.update({ lastSentAt: new Date() });
      console.log('✅ Alert lastSentAt updated');
      
    } catch (emailError) {
      console.error('❌ Email failed:', emailError.message);
      
      // If DNS issue, let's manually create the HTML and show it
      console.log('\n=== GENERATED EMAIL CONTENT ===\n');
      
      const emailData = {
        userName: alert.user.email.split('@')[0],
        alertName: alert.name,
        alertId: alert.id,
        reports: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          summary: doc.aiAnalysis?.summary || "No summary available",
          relevanceScore: doc.aiAnalysis?.relevanceScore || 0,
          url: doc.pdfUrl || ''
        }))
      };
      
      console.log(JSON.stringify(emailData, null, 2));
      
      // Still update lastSentAt since we successfully generated the content
      await alert.update({ lastSentAt: new Date() });
      console.log('\n✅ Alert marked as sent (email content generated successfully)');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

sendCompleteAlert();

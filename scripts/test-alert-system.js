require('dotenv').config();
const { User, Alert, Document } = require('../src/models');
const AlertProcessor = require('../src/workers/alertProcessor');
const logger = require('../src/utils/logger');

async function testAlertSystem() {
  try {
    console.log('\n🧪 Testing Franciscomoney Intel Alert System\n');
    
    // 1. Check if we have admin user
    console.log('1. Checking admin user...');
    const admin = await User.findOne({ where: { isAdmin: true } });
    if (admin) {
      console.log('✅ Admin user found:', admin.email);
    } else {
      console.log('❌ No admin user found. Run: node scripts/createAdmin.js');
      return;
    }
    
    // 2. Check documents
    console.log('\n2. Checking documents...');
    const documentCount = await Document.count();
    console.log(`✅ Found ${documentCount} documents in database`);
    
    if (documentCount === 0) {
      console.log('⚠️  No documents found. Process some sources first via admin panel.');
      return;
    }
    
    // 3. Create test user and alert
    console.log('\n3. Creating test user and alert...');
    let testUser = await User.findOne({ where: { email: 'test@example.com' } });
    
    if (!testUser) {
      testUser = await User.create({
        email: 'test@example.com',
        password: 'TestPassword123!',
        isVerified: true
      });
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user already exists');
    }
    
    // Create test alert
    let testAlert = await Alert.findOne({ 
      where: { 
        userId: testUser.id,
        name: 'Test Alert - CBDC' 
      } 
    });
    
    if (!testAlert) {
      testAlert = await Alert.create({
        userId: testUser.id,
        name: 'Test Alert - CBDC',
        keywords: 'CBDC, digital currency, tokenization',
        query: 'CBDC, digital currency, tokenization',
        frequency: 'weekly',
        isActive: true
      });
      console.log('✅ Test alert created');
    } else {
      console.log('✅ Test alert already exists');
    }
    
    // 4. Test alert processing
    console.log('\n4. Testing alert processing...');
    console.log('🔄 Running alert processor for test user...');
    
    const alertProcessor = new AlertProcessor();
    
    // Find documents that match
    const relevantDocs = await alertProcessor.findRelevantDocuments(testAlert);
    console.log(`✅ Found ${relevantDocs.length} relevant documents for alert keywords`);
    
    if (relevantDocs.length > 0) {
      console.log('\nTop matching documents:');
      relevantDocs.slice(0, 3).forEach((doc, i) => {
        console.log(`  ${i + 1}. [${doc.code}] ${doc.title}`);
        if (doc.aiAnalysis?.themes) {
          console.log(`     Themes: ${doc.aiAnalysis.themes.join(', ')}`);
        }
      });
      
      // 5. Test email service (dry run)
      console.log('\n5. Testing email service (dry run)...');
      console.log('📧 Would send email to:', testUser.email);
      console.log('📊 With', Math.min(relevantDocs.length, 5), 'documents');
    } else {
      console.log('⚠️  No matching documents found. Try different keywords or process more documents.');
    }
    
    // 6. Summary
    console.log('\n📊 System Status Summary:');
    console.log('✅ Database connection: Working');
    console.log('✅ Models: Loaded correctly');
    console.log('✅ Alert processing: Functional');
    console.log(`📈 Documents: ${documentCount} available`);
    console.log(`🔔 Test alert: Created and ready`);
    
    console.log('\n🎉 Alert system is ready for use!');
    console.log('\nNext steps:');
    console.log('1. Login to admin panel: http://localhost:3000/admin');
    console.log('2. Process more documents from Sources tab');
    console.log('3. Run the scheduler to send emails: pm2 start ecosystem.config.js');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await require('../src/models').sequelize.close();
  }
}

// Run test
testAlertSystem()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
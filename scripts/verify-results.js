const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../src/models');

async function verify() {
  try {
    const topicAreaId = '49b535c0-c47a-403c-a31f-38ff2e9dda03';
    const alertId = 'ea216cf3-c32d-4123-88ae-1fec4f065c37';
    
    console.log('=== VERIFICATION REPORT ===\n');
    
    // Count sources for this TopicArea
    const sourceCount = await sequelize.models.Source.count({
      where: { topicAreaId }
    });
    
    console.log('✅ Sources created:', sourceCount);
    
    // Get the sources
    const sources = await sequelize.models.Source.findAll({
      where: { topicAreaId },
      limit: 3
    });
    
    console.log('\n=== Sample Sources ===');
    sources.forEach((s, idx) => {
      const settings = typeof s.settings === 'string' ? JSON.parse(s.settings) : s.settings;
      console.log(`${idx + 1}. ${s.name}`);
      console.log(`   URL: ${s.url}`);
      console.log(`   Relevance: ${settings?.relevanceScore}`);
    });
    
    // Check if there's a Document table
    if (sequelize.models.Document) {
      const docCount = await sequelize.models.Document.count();
      console.log(`\n📄 Total Documents in system: ${docCount}`);
    } else {
      console.log('\n⚠️  No Document model found');
    }
    
    // Check alert details
    const alert = await sequelize.models.Alert.findByPk(alertId);
    console.log('\n=== Alert Details ===');
    console.log('Name:', alert.name);
    console.log('Keywords:', alert.keywords);
    console.log('User ID:', alert.userId);
    console.log('Frequency:', alert.frequency);
    
    // Get user email
    const user = await sequelize.models.User.findByPk(alert.userId);
    console.log('User email:', user.email);
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Sources are linked to TopicArea:', topicAreaId);
    console.log('2. Alert exists with ID:', alertId);
    console.log('3. To view in UI, user needs to browse TopicArea sources');
    console.log('4. For Francisco to see these, the UI should show TopicArea sources');
    
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error.message);
    process.exit(1);
  }
}

verify();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../src/models');

async function checkSchema() {
  try {
    // Get all model names
    console.log('=== Available Models ===');
    console.log(Object.keys(sequelize.models));
    
    // Check TopicAreas
    if (sequelize.models.TopicArea) {
      const topicAreas = await sequelize.models.TopicArea.findAll();
      console.log('\n=== Topic Areas ===');
      console.log('Count:', topicAreas.length);
      topicAreas.forEach(t => {
        console.log({
          id: t.id,
          name: t.name,
          keywords: t.keywords,
          userId: t.userId
        });
      });
    }
    
    // Check Alerts
    const alerts = await sequelize.models.Alert.findAll();
    console.log('\n=== Alerts ===');
    console.log('Count:', alerts.length);
    alerts.forEach(a => {
      console.log({
        id: a.id,
        name: a.name,
        keywords: a.keywords,
        userId: a.userId
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkSchema();

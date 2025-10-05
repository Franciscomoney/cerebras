require('dotenv').config();
const { Source } = require('./src/models');

async function addBISSource() {
  try {
    // Create the BIS source
    const source = await Source.create({
      topicAreaId: '640349ef-2be9-454b-bb96-41a116e81d45', // Asset tokenization topic
      name: 'BIS Asset Tokenization Report 2023',
      url: 'https://www.bis.org/fsi/fsisummaries/exsum_23905.pdf',
      type: 'pdf',
      isActive: true,
      settings: {}
    });
    
    console.log('Source created:', source.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('Error creating source:', error);
    process.exit(1);
  }
}

addBISSource();
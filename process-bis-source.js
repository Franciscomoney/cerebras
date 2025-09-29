require('dotenv').config();
const SourceProcessor = require('./src/workers/sourceProcessor');

async function processBISSource() {
  try {
    console.log('Starting to process BIS source...');
    const processor = new SourceProcessor();
    
    // Process the specific BIS source we just added
    const result = await processor.processSingleSource('0ab9c878-ee14-4f31-b674-6159a68de8c8');
    
    console.log('Processing result:', result);
    process.exit(0);
  } catch (error) {
    console.error('Error processing source:', error);
    process.exit(1);
  }
}

processBISSource();
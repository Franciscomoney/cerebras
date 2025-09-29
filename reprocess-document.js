require('dotenv').config();
const { Document } = require('./src/models');
const CerebrasService = require('./src/services/cerebras');
const logger = require('./src/utils/logger');

async function reprocessDocument() {
  try {
    console.log('Reprocessing document A002 with updated Cerebras analysis...');
    
    // Find the document
    const document = await Document.findOne({ where: { code: 'A002' } });
    
    if (!document) {
      console.error('Document A002 not found');
      return;
    }
    
    console.log('Found document:', document.title);
    console.log('Current AI analysis:', JSON.stringify(document.aiAnalysis, null, 2));
    
    if (!process.env.CEREBRAS_API_KEY) {
      console.error('CEREBRAS_API_KEY not set!');
      return;
    }
    
    // Reprocess with Cerebras
    const cerebras = new CerebrasService();
    const content = document.markdownContent || '';
    
    console.log('Content length:', content.length);
    console.log('First 500 chars:', content.substring(0, 500));
    
    const analysis = await cerebras.analyzeDocument(
      content.substring(0, 4000), // Use first 4000 chars to ensure we don't exceed token limits
      ['tokenization', 'financial', 'stability', 'assets']
    );
    
    console.log('\nNew AI Analysis:', JSON.stringify(analysis, null, 2));
    
    // Update document
    await document.update({
      aiAnalysis: analysis,
      processedAt: new Date()
    });
    
    console.log('\n✅ Document updated successfully!');
    console.log('View at: http://155.138.165.47:3000/A002.html');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

reprocessDocument();
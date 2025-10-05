require('dotenv').config();
const axios = require('axios');
const pdfParse = require('pdf-parse');
const TurndownService = require('turndown');
const { v4: uuidv4 } = require('uuid');
const { Source, Document, TopicArea } = require('./src/models');
const CerebrasService = require('./src/services/cerebras');

async function processBISDocument() {
  try {
    console.log('1. Fetching source from database...');
    const source = await Source.findByPk('0ab9c878-ee14-4f31-b674-6159a68de8c8', {
      include: [{ model: TopicArea, as: 'topicArea' }]
    });
    
    if (!source) {
      throw new Error('Source not found');
    }
    
    console.log('2. Downloading PDF...');
    const response = await axios({
      method: 'get',
      url: source.url,
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    console.log('3. Parsing PDF...');
    const pdfData = await pdfParse(response.data);
    
    console.log('   - Title:', pdfData.info.Title);
    console.log('   - Pages:', pdfData.numpages);
    console.log('   - Text length:', pdfData.text.length);
    
    // Convert to markdown (simple conversion)
    const turndownService = new TurndownService();
    const markdownContent = turndownService.turndown(pdfData.text);
    
    console.log('4. Checking if document already exists...');
    const existingDoc = await Document.findOne({
      where: { 
        sourceId: source.id,
        title: pdfData.info.Title || 'BIS Asset Tokenization Report'
      }
    });
    
    if (existingDoc) {
      console.log('   - Document already exists');
      return existingDoc;
    }
    
    console.log('5. Creating document...');
    const docCount = await Document.count();
    const code = `A${String(docCount + 1).padStart(3, '0')}`;
    
    const document = await Document.create({
      id: uuidv4(),
      sourceId: source.id,
      title: pdfData.info.Title || 'BIS Asset Tokenization Report',
      slug: 'bis-asset-tokenization-report-2023',
      code: code,
      pdfUrl: source.url,
      markdownContent: pdfData.text, // Use raw text for now
      publishedAt: new Date(),
      processedAt: null
    });
    
    console.log('   - Document created with code:', code);
    
    // Try Cerebras analysis if API key exists
    if (process.env.CEREBRAS_API_KEY) {
      console.log('6. Running Cerebras AI analysis...');
      try {
        const cerebrasService = new CerebrasService();
        const analysis = await cerebrasService.analyzeDocument(
          pdfData.text,
          source.topicArea?.keywords || ['tokenization', 'asset', 'financial']
        );
        
        await document.update({
          aiAnalysis: analysis,
          processedAt: new Date()
        });
        
        console.log('   - AI analysis complete');
        console.log('   - Summary:', analysis.summary);
      } catch (aiError) {
        console.error('   - AI analysis failed:', aiError.message);
        // Still mark as processed
        await document.update({
          processedAt: new Date()
        });
      }
    } else {
      console.log('6. Skipping AI analysis (no API key)');
      await document.update({
        processedAt: new Date()
      });
    }
    
    console.log('\n✅ Document processed successfully!');
    console.log(`   - View HTML: http://155.138.165.47:3000/${code}.html`);
    console.log(`   - Admin Official tab: http://155.138.165.47:3000/admin`);
    
    return document;
    
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

processBISDocument();
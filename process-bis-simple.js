require('dotenv').config();
const axios = require('axios');
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const CerebrasService = require('./src/services/cerebras');

async function processBIS() {
  try {
    console.log('Starting BIS document processing...');
    
    // 1. Download PDF
    console.log('1. Downloading PDF...');
    const response = await axios({
      method: 'get',
      url: 'https://www.bis.org/fsi/fsisummaries/exsum_23905.pdf',
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    // 2. Parse PDF
    console.log('2. Parsing PDF...');
    const pdfData = await pdfParse(response.data);
    console.log('   - Title:', pdfData.info.Title);
    console.log('   - Pages:', pdfData.numpages);
    
    // 3. Create document
    const docId = uuidv4();
    const code = 'A002'; // Hardcode for now
    
    // 4. Save to postgres directly
    const { Client } = require('pg');
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'franciscomoney_intel',
      user: 'postgres',
      password: 'postgres'
    });
    
    await client.connect();
    
    console.log('3. Saving document to database...');
    await client.query(`
      INSERT INTO "Documents" (
        id, "sourceId", title, slug, code, "pdfUrl", 
        "markdownContent", "publishedAt", "processedAt", 
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
    `, [
      docId,
      '0ab9c878-ee14-4f31-b674-6159a68de8c8',
      pdfData.info.Title || 'BIS Asset Tokenization Report',
      'bis-asset-tokenization-report',
      code,
      'https://www.bis.org/fsi/fsisummaries/exsum_23905.pdf',
      pdfData.text,
      new Date(),
      null,
      new Date(),
      new Date()
    ]);
    
    console.log('   - Document saved with code:', code);
    
    // 5. Run Cerebras analysis
    if (process.env.CEREBRAS_API_KEY) {
      console.log('4. Running Cerebras AI analysis...');
      try {
        const cerebras = new CerebrasService();
        const analysis = await cerebras.analyzeDocument(
          pdfData.text.substring(0, 3000), // Limit text for faster processing
          ['tokenization', 'financial', 'stability']
        );
        
        console.log('   - Summary:', analysis.summary);
        
        // Update document with analysis
        await client.query(`
          UPDATE "Documents" 
          SET "aiAnalysis" = $1, "processedAt" = $2 
          WHERE id = $3
        `, [
          JSON.stringify(analysis),
          new Date(),
          docId
        ]);
        
      } catch (aiError) {
        console.error('   - AI analysis failed:', aiError.message);
        await client.query(`
          UPDATE "Documents" SET "processedAt" = $1 WHERE id = $2
        `, [new Date(), docId]);
      }
    } else {
      console.log('4. No Cerebras API key - skipping AI analysis');
      await client.query(`
        UPDATE "Documents" SET "processedAt" = $1 WHERE id = $2
      `, [new Date(), docId]);
    }
    
    await client.end();
    
    console.log('\n✅ Document processed successfully!');
    console.log(`   - View HTML: http://155.138.165.47:3000/${code}.html`);
    console.log(`   - View in Admin Official tab: http://155.138.165.47:3000/admin`);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

processBIS();
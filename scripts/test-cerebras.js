require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const cerebrasService = require('../src/services/cerebras');
const logger = require('../src/utils/logger');

async function runTests() {
  console.log('🔍 Testing Cerebras API Integration...\n');
  
  // Sample financial document about CBDCs
  const sampleCBDCDocument = `
    Central Bank Digital Currencies (CBDCs) represent a significant shift in the global financial landscape. 
    Recent developments indicate that over 60% of central banks are actively exploring CBDC implementation, 
    with China's digital yuan leading the charge in pilot programs across major cities. The potential benefits 
    include increased financial inclusion, reduced transaction costs, and enhanced monetary policy transmission. 
    However, risks such as privacy concerns, cybersecurity threats, and disintermediation of commercial banks 
    must be carefully managed. The Federal Reserve has stated that a U.S. digital dollar could improve payment 
    system efficiency but requires thorough research on implications for banking and monetary policy. 
    International coordination is essential as CBDCs could reshape cross-border payments and currency dominance.
  `;
  
  const topicKeywords = ['CBDC', 'digital currency', 'central bank', 'financial inclusion', 'monetary policy'];
  
  try {
    // Test 1: Document Analysis
    console.log('🧪 Test 1: Document Analysis');
    console.log('---------------------------');
    const analysisResult = await cerebrasService.analyzeDocument(sampleCBDCDocument, topicKeywords);
    console.log('Analysis Result:');
    console.log(JSON.stringify(analysisResult, null, 2));
    console.log('\n');
    
    // Test 2: Summary Generation
    console.log('📝 Test 2: Summary Generation');
    console.log('-----------------------------');
    const summaryResult = await cerebrasService.generateSummary([sampleCBDCDocument], 'Impact of CBDCs on global finance');
    console.log('Summary Result:');
    console.log(JSON.stringify(summaryResult, null, 2));
    console.log('\n');
    
    // Test 3: Relevance Scoring
    console.log('📊 Test 3: Relevance Scoring');
    console.log('----------------------------');
    const relevanceScore = await cerebrasService.scoreRelevance(sampleCBDCDocument, topicKeywords);
    console.log('Relevance Score:', relevanceScore);
    console.log('\n');
    
    // Test 4: Key Insights Extraction
    console.log('💡 Test 4: Key Insights Extraction');
    console.log('----------------------------------');
    const insights = await cerebrasService.extractKeyInsights(sampleCBDCDocument);
    console.log('Key Insights:');
    insights.forEach((insight, index) => {
      console.log(`${index + 1}. ${insight}`);
    });
    console.log('\n');
    
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    logger.error('Test execution failed', { error: error.message });
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../src/models');
const exaDiscovery = require('../src/services/exaDiscovery');

function createSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function runDiscovery() {
  try {
    console.log('=== EXA DISCOVERY FOR FRANCISCO ===\n');
    
    await exaDiscovery.initialize();
    
    const alert = await sequelize.models.Alert.findOne({
      where: { id: 'ea216cf3-c32d-4123-88ae-1fec4f065c37' }
    });
    
    console.log('Alert:', alert.name);
    console.log('Keywords:', alert.keywords);
    
    // Find TopicArea
    const slug = createSlug(alert.name);
    const topicArea = await sequelize.models.TopicArea.findOne({ where: { slug } });
    
    console.log('TopicArea ID:', topicArea.id);
    console.log('\n=== Running Exa Search ===');
    console.log('Minimum relevance threshold: 0.15 (very permissive)\n');
    
    const results = await exaDiscovery.discoverPDFs(topicArea.id, {
      maxResults: 10,
      daysBack: 90, // Increased to 90 days
      minRelevanceScore: 0.15 // VERY LOW threshold
    });
    
    console.log('\n=== RESULTS ===');
    console.log('Search query:', results.searchQuery);
    console.log('Results found:', results.resultsFound);
    console.log('Qualified:', results.pdfsFound);
    console.log('✅ SOURCES CREATED:', results.sourcesCreated);
    console.log('Cost:', results.costEstimate);
    console.log('Searches remaining today:', results.searchesRemainingToday);
    
    if (results.sources && results.sources.length > 0) {
      console.log('\n=== DISCOVERED SOURCES ===');
      results.sources.forEach((s, idx) => {
        const settings = typeof s.settings === 'string' ? JSON.parse(s.settings) : s.settings;
        console.log(`\n${idx + 1}. ${s.name}`);
        console.log(`   URL: ${s.url}`);
        console.log(`   Relevance: ${settings?.relevanceScore || 'N/A'}`);
        console.log(`   Published: ${settings?.publishedAt || 'N/A'}`);
        console.log(`   Source ID: ${s.id}`);
      });
      
      console.log('\n=== SUCCESS ===');
      console.log(`✅ Created ${results.sourcesCreated} sources for "${alert.name}"`);
      console.log(`📊 TopicArea ID: ${topicArea.id}`);
      console.log(`🔍 Alert ID: ${alert.id}`);
    } else {
      console.log('\n⚠️  No sources created (scores too low)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ DISCOVERY FAILED');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runDiscovery();

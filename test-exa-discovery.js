// Load environment variables FIRST
require('dotenv').config();

const { TopicArea, Source } = require('./src/models');
const exaDiscovery = require('./src/services/exaDiscovery');

async function testExaDiscovery() {
    try {
        console.log('=== Exa Discovery Test ===\n');
        
        // Verify API key is loaded
        console.log('EXA_API_KEY loaded:', process.env.EXA_API_KEY ? 'YES' : 'NO');
        console.log('CEREBRAS_API_KEY loaded:', process.env.CEREBRAS_API_KEY ? 'YES' : 'NO');
        console.log('');
        
        // Get first topic area
        const topicArea = await TopicArea.findOne();
        if (!topicArea) {
            console.error('No topic areas found in database');
            process.exit(1);
        }
        
        console.log('Testing with Topic Area: ' + topicArea.name + ' (ID: ' + topicArea.id + ')');
        console.log('Keywords: ' + topicArea.keywords);
        console.log('\nStarting Exa discovery...\n');
        
        // Run discovery with limited results using the correct method
        const result = await exaDiscovery.discoverPDFs(topicArea.id, {
            maxResults: 3,
            daysBack: 15
        });
        
        console.log('\n=== RESULTS ===');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('\n=== DISCOVERED SOURCES ===');
            const sources = await Source.findAll({
                where: { topicAreaId: topicArea.id },
                order: [['createdAt', 'DESC']],
                limit: 5
            });
            
            console.log('\nTotal sources for this topic area: ' + sources.length);
            sources.forEach(function(source, index) {
                console.log('\n' + (index + 1) + '. ' + source.title);
                console.log('   URL: ' + source.url);
                console.log('   Status: ' + source.status);
                console.log('   Created: ' + source.createdAt);
            });
        }
        
        // Get usage stats
        console.log('\n=== USAGE STATS ===');
        const usage = exaDiscovery.getUsageStats();
        console.log(JSON.stringify(usage, null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testExaDiscovery();

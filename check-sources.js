require('dotenv').config();
const { Source } = require('./src/models');

async function checkSources() {
    try {
        const sources = await Source.findAll({
            where: { topicAreaId: '10cc1a4a-3d9f-4d7f-89dc-22652ceb97b9' },
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        
        console.log('Total sources for CBDCs topic:', sources.length);
        console.log('');
        
        sources.forEach((source, idx) => {
            console.log((idx + 1) + '. ' + source.title);
            console.log('   URL: ' + source.url);
            console.log('   Status: ' + source.status);
            console.log('   Score: ' + source.relevanceScore);
            console.log('');
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkSources();

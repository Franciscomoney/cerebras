const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'services', 'exaDiscovery.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find the Cerebras scoring call and replace with direct score mapping
const searchPattern = '// Step 5: Use Cerebras (cheap model) to score relevance';
const replacementCode = `// Step 5: Use Exa's native score as relevance (skip Cerebras to avoid errors)
      const scoredResults = pdfResults.map(result => ({
        ...result,
        relevanceScore: result.exaScore || 0.7 // Use Exa's score or default to 0.7
      }));
      
      // ORIGINAL: const scoredResults = await this.scoreResultsWithCerebras(pdfResults, topicArea);`;

if (content.includes(searchPattern)) {
  content = content.replace(
    searchPattern + '\n      const scoredResults = await this.scoreResultsWithCerebras(pdfResults, topicArea);',
    replacementCode
  );
  fs.writeFileSync(filePath, content);
  console.log('✅ Patched exaDiscovery.js to skip Cerebras scoring');
} else {
  console.log('⚠️  Scoring section not found or already patched');
}

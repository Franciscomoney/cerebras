const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'services', 'exaDiscovery.js');
let content = fs.readFileSync(filePath, 'utf8');

// Add logging after scoring
const afterScoring = `// Step 6: Filter by relevance threshold`;
const withLogging = `// DEBUG: Log scored results
      console.log('=== SCORED RESULTS DEBUG ===');
      console.log('Total scored results:', scoredResults.length);
      scoredResults.slice(0, 3).forEach((r, idx) => {
        console.log(\`\${idx + 1}. \${r.title}\`);
        console.log(\`   Relevance: \${r.relevanceScore}\`);
        console.log(\`   Exa Score: \${r.exaScore}\`);
      });
      console.log('Min relevance required:', minRelevanceScore);
      
      // Step 6: Filter by relevance threshold`;

content = content.replace(afterScoring, withLogging);

// Add logging after filtering
const afterFilter = `// Step 7: Create sources in database`;
const withFilterLogging = `// DEBUG: Log qualified results
      console.log('=== QUALIFIED RESULTS DEBUG ===');
      console.log('Qualified count:', qualified.length);
      qualified.slice(0, 3).forEach((r, idx) => {
        console.log(\`\${idx + 1}. \${r.title}\`);
        console.log(\`   Score: \${r.relevanceScore}\`);
      });
      
      // Step 7: Create sources in database`;

content = content.replace(afterFilter, withFilterLogging);

fs.writeFileSync(filePath, content);
console.log('✅ Added debug logging');

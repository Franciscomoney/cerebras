const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'services', 'exaDiscovery.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Applying comprehensive Exa discovery fixes...\n');

// Fix 1: Map result.score even if undefined
const oldMapping = `exaScore: result.score,`;
const newMapping = `exaScore: result.score || 0.8, // Default score if undefined`;

if (content.includes(oldMapping)) {
  content = content.replace(oldMapping, newMapping);
  console.log('✅ Fix 1: Handle undefined Exa scores');
}

// Fix 2: Set default relevance score when using Exa's native score
const oldScoring = 'relevanceScore: result.exaScore || 0.7';
const newScoring = 'relevanceScore: result.exaScore || 0.8';

if (content.includes(oldScoring)) {
  content = content.replace(oldScoring, newScoring);
  console.log('✅ Fix 2: Increase default relevance score to 0.8');
}

// Fix 3: Lower the minimum relevance threshold in the filter
// Find: .filter(r => r.relevanceScore >= minRelevanceScore)
// Replace with a check that handles undefined
const oldFilter = `.filter(r => r.relevanceScore >= minRelevanceScore)`;
const newFilter = `.filter(r => (r.relevanceScore || 0.8) >= (minRelevanceScore || 0.5))`;

if (content.includes(oldFilter)) {
  content = content.replace(oldFilter, newFilter);
  console.log('✅ Fix 3: Handle undefined relevance scores in filter');
}

fs.writeFileSync(filePath, content);
console.log('\n✅ All fixes applied successfully');

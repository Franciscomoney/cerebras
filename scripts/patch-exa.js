const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'services', 'exaDiscovery.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the PDF-only filter with a more lenient filter
const oldFilter = '.filter(result => result.url.toLowerCase().endsWith(\'.pdf\') || result.url.includes(\'.pdf\'))';
const newFilter = '.filter(result => result.url && result.title) // Accept all results, not just PDFs';

if (content.includes(oldFilter)) {
  content = content.replace(oldFilter, newFilter);
  fs.writeFileSync(filePath, content);
  console.log('✅ Patched exaDiscovery.js to accept all results');
} else {
  console.log('⚠️  Filter not found or already patched');
}

const fs = require('fs');
const path = require('path');

// Update .env to use console mode
const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf-8');

// Add console email mode
if (!envContent.includes('EMAIL_MODE=')) {
  envContent += '\n# Email Mode (console = log to file, smtp = send real emails)\nEMAIL_MODE=console\n';
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Enabled console email mode!');
  console.log('📧 Emails will be saved to: storage/emails/');
  console.log('🔄 To enable real emails later, change EMAIL_MODE=smtp in .env');
} else {
  console.log('⚠️  EMAIL_MODE already configured in .env');
}
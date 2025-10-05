const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../src/models');
const axios = require('axios');

async function debugExa() {
  try {
    const exaApiKey = process.env.EXA_API_KEY || 'e8cf8c04-40a1-4ba0-a5b2-ee59418a3064';
    
    console.log('=== Testing Exa API Directly ===');
    console.log('API Key:', exaApiKey.substring(0, 10) + '...');
    
    const response = await axios.post(
      'https://api.exa.ai/search',
      {
        query: 'privacy chat law in europe',
        num_results: 5,
        type: 'keyword',
        contents: {
          text: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${exaApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n=== Exa Results ===');
    console.log('Total results:', response.data.results?.length || 0);
    
    if (response.data.results) {
      response.data.results.forEach((result, idx) => {
        console.log(`\n${idx + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Score: ${result.score}`);
        console.log(`   Published: ${result.publishedDate || 'N/A'}`);
        console.log(`   Text preview: ${(result.text || '').substring(0, 100)}...`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Exa test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

debugExa();

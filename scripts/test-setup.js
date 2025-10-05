const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/models');
const logger = require('../src/utils/logger');

async function runSetupCheck() {
  console.log('=== FranciscoMoney Intel Setup Check ===\n');
  
  let allPassed = true;

  // 1. Check if .env file exists
  console.log('1. Checking .env file...');
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    console.log('   ✅ .env file exists');
  } else {
    console.log('   ❌ .env file not found');
    allPassed = false;
  }

  // 2. Check database connection
  console.log('\n2. Checking database connection...');
  try {
    await sequelize.authenticate();
    console.log('   ✅ Database connection successful');
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
    allPassed = false;
  }

  // 3. Check Redis connection
  console.log('\n3. Checking Redis connection...');
  try {
    const redis = require('redis');
    const redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    });
    
    await redisClient.connect();
    console.log('   ✅ Redis connection successful');
    await redisClient.quit();
  } catch (error) {
    console.log('   ❌ Redis connection failed:', error.message);
    allPassed = false;
  }

  // 4. List current configuration (without showing sensitive data)
  console.log('\n4. Current configuration:');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('   DB_HOST:', process.env.DB_HOST || 'not set');
  console.log('   DB_PORT:', process.env.DB_PORT || 'not set');
  console.log('   DB_NAME:', process.env.DB_NAME || 'not set');
  console.log('   REDIS_HOST:', process.env.REDIS_HOST || 'not set');
  console.log('   REDIS_PORT:', process.env.REDIS_PORT || 'not set');
  console.log('   PORT:', process.env.PORT || 'not set');

  // 5. Verify all required modules are installed
  console.log('\n5. Checking required modules...');
  const requiredModules = [
    'sequelize',
    'pg',
    'redis',
    'dotenv',
    'express',
    'cors',
    'helmet',
    'morgan',
    'winston',
    '@cerebras/cerebras_cloud_sdk'
  ];
  
  for (const module of requiredModules) {
    try {
      require.resolve(module);
      console.log(`   ✅ ${module}`);
    } catch (error) {
      console.log(`   ❌ ${module} not installed`);
      allPassed = false;
    }
  }

  // 6. Check if Cerebras API key is configured
  console.log('\n6. Checking Cerebras API key...');
  if (process.env.CEREBRAS_API_KEY) {
    console.log('   ✅ Cerebras API key is configured');
  } else {
    console.log('   ❌ Cerebras API key is not configured');
    allPassed = false;
  }

  // Final status
  console.log('\n=== Setup Check Summary ===');
  if (allPassed) {
    console.log('✅ All checks passed! Setup is complete.');
  } else {
    console.log('❌ Some checks failed. Please review the setup.');
  }
}

// Load environment variables
require('dotenv').config();

// Run the setup check
runSetupCheck().catch(error => {
  logger.error('Setup check failed with error:', error);
  process.exit(1);
});
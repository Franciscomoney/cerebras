require('dotenv').config();
const { User } = require('../src/models');
const logger = require('../src/utils/logger');

async function createAdminUser() {
  try {
    const adminEmail = 'f@pachoman.com';
    const adminPassword = 'C@rlos2025';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      logger.info('Admin user already exists');
      return existingAdmin;
    }
    
    // Create admin user
    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      isAdmin: true,
      isVerified: true
    });
    
    logger.info('Admin user created successfully');
    return admin;
    
  } catch (error) {
    logger.error('Error creating admin user:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('Admin user created successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to create admin user:', error);
      process.exit(1);
    });
}

module.exports = createAdminUser;
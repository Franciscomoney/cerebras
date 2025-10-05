const { sequelize } = require('../src/models');

async function migrate() {
  try {
    console.log('Starting migration: Adding email verification columns...');
    
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Users' 
      AND column_name IN ('isEmailVerified', 'verificationToken', 'pendingAlertData')
    `);
    
    const existingColumns = results.map(r => r.column_name);
    console.log('Existing columns:', existingColumns);
    
    // Add isEmailVerified if it doesn't exist
    if (!existingColumns.includes('isEmailVerified')) {
      console.log('Adding isEmailVerified column...');
      await sequelize.query(`
        ALTER TABLE "Users" 
        ADD COLUMN "isEmailVerified" BOOLEAN DEFAULT false
      `);
      console.log('✓ Added isEmailVerified column');
    } else {
      console.log('✓ isEmailVerified column already exists');
    }
    
    // Add verificationToken if it doesn't exist
    if (!existingColumns.includes('verificationToken')) {
      console.log('Adding verificationToken column...');
      await sequelize.query(`
        ALTER TABLE "Users" 
        ADD COLUMN "verificationToken" VARCHAR(255)
      `);
      console.log('✓ Added verificationToken column');
    } else {
      console.log('✓ verificationToken column already exists');
    }
    
    // Add pendingAlertData if it doesn't exist
    if (!existingColumns.includes('pendingAlertData')) {
      console.log('Adding pendingAlertData column...');
      await sequelize.query(`
        ALTER TABLE "Users" 
        ADD COLUMN "pendingAlertData" JSONB
      `);
      console.log('✓ Added pendingAlertData column');
    } else {
      console.log('✓ pendingAlertData column already exists');
    }
    
    console.log('\n=== Migration completed successfully! ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();

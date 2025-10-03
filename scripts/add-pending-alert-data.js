const { sequelize } = require('../src/models');

async function addPendingAlertDataField() {
  try {
    console.log('Adding pendingAlertData field to Users table...');

    await sequelize.query(`
      ALTER TABLE "Users"
      ADD COLUMN IF NOT EXISTS "pendingAlertData" JSONB DEFAULT NULL;
    `);

    console.log('Field added successfully!');
    console.log('\nVerifying schema...');

    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Users'
      AND column_name IN ('isVerified', 'verificationToken', 'pendingAlertData')
      ORDER BY column_name;
    `);

    console.log('\nVerification fields in Users table:');
    console.table(results);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error adding field:', error);
    process.exit(1);
  }
}

addPendingAlertDataField();

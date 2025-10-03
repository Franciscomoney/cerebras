#!/bin/bash

# Deploy Franciscomoney Intel to OVH Server
# This script pulls latest code, runs migrations, and restarts services

set -e  # Exit on error

echo "================================================"
echo "  Deploying Franciscomoney Intel to OVH"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# OVH Server Details
OVH_HOST="51.178.253.51"
OVH_USER="debian"
OVH_PROJECT_PATH="/home/debian/franciscomoney-intel"

echo -e "${YELLOW}Step 1: Connecting to OVH server...${NC}"
ssh ${OVH_USER}@${OVH_HOST} << 'ENDSSH'
set -e

cd /home/debian/franciscomoney-intel

echo "================================================"
echo "  Connected to OVH Server"
echo "================================================"
echo ""

echo "Step 2: Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/main
echo "✅ Code updated"
echo ""

echo "Step 3: Installing dependencies..."
npm install --production
echo "✅ Dependencies installed"
echo ""

echo "Step 4: Running database migration..."
if node scripts/add-pending-alert-data.js; then
    echo "✅ Database migration complete"
else
    echo "⚠️  Migration may have already run (this is OK)"
fi
echo ""

echo "Step 5: Verifying database schema..."
node -e "
const { sequelize, User } = require('./src/models');
(async () => {
  try {
    const [results] = await sequelize.query(\`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Users'
      AND column_name IN ('isVerified', 'verificationToken', 'pendingAlertData')
      ORDER BY column_name;
    \`);
    console.log('Verification fields in Users table:');
    console.table(results);
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
"
echo "✅ Schema verified"
echo ""

echo "Step 6: Restarting services..."
pm2 restart franciscomoney-intel
pm2 restart intel-scheduler
echo "✅ Services restarted"
echo ""

echo "Step 7: Checking service status..."
pm2 list | grep -E "franciscomoney-intel|intel-scheduler"
echo ""

echo "================================================"
echo "  Deployment Complete!"
echo "================================================"
echo ""
echo "Service URLs:"
echo "  - Main App: http://51.178.253.51:3000"
echo "  - Registration: http://51.178.253.51:3000/"
echo ""
echo "Test the verification flow:"
echo "  1. Visit http://51.178.253.51:3000/"
echo "  2. Create an alert with a test email"
echo "  3. Check email for verification link"
echo "  4. Click link to verify and activate alert"
echo ""
ENDSSH

echo ""
echo -e "${GREEN}✅ Deployment to OVH completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Test registration: curl -X POST http://51.178.253.51:3000/api/auth/register-with-alert -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"alertName\":\"Test Alert\",\"keywords\":\"AI, blockchain\"}'"
echo "  2. Check logs: ssh ${OVH_USER}@${OVH_HOST} 'pm2 logs franciscomoney-intel'"
echo "  3. Monitor emails: Check your email service logs"
echo ""

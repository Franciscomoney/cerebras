# Deployment Instructions for OVH Server

## Manual Deployment Steps

### Step 1: Connect to OVH Server
```bash
# From Vultr server, use the OVH connection tool
/root/coding/claudecode/projects/ovh/ovh connect ovh-debian
```

### Step 2: Navigate to Project Directory
```bash
cd /home/debian/franciscomoney-intel
```

### Step 3: Pull Latest Code
```bash
git fetch origin
git reset --hard origin/main
```

### Step 4: Install Dependencies
```bash
npm install --production
```

### Step 5: Run Database Migration
```bash
node scripts/add-pending-alert-data.js
```

Expected output:
```
Adding pendingAlertData field to Users table...
Field added successfully!

Verifying schema...
Verification fields in Users table:
┌─────────┬──────────────────────┬───────────┬─────────────┬────────────────┐
│ (index) │ column_name          │ data_type │ is_nullable │ column_default │
├─────────┼──────────────────────┼───────────┼─────────────┼────────────────┤
│ 0       │ 'isVerified'         │ 'boolean' │ 'YES'       │ 'false'        │
│ 1       │ 'pendingAlertData'   │ 'jsonb'   │ 'YES'       │ null           │
│ 2       │ 'verificationToken'  │ 'varchar' │ 'YES'       │ null           │
└─────────┴──────────────────────┴───────────┴─────────────┴────────────────┘
```

### Step 6: Restart Services
```bash
pm2 restart franciscomoney-intel
pm2 restart intel-scheduler
```

### Step 7: Verify Services are Running
```bash
pm2 list
```

Expected output should show both services as "online" with status 0.

### Step 8: Check Logs
```bash
# Watch main app logs
pm2 logs franciscomoney-intel --lines 50

# Watch scheduler logs
pm2 logs intel-scheduler --lines 20
```

## Testing the Verification Flow

### Test 1: Register with Alert
```bash
curl -X POST http://localhost:3000/api/auth/register-with-alert \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-verify@example.com",
    "alertName": "Test Verification Alert",
    "keywords": "AI, blockchain, CBDC"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Check your email to verify your account and activate your alert."
}
```

### Test 2: Check Database for Pending Alert
```bash
psql -U postgres -d franciscomoney_intel -c "
  SELECT
    email,
    \"isVerified\",
    \"verificationToken\" IS NOT NULL as has_token,
    \"pendingAlertData\"->>'alertName' as pending_alert_name,
    \"pendingAlertData\"->>'keywords' as pending_keywords
  FROM \"Users\"
  WHERE email='test-verify@example.com';
"
```

Expected output:
```
        email         | isVerified | has_token | pending_alert_name  | pending_keywords
----------------------+------------+-----------+---------------------+------------------
 test-verify@example.com | f          | t         | Test Verification Alert | AI, blockchain, CBDC
```

### Test 3: Check Email Was Sent
```bash
# If using console email mode
ls -lh storage/emails/ | tail -5

# If using SMTP, check email logs
psql -U postgres -d franciscomoney_intel -c "
  SELECT * FROM \"EmailLogs\"
  ORDER BY \"createdAt\" DESC
  LIMIT 3;
"
```

### Test 4: Get Verification Token and Verify
```bash
# Get the token
TOKEN=$(psql -U postgres -d franciscomoney_intel -t -c "
  SELECT \"verificationToken\"
  FROM \"Users\"
  WHERE email='test-verify@example.com';
" | xargs)

echo "Verification URL: http://51.178.253.51:3000/api/auth/verify-email/$TOKEN"

# Verify the email
curl "http://localhost:3000/api/auth/verify-email/$TOKEN"
```

Expected: HTML page with success message showing alert was created.

### Test 5: Verify Alert Was Created
```bash
psql -U postgres -d franciscomoney_intel -c "
  SELECT
    a.name,
    a.keywords,
    a.\"isActive\",
    u.email
  FROM \"Alerts\" a
  JOIN \"Users\" u ON a.\"userId\" = u.id
  WHERE u.email='test-verify@example.com';
"
```

Expected output:
```
         name          |      keywords      | isActive |         email
-----------------------+--------------------+----------+----------------------
 Test Verification Alert | AI, blockchain, CBDC | t        | test-verify@example.com
```

### Test 6: Verify User is Now Verified
```bash
psql -U postgres -d franciscomoney_intel -c "
  SELECT
    email,
    \"isVerified\",
    \"verificationToken\",
    \"pendingAlertData\"
  FROM \"Users\"
  WHERE email='test-verify@example.com';
"
```

Expected:
- isVerified: true
- verificationToken: null
- pendingAlertData: null

## Cleanup Test Data

After testing, clean up:
```bash
psql -U postgres -d franciscomoney_intel -c "
  DELETE FROM \"Alerts\"
  WHERE \"userId\" IN (
    SELECT id FROM \"Users\"
    WHERE email='test-verify@example.com'
  );

  DELETE FROM \"Users\"
  WHERE email='test-verify@example.com';
"
```

## Troubleshooting

### Issue: Migration fails with "column already exists"
This is normal if the migration was already run. The field is already there.

### Issue: Email not sending
Check EMAIL_MODE in .env:
```bash
grep EMAIL_MODE /home/debian/franciscomoney-intel/.env
```

If EMAIL_MODE=console, emails are saved to storage/emails/

### Issue: Services won't restart
```bash
pm2 delete franciscomoney-intel
pm2 delete intel-scheduler

# Then restart from the project directory
cd /home/debian/franciscomoney-intel
pm2 start src/server.js --name franciscomoney-intel
pm2 start src/workers/scheduler.js --name intel-scheduler
pm2 save
```

### Issue: Verification link doesn't work
Make sure SITE_URL is correct in .env:
```bash
grep SITE_URL /home/debian/franciscomoney-intel/.env
```

Should be: `SITE_URL=http://51.178.253.51:3000`

## Rollback (if needed)

If something goes wrong:
```bash
cd /home/debian/franciscomoney-intel
git reset --hard HEAD~1  # Go back one commit
pm2 restart all
```

## Success Criteria

✅ Code deployed and services restarted
✅ Database migration completed
✅ User can register with alert data
✅ Verification email sent
✅ Clicking verification link creates alert
✅ User marked as verified
✅ Welcome email sent with first report
✅ Unverified users don't receive weekly emails

## Access URLs

After deployment, test at:
- Homepage: http://51.178.253.51:3000/
- Registration: Create alert on homepage
- Verification: Click link in email
- Login: http://51.178.253.51:3000/login
- Dashboard: http://51.178.253.51:3000/dashboard

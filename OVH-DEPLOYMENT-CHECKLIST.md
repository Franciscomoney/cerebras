# OVH Deployment Checklist - Email Verification Flow

## Quick Reference

**What:** Deploy email verification flow for Franciscomoney Intel
**Where:** OVH Server (51.178.253.51)
**When:** Ready to deploy now
**Time:** ~10 minutes

## Pre-Deployment Checklist

- [ ] Code committed and pushed to GitHub (✅ Already done)
- [ ] Local logic test passes (✅ Already done)
- [ ] Database migration script ready (✅ Ready)
- [ ] Deployment instructions prepared (✅ Ready)

## Deployment Steps (Copy & Paste)

### Step 1: Connect to OVH Server

```bash
# From Vultr server
/root/coding/claudecode/projects/ovh/ovh connect ovh-debian
```

### Step 2: Navigate to Project

```bash
cd /home/debian/franciscomoney-intel
pwd  # Should show: /home/debian/franciscomoney-intel
```

### Step 3: Pull Latest Code

```bash
git fetch origin
git reset --hard origin/main
git log -1 --oneline  # Should show: "Add deployment tools and testing scripts"
```

Expected output: Commit about email verification flow

### Step 4: Run Database Migration

```bash
node scripts/add-pending-alert-data.js
```

**Expected Output:**
```
Adding pendingAlertData field to Users table...
Field added successfully!

Verifying schema...
Verification fields in Users table:
┌─────────┬──────────────────────┬───────────┐
│ (index) │ column_name          │ data_type │
├─────────┼──────────────────────┼───────────┤
│ 0       │ 'isVerified'         │ 'boolean' │
│ 1       │ 'pendingAlertData'   │ 'jsonb'   │
│ 2       │ 'verificationToken'  │ 'varchar' │
└─────────┴──────────────────────┴───────────┘
```

**If it says "column already exists":** That's OK, field is already there.

### Step 5: Restart Services

```bash
pm2 restart franciscomoney-intel
pm2 restart intel-scheduler
```

**Expected Output:**
```
[PM2] Applying action restartProcessId on app [franciscomoney-intel](ids: [ 0 ])
[PM2] [franciscomoney-intel](0) ✓
```

### Step 6: Verify Services Running

```bash
pm2 list
```

**Expected:** Both services should show status "online" with uptime starting from 0s.

### Step 7: Check Logs (Optional)

```bash
pm2 logs franciscomoney-intel --lines 20
```

Press Ctrl+C to exit logs.

## Testing the Implementation

### Test 1: Register with Alert (Quick Test)

```bash
curl -X POST http://localhost:3000/api/auth/register-with-alert \
  -H "Content-Type: application/json" \
  -d '{
    "email": "deployment-test@example.com",
    "alertName": "Deployment Test Alert",
    "keywords": "AI, blockchain, testing"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Check your email to verify your account and activate your alert."
}
```

### Test 2: Verify User Created (No Alert Yet)

```bash
psql -U postgres -d franciscomoney_intel -c "
  SELECT
    email,
    \"isVerified\",
    \"pendingAlertData\"->>'alertName' as pending_alert_name
  FROM \"Users\"
  WHERE email='deployment-test@example.com'
  LIMIT 1;
"
```

**Expected Output:**
```
         email              | isVerified | pending_alert_name
----------------------------+------------+--------------------
 deployment-test@example.com | f          | Deployment Test Alert
```

### Test 3: Check No Alert Created Yet

```bash
psql -U postgres -d franciscomoney_intel -c "
  SELECT COUNT(*) as alert_count
  FROM \"Alerts\" a
  JOIN \"Users\" u ON a.\"userId\" = u.id
  WHERE u.email='deployment-test@example.com';
"
```

**Expected:** `alert_count = 0` (no alert yet!)

### Test 4: Simulate Email Verification

```bash
# Get the verification token
TOKEN=$(psql -U postgres -d franciscomoney_intel -t -c "
  SELECT \"verificationToken\"
  FROM \"Users\"
  WHERE email='deployment-test@example.com';
" | xargs)

echo "Token: $TOKEN"

# Verify the email
curl -s "http://localhost:3000/api/auth/verify-email/$TOKEN" | head -20
```

**Expected:** HTML page with "✅ Email Verified Successfully!"

### Test 5: Verify Alert Was Created After Verification

```bash
psql -U postgres -d franciscomoney_intel -c "
  SELECT
    a.name,
    a.keywords,
    a.\"isActive\",
    u.\"isVerified\"
  FROM \"Alerts\" a
  JOIN \"Users\" u ON a.\"userId\" = u.id
  WHERE u.email='deployment-test@example.com';
"
```

**Expected Output:**
```
         name          |       keywords        | isActive | isVerified
-----------------------+-----------------------+----------+------------
 Deployment Test Alert | AI, blockchain, testing |    t     |     t
```

### Test 6: Verify Pending Data Cleared

```bash
psql -U postgres -d franciscomoney_intel -c "
  SELECT
    email,
    \"isVerified\",
    \"verificationToken\",
    \"pendingAlertData\"
  FROM \"Users\"
  WHERE email='deployment-test@example.com';
"
```

**Expected:**
- `isVerified`: `t` (true)
- `verificationToken`: `null`
- `pendingAlertData`: `null`

### Cleanup Test Data

```bash
psql -U postgres -d franciscomoney_intel -c "
  DELETE FROM \"Alerts\"
  WHERE \"userId\" IN (
    SELECT id FROM \"Users\"
    WHERE email='deployment-test@example.com'
  );

  DELETE FROM \"Users\"
  WHERE email='deployment-test@example.com';

  SELECT 'Test data cleaned up' as status;
"
```

## Production Testing (From Web Browser)

After cleanup, test with real email:

1. Visit: http://51.178.253.51:3000/
2. Enter keywords: "AI, blockchain"
3. Click "Create Alert"
4. Enter your real email address
5. Submit form
6. Check your email inbox
7. Click verification link in email
8. Should see success page
9. Should receive welcome email (if documents available)

## Success Criteria

✅ Code deployed from GitHub
✅ Database migration completed
✅ Services restarted successfully
✅ Registration creates user with pending alert data
✅ No alert created until verification
✅ Verification creates alert
✅ Pending data cleared after verification
✅ Unverified users won't receive weekly emails

## Rollback (If Needed)

If something goes wrong:

```bash
cd /home/debian/franciscomoney-intel
git log -3 --oneline  # See recent commits
git reset --hard <PREVIOUS_COMMIT_HASH>
pm2 restart all
```

## Common Issues

### Issue: "column already exists"
**Solution:** Field is already there, continue with deployment.

### Issue: Services show "errored" status
**Solution:**
```bash
pm2 logs franciscomoney-intel --err
pm2 delete franciscomoney-intel intel-scheduler
pm2 start src/server.js --name franciscomoney-intel
pm2 start src/workers/scheduler.js --name intel-scheduler
pm2 save
```

### Issue: Email not sending
**Solution:** Check EMAIL_MODE:
```bash
grep EMAIL_MODE .env
```
If `console`, emails are in `storage/emails/`

## Post-Deployment Monitoring

Monitor for 24 hours:

```bash
# Check logs periodically
pm2 logs franciscomoney-intel --lines 100

# Check for new registrations
psql -U postgres -d franciscomoney_intel -c "
  SELECT
    email,
    \"isVerified\",
    \"createdAt\"
  FROM \"Users\"
  ORDER BY \"createdAt\" DESC
  LIMIT 10;
"

# Check verification rate
psql -U postgres -d franciscomoney_intel -c "
  SELECT
    COUNT(*) FILTER (WHERE \"isVerified\" = true) as verified,
    COUNT(*) FILTER (WHERE \"isVerified\" = false) as unverified,
    COUNT(*) as total
  FROM \"Users\"
  WHERE \"createdAt\" > NOW() - INTERVAL '24 hours';
"
```

## Support

If you encounter issues:
1. Check logs: `pm2 logs franciscomoney-intel`
2. Check database: `psql -U postgres -d franciscomoney_intel`
3. Review `EMAIL-VERIFICATION-IMPLEMENTATION.md` for details
4. Review `DEPLOY-INSTRUCTIONS.md` for troubleshooting

## Completion Checklist

- [ ] Connected to OVH server
- [ ] Pulled latest code
- [ ] Ran database migration
- [ ] Restarted services
- [ ] Verified services running
- [ ] Tested registration endpoint
- [ ] Verified user created with pending data
- [ ] Tested verification endpoint
- [ ] Verified alert created after verification
- [ ] Cleaned up test data
- [ ] Tested from web browser (optional)

## Deployment Complete!

Once all steps pass, the email verification flow is LIVE.

Users will now:
1. Register with alert keywords
2. Receive verification email
3. Click link to verify
4. Have alert created automatically
5. Receive welcome email
6. Get weekly reports (verified users only)

**Deployment Status:** Ready to deploy ✅
**Estimated Time:** 10 minutes
**Risk Level:** Low (includes rollback plan)

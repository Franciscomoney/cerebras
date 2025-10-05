# Email Verification Implementation - Complete

## Overview

This document describes the complete email verification flow implementation for Franciscomoney Intel. The new system ensures that users must verify their email before any alerts are created or emails are sent.

## Problem Solved

**Before:** Users registered and immediately received alerts, leading to potential spam and unverified email addresses in the database.

**After:** Users must verify their email address before any alert is created. Only verified users receive weekly intelligence reports.

## Implementation Details

### 1. Database Schema Changes

**File:** `src/models/User.js`

Added `pendingAlertData` field to store alert information until email is verified:

```javascript
pendingAlertData: {
  type: DataTypes.JSONB,
  allowNull: true,
  defaultValue: null,
}
```

**Migration Script:** `scripts/add-pending-alert-data.js`

Adds the field to existing databases:
```bash
node scripts/add-pending-alert-data.js
```

### 2. Registration Flow

**File:** `src/api/auth.js`

**New Endpoint:** `POST /api/auth/register-with-alert`

**Input:**
```json
{
  "email": "user@example.com",
  "alertName": "AI Intelligence",
  "keywords": "AI, blockchain, CBDC",
  "password": "optional"
}
```

**Process:**
1. Check if email already exists
2. Generate cryptographic verification token
3. Create user with `isVerified: false`
4. Store alert data in `pendingAlertData` (DO NOT create alert yet)
5. Send verification email with token link
6. Return success message

**Output:**
```json
{
  "success": true,
  "message": "Check your email to verify your account and activate your alert."
}
```

### 3. Verification Email

**File:** `src/services/emailService.js`

**Function:** `sendVerificationEmail(email, token, alertName)`

**Email Content:**
- Professional HTML design with gradient header
- Clear call-to-action button
- Shows alert name and status
- Explains what happens after verification
- Copy-pasteable verification link

**Verification URL Format:**
```
http://51.178.253.51:3000/api/auth/verify-email/{TOKEN}
```

### 4. Email Verification Endpoint

**File:** `src/api/auth.js`

**Endpoint:** `GET /api/auth/verify-email/:token`

**Process:**
1. Find user by verification token
2. If not found → Show error page
3. Mark user as verified (`isVerified: true`)
4. Clear verification token
5. **Create alert from `pendingAlertData`**
6. Clear `pendingAlertData`
7. Send immediate welcome email with first report
8. Show success page with alert details

**Success Page:**
- HTML page with green success card
- Shows alert name, keywords, frequency
- Links to login and homepage
- Explains when weekly emails will arrive

### 5. Alert Processor Updates

**File:** `src/workers/alertProcessor.js`

**Key Change:** Alert processor already had the filter for verified users only:

```javascript
const alerts = await Alert.findAll({
  where: { isActive: true },
  include: [{
    model: User,
    as: 'user',
    where: { isVerified: true }  // THIS IS THE KEY
  }]
});
```

**New Function:** `sendAlertEmail(alertId)`
- Used for sending immediate welcome email after verification
- Processes a single alert by ID
- Only sends if user is verified

### 6. Frontend Updates

**File:** `public/index.html`

**Changes:**
- Updated form submission to use `/api/auth/register-with-alert`
- Sends alert data with registration
- Better success message
- 5-second delay before closing modal

**User Experience:**
1. User enters keywords on homepage
2. Modal opens with pre-filled alert name
3. User enters email
4. Form submits to new endpoint
5. Success message: "Check your email to verify your account and activate your alert!"
6. Modal closes after 5 seconds

## Complete User Flow

```
1. User visits homepage
   ↓
2. Enters keywords (e.g., "AI, blockchain")
   ↓
3. Clicks "Create Alert"
   ↓
4. Modal opens, user enters email
   ↓
5. Submit → POST /api/auth/register-with-alert
   ↓
6. User created with:
   - isVerified: false
   - verificationToken: {random_token}
   - pendingAlertData: {alertName, keywords}
   - NO ALERT CREATED YET
   ↓
7. Verification email sent
   ↓
8. User clicks verification link in email
   ↓
9. GET /api/auth/verify-email/{token}
   ↓
10. User verified:
    - isVerified: true
    - verificationToken: null
    ↓
11. Alert created from pendingAlertData:
    - name: "AI, blockchain Alert"
    - keywords: "AI, blockchain"
    - isActive: true
    - userId: {user_id}
    ↓
12. pendingAlertData cleared (null)
    ↓
13. Welcome email sent immediately
    ↓
14. User sees success page
    ↓
15. Weekly emails start (for verified users only)
```

## Security Features

1. **Cryptographic Tokens:** Uses `crypto.randomBytes(32)` for verification tokens
2. **One-Time Use:** Token is cleared after successful verification
3. **Token Validation:** Invalid tokens show error page
4. **Password Hashing:** User passwords are hashed with bcrypt
5. **JSONB Storage:** Alert data stored securely in database

## Database Queries for Testing

### Before Verification
```sql
SELECT
  email,
  "isVerified",
  "verificationToken" IS NOT NULL as has_token,
  "pendingAlertData"->>'alertName' as pending_alert
FROM "Users"
WHERE email='test@example.com';
```

Expected: `isVerified=false`, `has_token=true`, `pending_alert='Alert Name'`

### After Verification
```sql
SELECT
  email,
  "isVerified",
  "verificationToken",
  "pendingAlertData"
FROM "Users"
WHERE email='test@example.com';
```

Expected: `isVerified=true`, `verificationToken=null`, `pendingAlertData=null`

### Check Alert Created
```sql
SELECT
  a.name,
  a.keywords,
  a."isActive",
  u.email
FROM "Alerts" a
JOIN "Users" u ON a."userId" = u.id
WHERE u.email='test@example.com';
```

Expected: One row with alert details

### Verify No Unverified Alerts Get Emails
```sql
SELECT COUNT(*) as should_be_zero
FROM "Alerts" a
JOIN "Users" u ON a."userId" = u.id
WHERE a."isActive" = true
AND u."isVerified" = false;
```

Expected: `should_be_zero=0`

## Files Modified

### Core Implementation
- `src/models/User.js` - Added pendingAlertData field
- `src/api/auth.js` - New registration and verification endpoints
- `src/services/emailService.js` - Enhanced verification email
- `src/workers/alertProcessor.js` - Added sendAlertEmail helper
- `public/index.html` - Updated frontend form

### Deployment & Testing
- `scripts/add-pending-alert-data.js` - Database migration
- `deploy-to-ovh.sh` - Automated deployment script
- `DEPLOY-INSTRUCTIONS.md` - Manual deployment guide
- `test-verification-logic.js` - Logic validation test

## Deployment Instructions

### Quick Deploy (SSH to OVH first)

```bash
# Connect to OVH
/root/coding/claudecode/projects/ovh/ovh connect ovh-debian

# Navigate to project
cd /home/debian/franciscomoney-intel

# Pull latest code
git pull origin main

# Run migration
node scripts/add-pending-alert-data.js

# Restart services
pm2 restart franciscomoney-intel intel-scheduler

# Verify
pm2 list
```

### Test the Flow

```bash
# 1. Register with alert
curl -X POST http://localhost:3000/api/auth/register-with-alert \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "alertName": "Test Alert",
    "keywords": "AI, blockchain"
  }'

# 2. Get verification token
TOKEN=$(psql -U postgres -d franciscomoney_intel -t -c \
  "SELECT \"verificationToken\" FROM \"Users\" WHERE email='test@example.com';" | xargs)

# 3. Verify email
curl "http://localhost:3000/api/auth/verify-email/$TOKEN"

# 4. Check alert was created
psql -U postgres -d franciscomoney_intel -c \
  "SELECT a.name, u.email, u.\"isVerified\"
   FROM \"Alerts\" a
   JOIN \"Users\" u ON a.\"userId\" = u.id
   WHERE u.email='test@example.com';"
```

## Success Criteria

✅ User registration does NOT create alert immediately
✅ Verification email sent with token link
✅ Clicking verification link marks user as verified
✅ Alert created from pendingAlertData after verification
✅ pendingAlertData cleared after alert creation
✅ Welcome email sent with first report
✅ Weekly emails ONLY sent to verified users
✅ Unverified users receive NO emails
✅ Invalid tokens show error page
✅ Verified tokens are one-time use

## Access URLs (After Deployment)

- **Homepage:** http://51.178.253.51:3000/
- **Registration:** Create alert on homepage
- **Verification:** Link sent via email
- **Login:** http://51.178.253.51:3000/login
- **Dashboard:** http://51.178.253.51:3000/dashboard

## Troubleshooting

### Email not sending?
Check `EMAIL_MODE` in `.env`:
- If `console`: Emails saved to `storage/emails/`
- If `smtp`: Check SMTP credentials

### Migration fails?
Already run? Field may already exist. Check:
```sql
\d "Users"
```

### Services won't restart?
```bash
pm2 delete all
cd /home/debian/franciscomoney-intel
pm2 start src/server.js --name franciscomoney-intel
pm2 start src/workers/scheduler.js --name intel-scheduler
pm2 save
```

## Rollback Plan

If issues occur after deployment:
```bash
cd /home/debian/franciscomoney-intel
git reset --hard HEAD~2  # Go back before these changes
pm2 restart all
```

## Future Enhancements

Potential improvements:
1. Add email verification resend feature
2. Add verification token expiry (24 hours)
3. Add email change verification
4. Add bulk verification status check admin page
5. Add verification metrics dashboard

## Conclusion

This implementation provides a robust email verification system that:
- Prevents spam and invalid email addresses
- Ensures users actually want to receive emails
- Creates a better user experience
- Protects the email sender reputation
- Complies with email marketing best practices

All code has been committed to the repository and is ready for deployment to the OVH server.

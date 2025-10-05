# Test Discovery Tab - Implementation Guide

## Overview

Add a complete end-to-end testing feature to the admin dashboard where you can:
1. Enter a search topic (e.g., "Central Bank Digital Currencies")
2. Enter a test email address
3. Watch the entire flow execute with live progress
4. See discovered PDFs
5. Preview the generated email
6. Receive the actual test email

## Files to Update

### 1. Admin UI (`/public/admin.html`)

**Step 1:** Add tab button (around line 54, in tab navigation):
```html
<button class="tab" onclick="showTab('test')">Test Discovery</button>
```

**Step 2:** Add tab content (copy entire content from `/tmp/admin-test-tab.html`)
- Insert after the Analytics tab (around line 350)
- Includes: form, progress tracker, results display, email preview

### 2. Backend Endpoints (`/src/server.js`)

Add 4 new test endpoints (copy from `/tmp/test-endpoints.js`):

```javascript
POST /api/test/create-temp-topic
POST /api/test/generate-email
POST /api/test/send-test-email
DELETE /api/test/cleanup-temp-topic/:topicAreaId
```

Also includes 2 helper functions:
- `generateIntelligenceEmail()` - Creates beautiful HTML email
- `generateNoResultsEmail()` - For when no PDFs found

## User Experience Flow

### Step 1: User Fills Form
```
Search Topic: "Climate Finance Policy"
Test Email: admin@example.com
Number of PDFs: 5
Search Period: Last 15 days
```

### Step 2: Live Progress Tracker Shows:
```
⏳ Creating temporary topic area
⏳ Discovering PDFs with Exa.ai
⏳ Processing discovered PDFs
⏳ Generating email content
⏳ Sending test email
```

Each step updates with:
- 🔄 Spinner when running
- ✓ Green checkmark when complete
- ✗ Red X if failed

### Step 3: Results Display Shows:

**Discovery Results:**
```
Total Results: 47
PDFs Found: 23
Cost: $0.01

Search Query Used: "Climate finance policy research reports sustainable development 2025"
```

**Discovered PDFs List:**
```
1. IEA Climate Finance Report 2025
   View PDF | 92% relevant

2. World Bank Green Bonds Study
   View PDF | 88% relevant

... (up to 5)
```

**Email Preview:**
Full HTML preview of the email that will be sent

**Email Status:**
```
✓ Email Sent Successfully!
Check admin@example.com for the test alert email
Message ID: <abc123@franciscomoney.com>
```

## Email Template Features

### Beautiful HTML Email Includes:

1. **Header**
   - Franciscomoney Intel branding
   - Gradient background
   - "AI-Powered Intelligence Briefing" subtitle

2. **Introduction**
   - Personalized topic name
   - Count of reports found
   - Friendly welcome text

3. **Each Report Card Shows:**
   - Report number badge (1, 2, 3...)
   - Title (bold, prominent)
   - Organization & publication date
   - AI-generated summary (2-3 sentences)
   - Impact score (visual: ●●●●●○○○○○ 5/10)
   - "Read Full Analysis →" button linking to PDF

4. **Footer**
   - Manage Alerts link
   - Unsubscribe link
   - Copyright notice

5. **Test Banner** (Only on test emails)
   - Yellow warning banner at top
   - "⚠️ This is a Test Email"
   - Removed in production emails

### Mobile Responsive
- Uses HTML tables (email-safe)
- Adapts to all email clients
- Tested format (Gmail, Outlook, Apple Mail)

## Implementation Steps

### Quick Integration (15 minutes)

**1. Update Admin HTML:**
```bash
ssh debian@51.178.253.51
cd /home/debian/franciscomoney-intel

# Backup
cp public/admin.html public/admin.html.backup-test-tab

# Add tab button manually or use patch
# Add tab content from admin-test-tab.html
```

**2. Add Backend Endpoints:**
```bash
# Add endpoints from test-endpoints.js to server.js
# Around line 200-300 (with other API routes)
```

**3. Test:**
- Visit http://51.178.253.51:3000/admin
- Click "Test Discovery" tab
- Fill form and run test

## Technical Details

### How It Works:

1. **Create Temp Topic**
   - Creates TopicArea with `[TEST]` prefix
   - Flags with `isTest: true` for cleanup
   - Returns topicAreaId

2. **Discover PDFs**
   - Calls existing Exa discovery service
   - Uses real API (counts toward rate limits)
   - Returns real results

3. **Process PDFs**
   - Simulated delay (1.5 seconds)
   - In production, would be automatic
   - Shows user the processing step

4. **Generate Email**
   - Uses production email template
   - Processes sources into formatted HTML
   - Calculates impact scores
   - Returns subject + HTML

5. **Send Email**
   - Uses configured SMTP settings
   - Adds test banner
   - Real email delivery
   - Returns messageId

6. **Cleanup**
   - Deletes temp topic area
   - Deletes associated sources
   - Keeps database clean

### Cost Considerations

**Test Discovery Costs:**
- Exa API call: $0.01 per test
- Email sending: Free (self-hosted SMTP)
- Processing: Minimal

**Rate Limits Apply:**
- Tests count toward daily limits
- Shows remaining searches
- Use sparingly

## Testing Scenarios

### Scenario 1: Popular Topic
```
Search: "Artificial Intelligence Regulation"
Expected: 10-15 PDFs found
Email: 5 top reports with good summaries
```

### Scenario 2: Niche Topic
```
Search: "Quantum Computing Ethics"
Expected: 2-5 PDFs found
Email: All discovered reports
```

### Scenario 3: No Results
```
Search: "Xyz123 Nonexistent Topic"
Expected: 0 PDFs found
Email: "No New Reports Found" message
```

### Scenario 4: Error Handling
```
Invalid email: Shows error at send step
API failure: Shows which step failed
No API key: Clear error message
```

## Security Considerations

1. **Admin Only**
   - Test tab only visible to admins
   - Requires authentication
   - Check `isAdmin` middleware

2. **Temp Topic Cleanup**
   - Auto-deletes after test
   - Prevents database bloat
   - Marked with `isTest` flag

3. **Email Rate Limiting**
   - Prevent abuse
   - Limit tests per hour
   - Track test emails sent

4. **API Key Protection**
   - Test uses real Exa API key
   - Counts toward rate limits
   - Monitor test usage

## Troubleshooting

### "Exa API key not configured"
- Add key to .env or Settings table
- See QUICK-EXA-ADMIN-SETUP.md

### "Email send failed"
- Check SMTP configuration in .env
- Verify email service is running
- Check logs: `pm2 logs franciscomoney-intel`

### "No PDFs discovered"
- Topic might be too specific
- Try broader keywords
- Increase daysBack to 30

### "Test stuck on processing"
- Check backend logs
- Verify all endpoints added
- Check database connection

## Benefits

### For Development:
- Test entire pipeline without affecting production
- Verify email template rendering
- Debug discovery issues
- Validate SMTP configuration

### For Demo/Sales:
- Show live discovery to clients
- Demonstrate email quality
- Prove value proposition
- Generate sample reports on demand

### For Monitoring:
- Health check for all systems
- Verify Exa API working
- Test email deliverability
- Validate end-to-end flow

## Future Enhancements

- [ ] Save test results history
- [ ] Compare multiple topic searches
- [ ] A/B test email templates
- [ ] Scheduled test runs
- [ ] Slack notification option
- [ ] Export test data to CSV
- [ ] Performance metrics tracking

## Example Test Output

```
=== Test Results ===

Discovery:
✓ Total Results: 47
✓ PDFs Found: 23
✓ Sources Created: 5
✓ Cost: $0.01
✓ Search Query: "central bank digital currency privacy research 2025"

Email:
✓ Subject: Your CBDC Privacy Intelligence Brief - Test
✓ Recipients: 1
✓ Status: Sent
✓ Message ID: <abc123@franciscomoney.com>

Discovered PDFs:
1. BIS Working Paper: Privacy-Preserving CBDC Architectures (92% relevant)
2. ECB Study: Zero-Knowledge Proofs in Digital Euro (88% relevant)
3. MIT Research: Privacy vs. Compliance in CBDCs (85% relevant)
4. Bank of England: CBDC Privacy Layers (82% relevant)
5. Fed Paper: Privacy-Enhancing Technologies (79% relevant)

Test completed in 8.3 seconds
All systems operational ✓
```

## Summary

This test tab provides:
- ✅ Complete end-to-end testing
- ✅ Live progress tracking
- ✅ Real email generation & sending
- ✅ Beautiful HTML email template
- ✅ PDF discovery validation
- ✅ Admin-only access
- ✅ Auto-cleanup

Perfect for development, demos, and monitoring system health!

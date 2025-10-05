# Alert System Implementation - Francisco Money Intel

## Overview
Complete end-to-end alert system that discovers research papers via Exa.ai, processes them with Cerebras AI, and sends personalized intelligence reports via email.

## How It Works

### 1. User Creates Alert
- User logs in and creates an alert with keywords (e.g., "privacy chat law in europe")
- Alert saved to database with user preferences (frequency: weekly)

### 2. PDF Discovery via Exa.ai
**File:** `src/services/exaDiscovery.js`

When alert is created, the system:
- Takes user's keywords
- Calls Exa.ai semantic search API
- Discovers relevant research papers (PDFs, articles)
- Filters by relevance score (minimum 0.15)
- Saves discovered sources to `Sources` table
- Creates `TopicArea` to link sources to alerts

**Key Features:**
- Cost control: $0.01 per search
- Rate limiting: 50/hour, 200/day
- Semantic search (not just keyword matching)
- Searches: NBER, RAND, Carnegie Endowment, think tanks, universities

### 3. Document Processing
**File:** `src/models/Document.js` (created)

For each discovered source:
- Document record created in database
- Links to Source via sourceId
- Stores metadata (title, URL, published date)

**Document Model:**
```javascript
{
  id: UUID,
  sourceId: UUID,
  title: STRING,
  url: STRING,
  content: TEXT,
  summary: TEXT,
  publishedAt: DATE,
  metadata: JSONB
}
```

### 4. Alert Processing
**File:** `src/workers/alertProcessor.js`

The alert processor:
- Finds alerts ready to be sent (lastSentAt > 7 days or null)
- Retrieves associated sources/documents
- Generates AI summaries via Cerebras API
- Creates HTML email report
- Sends via SMTP
- Updates alert's `lastSentAt` timestamp

**Scheduler:**
- **Immediate**: First email sent when alert created
- **Weekly**: Every Tuesday at 9 AM ET (14:00 UTC)
- **Service**: `intel-scheduler` (PM2 process)

### 5. Email Generation & Delivery
**File:** `src/services/emailService.js`

Email includes:
- Personalized subject with user's keywords
- AI-generated summaries for each document
- Relevance scores (0-100%)
- Links to original PDFs
- Professional HTML template with branding

**SMTP Configuration:**
- Host: mail.franciscomoney.com
- Port: 465 (SSL/TLS)
- From: intelligence@franciscomoney.com
- Authentication: Working credentials in .env

## Complete Pipeline Flow

```
User Creates Alert
    ↓
Exa.ai Discovery (finds 10 relevant PDFs)
    ↓
Sources saved to database
    ↓
TopicArea created (links sources to alert)
    ↓
Documents created from sources
    ↓
Alert Processor triggered (immediate or scheduled)
    ↓
Cerebras AI generates summaries
    ↓
HTML email created with reports
    ↓
Email sent via SMTP
    ↓
Alert lastSentAt updated
    ↓
User receives intelligence report in inbox
```

## Files Created/Modified

### New Files:
1. **src/models/Document.js** - Document model for storing processed papers
2. **test-alert-fixed.js** - Test script for alert pipeline

### Modified Files:
1. **src/models/index.js** - Added Document model and associations
2. **src/services/emailService.js** - Fixed subject declaration scope
3. **src/services/exaDiscovery.js** - Patched to work with Alerts (not just TopicAreas)

## Database Schema

### Alerts Table
```sql
- id: UUID
- userId: UUID (foreign key to Users)
- name: STRING (alert name)
- keywords: TEXT (search keywords)
- isActive: BOOLEAN
- frequency: STRING ('weekly')
- lastSentAt: TIMESTAMP
- topicAreaId: UUID (foreign key to TopicAreas)
```

### Sources Table
```sql
- id: UUID
- topicAreaId: UUID (foreign key to TopicAreas)
- title: STRING
- url: STRING
- type: STRING ('pdf', 'article')
- settings: JSONB (metadata, relevanceScore)
- createdAt: TIMESTAMP
```

### Documents Table
```sql
- id: UUID
- sourceId: UUID (foreign key to Sources)
- title: STRING
- url: STRING
- content: TEXT
- summary: TEXT
- publishedAt: DATE
- metadata: JSONB
```

### TopicAreas Table
```sql
- id: UUID
- name: STRING
- slug: STRING
- keywords: ARRAY
- isActive: BOOLEAN
```

## API Endpoints

### Discovery
- `POST /api/discover/exa` - Trigger Exa discovery for alert
- `GET /api/discover/usage` - Check Exa API usage stats

### Alerts (User Dashboard)
- `GET /api/alerts/my-alerts` - Get user's alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert

## Environment Variables Required

```env
# SMTP Configuration
SMTP_HOST=mail.franciscomoney.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=intelligence@franciscomoney.com
SMTP_PASS=<password>
EMAIL_FROM=intelligence@franciscomoney.com

# API Keys
EXA_API_KEY=<your-exa-api-key>
CEREBRAS_API_KEY=<your-cerebras-api-key>

# Scheduler
EMAIL_SEND_SCHEDULE=0 14 * * 2  # Tuesday 9 AM ET
```

## Testing

### Manual Alert Processing
```bash
# Get alert ID
ALERT_ID=$(psql -U postgres -d franciscomoney_intel -t -c "
  SELECT id::text FROM \"Alerts\" 
  WHERE \"userId\" = (SELECT id FROM \"Users\" WHERE email = 'user@example.com')
  LIMIT 1;" | xargs)

# Process alert
node -e "
const alertProcessor = require('./src/workers/alertProcessor');
alertProcessor.processAlert('$ALERT_ID')
  .then(() => console.log('Success'))
  .catch(err => console.error(err));
"
```

### Check Email Logs
```bash
psql -U postgres -d franciscomoney_intel -c "
SELECT type, subject, recipientEmail, createdAt 
FROM \"EmailLogs\" 
ORDER BY createdAt DESC 
LIMIT 10;"
```

## Troubleshooting

### No Sources Found
- Check Exa API key is valid
- Verify keywords are relevant
- Check Exa usage limits (200/day)

### Email Not Sent
- Verify SMTP credentials in .env
- Check EmailLogs for errors
- Test SMTP connection manually

### Alert Not Processing
- Check PM2 scheduler is running: `pm2 list`
- View scheduler logs: `pm2 logs intel-scheduler`
- Verify alert has topicAreaId set

## Success Metrics

**First Working Alert (October 5, 2025):**
- User: francisco@moctezumatech.com
- Alert: "privacy chat law in europe"
- Sources discovered: 10 PDFs via Exa
- Email sent: ✅ (250 OK)
- Message ID: <5ac06c50-7d29-c9de-4fca-668168626703@franciscomoney.com>
- Time: 2025-10-05 12:05:35 UTC

## Architecture Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ Creates Alert
       ▼
┌─────────────────┐
│  Alert System   │
└────────┬────────┘
         │
         ├─► Exa.ai Discovery ──► Sources Table
         │
         ├─► TopicArea Created ──► Links Alert to Sources
         │
         ├─► Documents Created ──► From Sources
         │
         ▼
┌──────────────────┐
│ Alert Processor  │
│  (Scheduler)     │
└────────┬─────────┘
         │
         ├─► Cerebras AI ──► Generate Summaries
         │
         ├─► Email Service ──► Create HTML Report
         │
         ▼
┌──────────────────┐
│  SMTP Server     │
│ (franciscomoney) │
└────────┬─────────┘
         │
         ▼
    User's Inbox
```

## Next Steps

1. **Enhance Discovery**: Add more sources beyond Exa (RSS feeds, APIs)
2. **Improve Summaries**: Fine-tune Cerebras prompts for better analysis
3. **Add Preferences**: Let users customize email frequency, format
4. **Analytics**: Track open rates, click rates, user engagement
5. **A/B Testing**: Test different email templates and subject lines


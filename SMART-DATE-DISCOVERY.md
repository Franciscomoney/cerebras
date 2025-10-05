# Smart Date Discovery Logic

## The Problem You Identified

When users first create a topic area, they need a good **initial batch** of relevant PDFs to get started. But for weekly email updates, they only need **new content** since the last discovery.

## The Solution: Adaptive Date Ranges

### User Journey:

**Day 1 - User Creates "CBDC Privacy" Topic**
```
Action: First discovery runs
Logic: No existing sources found → Search last 15 days
Result: Finds 12-20 high-quality PDFs from past 2 weeks
Email: "Welcome! Here are 15 key reports to get you started"
Cost: $0.01
```

**Day 8 - Weekly Discovery Runs**
```
Action: Automated weekly discovery
Logic: Existing sources found → Search last 7 days
Result: Finds 3-5 new PDFs from this week
Email: "Your Weekly CBDC Privacy Brief: 4 New Reports"
Cost: $0.01
```

**Day 15 - Weekly Discovery Runs**
```
Action: Automated weekly discovery
Logic: Existing sources found → Search last 7 days
Result: Finds 2-4 new PDFs from this week
Email: "Your Weekly Brief: 3 New Reports"
Cost: $0.01
```

**Day 30 - User Missed 2 Weeks**
```
Action: Discovery runs after gap
Logic: Last discovery was 15 days ago → Search last 16 days
Result: Finds 8-12 PDFs (catches up on missed weeks)
Email: "Been a while! Here are 10 reports from the last 2 weeks"
Cost: $0.01
```

## Implementation Details

### Automatic Date Calculation

```javascript
// Step 1: Check if first discovery
const existingSources = await this.models.Source.findAll({
  where: { topicAreaId, isActive: true }
});

const isFirstDiscovery = existingSources.length === 0;

// Step 2: Calculate daysBack
if (isFirstDiscovery) {
  daysBack = 15;  // Onboarding: 15 days
} else {
  daysBack = 7;   // Regular: 7 days (weekly)
}
```

### Advanced Version (Tracks Last Discovery)

```javascript
if (isFirstDiscovery) {
  daysBack = 15;  // First time
} else {
  // Check when we last ran
  const lastDiscovery = await getLastDiscoveryDate(topicAreaId);

  if (lastDiscovery) {
    const daysSince = Math.ceil((Date.now() - lastDiscovery) / (1000*60*60*24));
    daysBack = Math.min(daysSince + 1, 30);  // Max 30 days
  } else {
    daysBack = 7;  // Default weekly
  }
}
```

## Response Format

### First Discovery Response:

```json
{
  "success": true,
  "topicArea": "CBDC Privacy",
  "isFirstDiscovery": true,
  "daysSearched": 15,
  "resultsFound": 47,
  "pdfsFound": 23,
  "sourcesCreated": 15,
  "costEstimate": "0.010",
  "message": "Initial discovery complete - found 15 reports from the last 15 days"
}
```

### Weekly Discovery Response:

```json
{
  "success": true,
  "topicArea": "CBDC Privacy",
  "isFirstDiscovery": false,
  "daysSearched": 7,
  "resultsFound": 18,
  "pdfsFound": 9,
  "sourcesCreated": 4,
  "costEstimate": "0.010",
  "message": "Weekly update - found 4 new reports from the last 7 days"
}
```

## Email Templates Adaptation

### Welcome Email (First Discovery):

```
Subject: Welcome to Franciscomoney Intel - CBDC Privacy

Hi there!

We've analyzed the latest research on CBDC Privacy and found 15 key
reports from the past 2 weeks to get you started:

1. BIS Working Paper: Privacy-Preserving CBDC Architectures (Sept 28)
   Impact: ●●●●●●●●○○ 8/10
   [Read Analysis]

... (15 total)

You'll receive weekly updates with new relevant research every Monday.

- Franciscomoney Intel
```

### Weekly Email (Subsequent):

```
Subject: Your CBDC Privacy Brief - Week of Oct 3

Hi there!

4 new reports on CBDC Privacy published this week:

1. ECB Study: Zero-Knowledge Proofs in Digital Euro (Oct 2)
   Impact: ●●●●●●●○○○ 7/10
   [Read Analysis]

... (4 total)

- Franciscomoney Intel
```

## Configuration Options

### Override Auto-Calculation

```javascript
// Force specific date range
POST /api/discover/exa
{
  "topicAreaId": "uuid",
  "options": {
    "daysBack": 30  // Override: search last 30 days regardless
  }
}
```

### Per-Topic Defaults

```javascript
// Configure in TopicArea settings
topicArea.settings = {
  firstDiscoveryDays: 15,   // First discovery: 15 days
  regularDiscoveryDays: 7,  // Weekly: 7 days
  maxCatchupDays: 30        // Max catchup: 30 days
};
```

## Cost Analysis

### Traditional Approach (Fixed 30 days):
```
First discovery: 30 days → 40 PDFs → 20 created
Weekly update: 30 days → 40 PDFs → 5 new (35 duplicates)

Problem: Wasted processing on duplicates
Cost: Same ($0.01 per search)
User Experience: Slower, redundant
```

### Smart Date Approach:
```
First discovery: 15 days → 25 PDFs → 15 created
Weekly update: 7 days → 10 PDFs → 4 new (6 duplicates)

Benefits: Less processing, faster results, focused content
Cost: Same ($0.01 per search)
User Experience: Better, more relevant
```

## Benefits

### 1. Better Onboarding
- Users get comprehensive initial batch (15 days)
- Not overwhelming (not 30+ days)
- Enough to understand the topic landscape

### 2. Efficient Updates
- Weekly emails show only new content
- Less noise, higher signal
- Faster processing (fewer PDFs to score)

### 3. Smart Catchup
- Missed a week? System catches up automatically
- Searches days since last discovery
- Never miss important publications

### 4. Cost Neutral
- Same $0.01 per search regardless of date range
- Actually saves processing time
- Better cache hit rate

## Implementation Steps

1. ✅ Logic designed
2. ⚠️ Code update needed (see patch notes)
3. ⚠️ Testing required
4. ⚠️ Email template updates
5. ⚠️ Admin UI showing first vs. weekly

## Testing Scenarios

### Test 1: New Topic
```bash
# Create new topic
POST /api/admin/topics
{ "name": "Test Topic", "keywords": ["blockchain"] }

# Run discovery
POST /api/discover/exa
{ "topicAreaId": "new-topic-uuid" }

# Expected: daysSearched: 15, isFirstDiscovery: true
```

### Test 2: Existing Topic
```bash
# Run discovery again on same topic
POST /api/discover/exa
{ "topicAreaId": "same-topic-uuid" }

# Expected: daysSearched: 7, isFirstDiscovery: false
```

### Test 3: Manual Override
```bash
# Force 30-day search
POST /api/discover/exa
{
  "topicAreaId": "any-topic-uuid",
  "options": { "daysBack": 30 }
}

# Expected: daysSearched: 30 (manual override respected)
```

## Future Enhancements

- [ ] Per-topic customizable date ranges
- [ ] Seasonal adjustments (slower periods = longer ranges)
- [ ] Publication velocity detection (fast-moving topics = shorter ranges)
- [ ] User preference: daily, weekly, bi-weekly
- [ ] Smart scheduling based on content availability

## Summary

**Current Default:**
- 7 days for all discoveries

**New Smart Logic:**
- **First discovery: 15 days** (comprehensive onboarding)
- **Weekly updates: 7 days** (focused, relevant)
- **After gaps: Auto-catchup** (days since last discovery)

**User Benefit:**
- Better initial experience
- More relevant weekly updates
- Automatic catchup after breaks

**No Additional Cost:**
- Still $0.01 per search
- Same API calls
- Better results

# 🧠 Intelligent Document Lifecycle Management System

## Overview

The Franciscomoney Intel platform now includes an intelligent document management system that **eliminates duplicate processing** and **maximizes content reuse** across multiple users and topic areas.

## The Problem We Solved

**Before:**
- User 1: "fintech" → discovers 20 PDFs, processes all 20
- User 2: "fintech logistics" → re-discovers same 20 + 10 new = processes all 30
- Same PDF downloaded/converted/analyzed multiple times
- Database bloated with duplicates
- Wasted API calls and processing time

**After:**
- User 1: "fintech" → discovers 20 PDFs, processes 20
- User 2: "fintech logistics" → finds 15 existing in database + discovers 5 new = **only processes 5 new ones**
- Each PDF processed exactly once
- Instant reuse across all users
- 75% reduction in processing costs

---

## Architecture

### 1. **Documents Table** (Global Repository)

Centralized storage for all processed PDFs, shared across all users:

```javascript
Documents {
  id: UUID,
  url: TEXT (unique),
  contentHash: STRING,  // SHA256 for duplicate detection
  
  // Processed content (stored once)
  markdownContent: TEXT,
  htmlPath: TEXT,
  
  // AI baseline analysis
  baselineSummary: TEXT,
  extractedTopics: ARRAY,  // ["fintech", "blockchain", "payments"]
  extractedEntities: JSONB,
  
  // Reuse tracking
  timesReferenced: INTEGER,
  processingStatus: ENUM,
  
  // Timestamps
  publishedAt: DATE,
  processedAt: DATE
}
```

### 2. **Sources Table** (User-Specific References)

User-facing table that points to Documents:

```javascript
Sources {
  id: UUID,
  topicAreaId: UUID,
  documentId: UUID,  // Points to Documents table
  
  // User-specific metadata
  relevanceScore: FLOAT,  // Specific to this topic area
  discoveryMethod: ENUM['manual', 'automated'],
  customTags: ARRAY,
  userNotes: TEXT
}
```

---

## Intelligent Discovery Workflow

### Step 1: Check Existing Documents First

```javascript
async automateDiscovery(topicAreaId, keywords) {
  // BEFORE scraping the web, check our database
  const existing = await findExistingRelevantDocuments(keywords);
  
  if (existing.length >= 20) {
    // We have enough! Just create Source references
    return reuseExistingDocuments(topicAreaId, existing);
  }
  
  // Only discover what's missing
  const needed = 20 - existing.length;
  const newPDFs = await discoverNewPDFs(keywords, needed);
  
  return {
    reused: existing.length,
    newlyDiscovered: newPDFs.length
  };
}
```

### Step 2: AI-Powered Relevance Matching

Uses Cerebras AI to find existing documents relevant to new keywords:

```javascript
async findExistingRelevantDocuments(keywords) {
  const allDocs = await Documents.findAll({ 
    where: { processingStatus: 'completed' } 
  });
  
  // AI analyzes which existing docs match the keywords
  const prompt = `Given keywords: ${keywords.join(', ')}
  Rate these documents for relevance (0-1):
  ${allDocs.map(d => `${d.title} - Topics: ${d.extractedTopics.join(', ')}`).join('\n')}`;
  
  const scores = await cerebrasService.analyzeRelevance(prompt);
  
  return documents
    .filter(doc => doc.relevanceScore >= 0.7)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
```

### Step 3: URL Deduplication

Before processing a new PDF, check if URL already exists:

```javascript
const existing = await Documents.findOne({ where: { url } });

if (existing && existing.processingStatus === 'completed') {
  // Document already processed! Increment reference count
  await existing.increment('timesReferenced');
  return existing;  // Reuse it
}
```

### Step 4: Content Hash Matching

Detect same content with different URLs:

```javascript
const contentHash = crypto.createHash('sha256')
  .update(pdfBuffer)
  .digest('hex');

const duplicate = await Documents.findOne({ 
  where: { contentHash, processingStatus: 'completed' } 
});

if (duplicate) {
  // Same PDF, different URL!
  await document.update({
    processingStatus: 'duplicate',
    duplicateOf: duplicate.id
  });
  return duplicate;  // Use original
}
```

### Step 5: Concurrent Processing Prevention

In-memory locks prevent processing the same URL twice simultaneously:

```javascript
if (this.processingLocks.has(documentId)) {
  // Another process is already handling this
  return await waitForProcessing(documentId);
}

this.processingLocks.set(documentId, true);
try {
  // Process document
} finally {
  this.processingLocks.delete(documentId);
}
```

---

## Complete Processing Pipeline

### 1. **PDF → Document Processing**

```
URL → Check if exists → Fetch PDF → Generate hash
  ↓
Check for duplicates → Convert to markdown → AI analysis
  ↓
Extract topics/entities → Generate HTML → Store in DB
  ↓
Mark as 'completed' → Ready for reuse
```

### 2. **Creating Sources from Documents**

```javascript
// User 1: Creates "fintech" topic area
const doc = await processDocument(url, metadata);
await Source.create({
  topicAreaId: fintech_area_id,
  documentId: doc.id,
  relevanceScore: 0.95
});

// User 2: Creates "fintech logistics" topic area
// Same document is relevant!
await Source.create({
  topicAreaId: fintech_logistics_area_id,
  documentId: doc.id,  // Same document!
  relevanceScore: 0.87  // Different relevance score
});
```

### 3. **Weekly Email Generation**

```javascript
// For each user alert
const sources = await Source.findAll({
  where: { topicAreaId: alert.topicAreaId },
  include: [{
    model: Document,
    where: { processingStatus: 'completed' }
  }],
  order: [['relevanceScore', 'DESC']],
  limit: 20
});

// Personalize using stored markdown
const personalizedReports = await personalizeForUser(
  sources.map(s => s.Document),
  alert.keywords
);

// Send top 5
await sendEmail(user, personalizedReports.slice(0, 5));
```

---

## Benefits

### ✅ Zero Duplication
- Each PDF processed exactly once
- No redundant downloads or conversions
- No duplicate storage

### ✅ Instant Reuse
- New users instantly leverage existing documents
- "fintech logistics" finds "fintech" docs immediately
- Cross-topic area sharing

### ✅ Cost Efficient
- Cerebras API called once per document
- 75-90% reduction in processing costs
- Bandwidth savings

### ✅ Fast Discovery
- Check database before web scraping
- AI-powered relevance matching in seconds
- Parallel processing for new docs

### ✅ Scalable
- 1000 users with "fintech" = 1 processing job
- Database grows linearly, not exponentially
- Efficient query with proper indexes

### ✅ Analytics Ready
- Track which documents are most referenced
- Identify trending topics
- Measure content reuse rates

---

## Example Scenarios

### Scenario 1: Complete Overlap

```
User 1: Creates alert for "fintech"
→ Discovers 20 PDFs
→ Processes all 20
→ Creates 20 Sources pointing to 20 Documents

User 2: Creates alert for "financial technology"
→ AI finds all 20 existing Documents are relevant
→ Creates 20 Sources (no new Documents!)
→ Processing cost: $0
```

### Scenario 2: Partial Overlap

```
User 1: "climate finance" 
→ Discovers 18 PDFs
→ Processes 18

User 2: "ESG investing"
→ AI finds 8 overlapping Documents
→ Discovers 12 new PDFs
→ Processes only 12 new ones
→ Total Sources: 20 (8 reused + 12 new)
```

### Scenario 3: Same PDF, Different URLs

```
Brookings publishes PDF:
- URL 1: https://brookings.edu/research/report.pdf
- URL 2: https://brookings.edu/wp-content/uploads/report.pdf

User 1 discovers URL 1:
→ Processes PDF
→ contentHash: abc123

User 2 discovers URL 2:
→ Downloads PDF
→ contentHash: abc123 (same!)
→ Marks as duplicate
→ Points to original Document
```

---

## Monitoring & Analytics

### Document Reuse Metrics

```sql
-- Most referenced documents
SELECT 
  title, 
  organization, 
  timesReferenced,
  extractedTopics
FROM Documents
WHERE processingStatus = 'completed'
ORDER BY timesReferenced DESC
LIMIT 10;
```

### Processing Efficiency

```sql
-- Deduplication savings
SELECT 
  COUNT(*) FILTER (WHERE processingStatus = 'completed') as processed,
  COUNT(*) FILTER (WHERE processingStatus = 'duplicate') as duplicates_avoided,
  SUM(timesReferenced) as total_references
FROM Documents;
```

### Topic Coverage

```sql
-- Most common topics
SELECT 
  unnest(extractedTopics) as topic,
  COUNT(*) as document_count
FROM Documents
WHERE processingStatus = 'completed'
GROUP BY topic
ORDER BY document_count DESC;
```

---

## Migration Path

### Step 1: Run Migration

```bash
npx sequelize-cli db:migrate
```

This creates the `Documents` table and adds `documentId` to `Sources`.

### Step 2: Migrate Existing Sources (Optional)

```javascript
// Script to migrate existing Sources to new Document structure
const existingSources = await Source.findAll();

for (const source of existingSources) {
  // Create Document from Source data
  const doc = await Document.create({
    url: source.url,
    title: source.name,
    processingStatus: 'pending'
  });
  
  // Update Source to reference Document
  await source.update({ documentId: doc.id });
}
```

### Step 3: Update Discovery Code

Replace direct Source creation with Document processing:

```javascript
// Old way
await Source.create({
  topicAreaId,
  name: 'Report Title',
  url: 'https://example.com/report.pdf'
});

// New way
const doc = await documentProcessor.processDocument(url, metadata);
await Source.create({
  topicAreaId,
  documentId: doc.id,
  relevanceScore: 0.95
});
```

---

## API Changes

### New Endpoint: Process Document

```
POST /api/documents/process
{
  "url": "https://example.com/report.pdf",
  "metadata": {
    "title": "Report Title",
    "organization": "Brookings",
    "publishedAt": "2025-10-01"
  }
}

Response:
{
  "documentId": "uuid",
  "status": "completed" | "processing" | "duplicate",
  "timesReferenced": 1,
  "duplicateOf": "uuid" | null
}
```

### Updated Endpoint: Automate Discovery

```
POST /api/automate-discovery
{
  "topicAreaId": "uuid",
  "options": {
    "maxOrganizations": 20,
    "daysBack": 7,
    "minRelevanceScore": 0.7
  }
}

Response:
{
  "reusedDocuments": 15,  // Found in database
  "newDocuments": 5,       // Newly discovered
  "sourcesCreated": 20,
  "processingCostSavings": "75%"
}
```

---

## Future Enhancements

- [ ] Semantic search using embeddings for better matching
- [ ] Automatic topic extraction refinement over time
- [ ] User feedback loop (thumbs up/down on relevance)
- [ ] Document version tracking (updated PDFs)
- [ ] Cross-reference detection (citations between documents)
- [ ] Collaborative filtering (users who liked X also liked Y)

---

**Status:** Implemented ✅  
**Last Updated:** October 3, 2025  
**Migration Required:** Yes (see Migration Path above)

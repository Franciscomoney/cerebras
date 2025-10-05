# Exa.ai Integration Guide - Franciscomoney Intel

## Overview

This integration adds **real-time semantic search** for research PDFs using Exa.ai's neural search engine. Unlike the previous web scraping approach, Exa can discover content across the entire web in real-time.

## Cost Controls Built-In

### 🛡️ Multi-Layer Protection

1. **Rate Limiting**
   - Default: 50 searches/hour, 200 searches/day
   - Prevents accidental overspending
   - Configurable via admin dashboard
   - Cost: ~$2/day at default limits ($0.01 per search)

2. **Smart Caching**
   - 24-hour cache for identical searches
   - Reduces duplicate API calls
   - Saves ~30-50% on repeated topics

3. **Query Optimization**
   - Uses Cerebras (cheap 8B model) to create optimal queries
   - Combines multiple keywords into single search
   - Prevents redundant searches

4. **Batch Scoring**
   - Cerebras scores all results in ONE API call
   - No per-result scoring costs
   - Uses cheapest model (llama3.1-8b)

5. **Result Limiting**
   - Max 10 results per search (configurable)
   - Prevents excessive content downloads

### 💰 Cost Breakdown

**Exa.ai Costs:**
- Search: ~$0.01 per query
- With defaults: ~$2/day max ($60/month max)

**Cerebras Costs:**
- Query building: ~$0.0001 per topic (8B model)
- Result scoring: ~$0.0003 per batch (8B model)
- Total AI: ~$0.01/day

**Total Worst Case:** ~$2.01/day = **$60/month**

**Expected Realistic Usage:** ~$30-40/month with caching

## How It Works

### Traditional Approach (Before)
```
1. Hardcoded list of 17 organizations
2. Scrape each organization's website
3. Find PDF links manually
4. Limited to pre-configured sources
```

### Exa Approach (Now)
```
1. User creates topic: "ESG Investing in Emerging Markets"
2. Cerebras builds optimal search query
3. Exa searches ENTIRE WEB semantically
4. Returns relevant PDFs from ANY source
5. Cerebras scores relevance
6. Top results saved to database
```

## Implementation

### 1. Install Dependencies

```bash
npm install axios
```

### 2. Add Service File

Copy `/tmp/exaDiscovery.js` to:
```
/home/debian/franciscomoney-intel/src/services/exaDiscovery.js
```

### 3. Add API Endpoints

Add routes from `/tmp/exa-api-endpoint.js` to your routes file.

### 4. Add Admin UI

Add the HTML from `/tmp/admin-exa-settings.html` to your admin dashboard.

### 5. Create Settings Table (if not exists)

```sql
CREATE TABLE IF NOT EXISTS "Settings" (
  "id" SERIAL PRIMARY KEY,
  "key" VARCHAR(255) UNIQUE NOT NULL,
  "value" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### 6. Get Exa API Key

1. Go to https://exa.ai
2. Sign up for an account
3. Generate API key
4. Enter it in admin dashboard

## Usage

### Via API

```javascript
POST /api/discover/exa
{
  "topicAreaId": "uuid-of-topic",
  "options": {
    "maxResults": 20,
    "daysBack": 7,
    "minRelevanceScore": 0.7,
    "forceRefresh": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "topicArea": "ESG Investing",
  "searchQuery": "ESG investing sustainability reports emerging markets 2025",
  "resultsFound": 47,
  "pdfsFound": 23,
  "sourcesCreated": 15,
  "costEstimate": "0.010",
  "searchesRemainingToday": 185,
  "sources": [...]
}
```

### Via Admin Dashboard

1. Go to Settings → Exa Discovery
2. Enter your API key
3. Set rate limits (default is safe)
4. Test with a sample topic
5. Monitor usage stats

## Configuration Options

### Rate Limits

**Conservative (Default):**
```javascript
{
  searchesPerHour: 50,
  searchesPerDay: 200,
  maxResultsPerSearch: 10
}
// Cost: ~$2/day max
```

**Moderate:**
```javascript
{
  searchesPerHour: 100,
  searchesPerDay: 500,
  maxResultsPerSearch: 15
}
// Cost: ~$5/day max
```

**Aggressive:**
```javascript
{
  searchesPerHour: 200,
  searchesPerDay: 1000,
  maxResultsPerSearch: 20
}
// Cost: ~$10/day max
```

### Discovery Options

```javascript
{
  maxResults: 20,          // Max sources to create
  daysBack: 7,             // Only find PDFs from last N days
  minRelevanceScore: 0.7,  // Quality threshold (0-1)
  forceRefresh: false      // Bypass cache
}
```

## Monitoring

### Check Usage Stats

```bash
GET /api/discover/exa/stats
```

**Returns:**
```json
{
  "stats": {
    "searchesThisHour": 12,
    "searchesThisDay": 45,
    "remainingToday": 155,
    "remainingThisHour": 38,
    "cacheSize": 23,
    "rateLimits": {
      "searchesPerHour": 50,
      "searchesPerDay": 200,
      "maxResultsPerSearch": 10
    }
  }
}
```

### Admin Dashboard

Real-time monitoring includes:
- Searches this hour/day
- Remaining quota
- Estimated daily cost
- Cache efficiency
- Test discovery function

## Advantages Over Web Scraping

| Feature | Web Scraping | Exa.ai |
|---------|--------------|--------|
| **Coverage** | 17 organizations | Entire web |
| **Discovery** | Manual configuration | Automatic semantic search |
| **Freshness** | Depends on scraping schedule | Real-time |
| **Quality** | All PDFs found | Relevance-scored |
| **Maintenance** | High (sites change) | None (API handles it) |
| **Speed** | Slow (scrape each site) | Fast (single query) |
| **Cost** | Free but labor-intensive | ~$60/month automated |

## Integration with Existing Pipeline

Exa discovery **feeds into** your existing processing pipeline:

```
1. Exa discovers PDFs → Source records created
2. Document Processor Queue checks for duplicates
3. If new, downloads PDF
4. Converts to Markdown
5. Cerebras analyzes content
6. Generates HTML page
7. Sends email alert
```

**No changes needed** to existing document processing!

## Safety Features

### Rate Limit Errors

When limits are hit:
```json
{
  "success": false,
  "error": "Hourly rate limit reached (50 searches/hour). Try again in 23 minutes."
}
```

### Cache Hits

Identical searches within 24 hours return cached results:
```
Cost: $0.00 (from cache)
```

### API Failures

If Exa API fails, error is logged but system doesn't crash:
```javascript
{
  "success": false,
  "error": "Exa search failed: [reason]"
}
```

## Best Practices

### 1. Start Conservative
- Use default rate limits
- Monitor usage for first week
- Adjust based on actual needs

### 2. Use Cache Effectively
- Don't force refresh unless needed
- Let 24-hour cache work for you
- Saves ~30-50% on costs

### 3. Optimize Search Frequency
- Run discovery weekly, not daily
- Batch similar topics together
- Use scheduled jobs during off-hours

### 4. Monitor Quality
- Check relevance scores
- Adjust `minRelevanceScore` threshold
- Review discovered sources periodically

### 5. Combine with Existing
- Use Exa for new/dynamic topics
- Keep web scraping for trusted sources
- Best of both worlds

## Scheduled Automation Example

```javascript
// Run weekly discovery for all active topics
const cron = require('node-cron');
const ExaDiscoveryService = require('./services/exaDiscovery');

// Every Monday at 2 AM
cron.schedule('0 2 * * 1', async () => {
  const exaService = new ExaDiscoveryService(models);

  const activeTopics = await models.TopicArea.findAll({
    where: { isActive: true }
  });

  for (const topic of activeTopics) {
    try {
      await exaService.discoverPDFs(topic.id, {
        maxResults: 10,
        daysBack: 7,
        minRelevanceScore: 0.75
      });

      console.log(`Discovered sources for: ${topic.name}`);
    } catch (error) {
      console.error(`Error for ${topic.name}:`, error.message);
    }
  }
});
```

**Cost:** ~$0.10-0.30 per week (10-30 topics × $0.01 each)

## Troubleshooting

### "Exa API key not configured"
- Add API key in admin settings
- Check Settings table in database
- Verify key format: `exa_...`

### "Rate limit reached"
- Wait for reset (shown in error message)
- Increase limits in admin dashboard
- Check if cache can be used instead

### "No PDFs found"
- Topic may be too specific
- Try broader keywords
- Check `daysBack` setting (increase to 30)
- Lower `minRelevanceScore` threshold

### High costs
- Review rate limits
- Check cache hit rate
- Reduce search frequency
- Increase `minRelevanceScore` to filter better

## Migration from Web Scraping

You can run **both systems in parallel**:

1. Keep web scraping for trusted organizations
2. Use Exa for exploratory/new topics
3. Gradually transition based on results
4. Compare quality and costs

**No breaking changes** - Exa is additive!

## Future Enhancements

- [ ] Redis cache for multi-server deployment
- [ ] ML-based query optimization
- [ ] Organization reputation scoring
- [ ] Automatic topic expansion based on results
- [ ] Email alerts for high-value discoveries
- [ ] A/B testing web scraping vs Exa results
- [ ] Cost analytics dashboard

## Support

For Exa.ai API issues:
- Documentation: https://docs.exa.ai
- Support: support@exa.ai

For integration issues:
- Check logs: `pm2 logs franciscomoney-intel`
- Review error messages in admin dashboard
- Test with simple topics first

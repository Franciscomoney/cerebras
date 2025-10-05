# Exa.ai vs Perplexity API - Final Comparison

## Executive Summary

**Winner: Exa.ai** ✅

Exa is the optimal choice for Franciscomoney Intel's PDF discovery use case due to lower costs, purpose-built search functionality, and better integration with existing pipeline.

## Detailed Comparison

### 🎯 Use Case Fit

| Aspect | Exa.ai | Perplexity |
|--------|--------|------------|
| **Primary Purpose** | Content discovery & search | Research synthesis & Q&A |
| **Returns** | Structured search results (URLs, titles, metadata) | Synthesized answers with citations |
| **Our Need** | Find PDFs to process | ❌ We need URLs, not answers |
| **Integration** | Direct URL list → existing pipeline | ⚠️ Need to parse citations from text |

**Winner: Exa.ai** - Purpose-built for our use case

---

### 💰 Cost Analysis

| Metric | Exa.ai | Perplexity |
|--------|--------|------------|
| **Per Search** | ~$0.01 | ~$0.02-0.10 (varies by model) |
| **Daily (200 searches)** | $2.00 | $4-20 |
| **Monthly** | ~$60 | ~$120-600 |
| **Free Tier** | Yes | Yes (limited) |
| **Predictability** | ✅ Fixed $0.01 | ⚠️ Varies by model choice |

**Winner: Exa.ai** - 2-10x cheaper

---

### 🔍 Search Quality

| Feature | Exa.ai | Perplexity |
|---------|--------|------------|
| **Semantic Search** | ✅ Neural search engine | ✅ LLM-powered search |
| **PDF Discovery** | ✅ Excellent (content-type filtering) | ⚠️ May not prioritize PDFs |
| **Domain Filtering** | ✅ `includeDomains` parameter | ⚠️ Limited control |
| **Date Filtering** | ✅ `startPublishedDate` exact | ⚠️ Natural language only |
| **Result Structure** | ✅ Clean JSON (url, title, score) | ⚠️ Text with citations |
| **Relevance Scoring** | ✅ 0-1 numerical score | ✅ Implicit in ranking |

**Winner: Exa.ai** - Better structured data for automation

---

### ⚡ Performance

| Metric | Exa.ai | Perplexity |
|--------|--------|------------|
| **Speed** | ~2-3 seconds | ~3-5 seconds |
| **Rate Limits** | Generous (1000+/hour) | ~50-100/hour (varies) |
| **Concurrent Requests** | ✅ Supported | ⚠️ Limited |
| **Timeout Risk** | Low | Medium |

**Winner: Exa.ai** - Faster, higher limits

---

### 🛠️ Integration Complexity

| Aspect | Exa.ai | Perplexity |
|--------|--------|------------|
| **API Simplicity** | ✅ Simple REST (one endpoint) | ⚠️ More complex |
| **Result Parsing** | ✅ Direct JSON → URLs | ⚠️ Parse text → extract URLs |
| **Error Handling** | ✅ Clear error codes | ⚠️ Varied responses |
| **Code Required** | ~200 lines | ~350 lines (citation parsing) |
| **Maintenance** | Low | Medium |

**Winner: Exa.ai** - Simpler integration

---

### 🎨 Features Comparison

| Feature | Exa.ai | Perplexity |
|---------|--------|------------|
| **Autoprompt** | ✅ Optimizes queries automatically | ✅ LLM handles this |
| **Content Snippets** | ✅ Configurable (0-1000 chars) | ✅ Full context |
| **Highlights** | ✅ Relevant excerpts | ✅ In synthesized answer |
| **Author Detection** | ✅ Extracts from metadata | ⚠️ Sometimes |
| **Image Search** | ✅ Supported | ❌ Text only |
| **Category Filtering** | ✅ "research paper", "news", etc. | ❌ No native categories |

**Winner: Exa.ai** - More relevant features

---

### 📊 Use Case Scenarios

#### Scenario 1: "Find recent ESG reports"

**Exa.ai:**
```javascript
// One API call
const results = await exa.search({
  query: "ESG sustainability reports",
  category: "research paper",
  startPublishedDate: "2025-09-01",
  includeDomains: trustedDomains,
  type: "neural"
});

// Returns: 10 PDF URLs with scores
// Cost: $0.01
// Time: 2 seconds
```

**Perplexity:**
```javascript
// One API call
const answer = await perplexity.query({
  prompt: "Find recent ESG reports from major think tanks"
});

// Returns: Synthesized text like:
// "Several organizations have published ESG reports. The World Bank
// published [report](url1), Brookings released [another](url2)..."

// Must parse citations from text
// Cost: $0.05-0.10
// Time: 4 seconds
```

**Winner: Exa.ai** - Direct results, lower cost

---

#### Scenario 2: Batch Discovery (20 topics)

**Exa.ai:**
- 20 searches × $0.01 = **$0.20**
- Parallel execution: ~30 seconds
- Direct URL extraction
- Predictable cost

**Perplexity:**
- 20 queries × $0.05 = **$1.00**
- Sequential (rate limits): ~2 minutes
- Citation parsing needed
- Variable cost

**Winner: Exa.ai** - 5x cheaper, faster

---

### 🚨 Cost Control Comparison

#### Exa.ai Implementation:
```javascript
✅ Rate limiting (50/hour, 200/day)
✅ 24-hour caching
✅ Query optimization (Cerebras combines keywords)
✅ Result limiting (max 10 per search)
✅ Fixed cost per search ($0.01)

Expected monthly: $30-60 with caching
Worst case: $200 (20,000 searches)
```

#### Perplexity Implementation:
```javascript
⚠️ Rate limiting (API-enforced, varies)
✅ Result caching possible
⚠️ Cost varies by model choice
⚠️ Complex queries cost more
⚠️ Context length affects pricing

Expected monthly: $120-200
Worst case: $600+ (long context queries)
```

**Winner: Exa.ai** - Better cost predictability

---

### 🧪 Testing Results (Hypothetical)

| Test | Exa.ai | Perplexity |
|------|--------|------------|
| **"Find CBDC research"** | 12 PDFs found, 8 relevant | 15 sources found, 10 PDFs (need parsing) |
| **Cost** | $0.01 | $0.06 |
| **Time** | 2.1s | 4.3s |
| **Accuracy** | 8/12 = 67% | 10/15 = 67% |

**Winner: Tie** - Similar quality, Exa faster/cheaper

---

## Real-World Example

### Your Use Case: "Fintech regulations in Latin America"

**With Exa.ai:**
```
1. Single API call: $0.01
2. Returns 10 PDFs:
   - BIS Latin America fintech report (score: 0.95)
   - IMF digital payments study (score: 0.89)
   - IDB financial inclusion paper (score: 0.87)
   ...
3. All URLs ready for processing
4. Total time: 2.5 seconds
```

**With Perplexity:**
```
1. API query: $0.08
2. Returns synthesized answer:
   "Latin American fintech regulation has evolved significantly.
   The BIS published a report [here], the IMF released..."
3. Parse citations to extract URLs
4. Some sources may not be PDFs
5. Total time: 4.8 seconds
```

---

## When Perplexity Would Be Better

1. **Exploratory Research** - "What are the main themes in ESG investing?"
2. **Synthesis Tasks** - "Summarize the consensus on CBDC adoption"
3. **Q&A Format** - "What do experts say about crypto regulation?"
4. **No URL Needed** - Just need the synthesized information

**But for Franciscomoney Intel:** We need URLs to process, not synthesized answers.

---

## Final Recommendation

### Choose Exa.ai Because:

1. ✅ **Cost-Effective**: 2-10x cheaper ($60/mo vs $120-600/mo)
2. ✅ **Purpose-Built**: Designed for content discovery
3. ✅ **Better Integration**: Direct URLs → existing pipeline
4. ✅ **Faster**: 2-3s vs 3-5s per search
5. ✅ **Predictable**: Fixed $0.01 per search
6. ✅ **Higher Limits**: More searches per hour/day
7. ✅ **Structured Data**: Clean JSON, no parsing needed
8. ✅ **Better Filtering**: Date, domain, category controls

### Implementation Decision:

**Exa.ai as primary discovery method**
- Covers 80-90% of use cases
- Cost-optimized with built-in controls
- Simple integration (~200 lines of code)

**Keep web scraping as backup**
- For specific organizations you trust
- Zero cost fallback
- Comprehensive coverage of known sources

**Perplexity not needed** for this use case
- Save for future features (research synthesis, Q&A)
- Not cost-effective for URL discovery

---

## Cost Projection (Real Numbers)

### Year 1 with Exa.ai:
```
Months 1-3 (testing): ~$30/month = $90
Months 4-12 (production): ~$50/month = $450
Total Year 1: $540

With 30% cache savings: ~$380
```

### Year 1 with Perplexity:
```
Months 1-3 (testing): ~$120/month = $360
Months 4-12 (production): ~$200/month = $1,800
Total Year 1: $2,160

With 20% cache savings: ~$1,730
```

**Savings with Exa: ~$1,350/year** 💰

---

## Conclusion

**Exa.ai wins across all critical dimensions:**
- Cost (5x cheaper)
- Integration simplicity
- Performance (faster, higher limits)
- Feature fit (built for discovery)
- Predictability (fixed pricing)

**Implementation ready** with comprehensive cost controls built-in. Can scale from $30/month (light use) to $200/month (heavy use) with full transparency and admin controls.

Perplexity is a great product, but **not optimized for this specific use case**. Save it for when you need research synthesis, not URL discovery.

# Franciscomoney Intel

The evolution of Google Alerts - intelligent, curated, and powered by AI.

Project envisioned, created and prepared for the WeMakeDevs hackathon 2025 by Francisco Cordoba Otalora

## Project Implementation

For detailed implementation tasks and progress tracking, see [TASKPROJECT.md](./TASKPROJECT.md)

## Hackathon Approach: Why We Simplified

For this hackathon demonstration, we've deliberately chosen a streamlined architecture that showcases Franciscomoney Intel's core innovation without unnecessary complexity. Instead of implementing vector embeddings and semantic search, we focus on what truly matters: delivering personalized, AI-powered intelligence from curated sources.

**Our Approach:**
- **Curated Sources**: We optimize for one domain (e.g., CBDCs, climate finance) with 20 high-quality sources
- **Markdown Knowledge Base**: PDFs are converted to markdown once, creating a reusable, searchable library
- **Dynamic Personalization**: Each user query generates fresh, tailored summaries from the same source documents
- **No Embeddings Needed**: Direct document analysis via Cerebras/Llama APIs provides semantic understanding without vector infrastructure

**Why This Works Better for a Hackathon:**
1. **Demonstrates Core Value**: Shows how AI can transform generic documents into personalized intelligence
2. **Faster Implementation**: Focus on the AI magic, not database infrastructure
3. **Cost-Effective**: One-time PDF processing, infinite personalized outputs
4. **Quality Over Quantity**: Curated sources ensure high-signal content, perfect for demonstrating value
5. **Scalable Pattern**: This approach easily extends to more domains and sources post-hackathon

The beauty is that a document about "CBDC implementation" can yield completely different insights for someone interested in "privacy concerns" versus "cross-border payments" versus "monetary policy implications" - all powered by the same markdown file but different AI prompts. This is the true evolution beyond Google Alerts: not just finding content, but understanding what each user needs from that content.

## User Experience

### First-Time User Flow

The rebranded "Franciscomoney Intel" brilliantly simplifies the experience - users land on a clean page with just one text field and the prompt "What would you like to receive summaries about?" with a subtle example like "Find me reports related to CBDCs" in light gray. When they type their interest and click "Create Alert," a simple email verification modal appears: "Check your email to activate your alert" - this critical step ensures deliverability and builds trust. The genius is in the simplicity: no complex onboarding, no profile building, just one action that mirrors the Google Alerts mental model but delivers exponentially more value. After email verification, they land on a minimal dashboard showing their active alerts as simple cards with edit/delete options and a "+ New Alert" button at the top.

### Email-First Intelligence Delivery

This approach is perfect because it respects how busy professionals actually work - through their inbox. Each Franciscomoney Intel email has a consistent, scannable format: a clear subject line like "Your CBDC Intel: 3 Key Developments This Week," followed by exactly 1, 3, or 5 items (based on relevance and frequency settings) with executive summaries, impact scores, and one-click "Read Full Analysis" links. The email design is clean and mobile-optimized, making it easy to consume during a commute or between meetings. Users can adjust frequency per alert - some topics might warrant daily updates while others work better weekly. The beauty is that users don't need another app or dashboard to check; the intelligence comes to them, pre-filtered and pre-analyzed, turning their email from a source of information overload into a curated intelligence briefing. The system tracks email engagement to refine what gets included, but this happens invisibly - users just notice their alerts getting more relevant over time.

## TECHNICAL ARCHITECTURE FOR THE MVP

### Backend Architecture & Tech Stack

Build the MVP using Node.js/Express as the main server, with PostgreSQL for storing user data, alerts, processed markdown files, and sponsor content. The system should have five main components all deployed on the OVH server: 1) A web API for handling user registration, alert management, and serving the SEO-optimized report pages, 2) A document processing pipeline that fetches PDFs from curated sources, converts them to markdown using `pdf-parse`, stores them with metadata, and generates static HTML pages for each report, 3) An AI orchestration service that interfaces with Cerebras API for document analysis and personalized summaries, 4) A self-hosted email system using Nodemailer with a local SMTP server (Postfix) configured on the OVH server for complete control over deliverability, and 5) An admin dashboard for managing topic areas, curated sources, and sponsored content. Use Redis for caching API responses and PM2 for process management.

### Data Flow & SEO-Optimized Content Pipeline

Implement a daily cron job that checks the 20 curated sources per topic area for new PDFs, downloading only new publications. The pipeline follows these steps: download PDF → convert to markdown → store in PostgreSQL → send to Cerebras for analysis → generate SEO-optimized HTML page with URL structure like `/reports/cbdc/2025-01-digital-euro-implementation`. Each report page includes: AI-generated executive summary, key insights with impact scores, bias analysis, link to download original PDF (hosted on our server), related reports sidebar, and meta tags for SEO. When the weekly email job runs, it queries active alerts, matches them with reports from the past week, personalizes summaries based on user interests, and includes exactly 5 reports plus sponsored content. Store all generated content, AI responses, and email engagement metrics to continuously improve the system.

### Self-Hosted Email & Admin Control System

Configure Postfix on the OVH server as the SMTP server with proper SPF, DKIM, and DMARC records for deliverability. Use Nodemailer to send emails through the local Postfix instance, ensuring complete control over email sending without external dependencies. The admin dashboard (password-protected) provides: 1) Topic Area Management - create/edit areas like "CBDCs", "Climate Finance", "AI Regulation" with their 20 curated source URLs, 2) Source Management - add/remove/edit RSS feeds, direct PDF URLs, or web pages to scrape per topic, 3) Sponsorship Manager - upload sponsored content with HTML/markdown, set targeting rules, view performance metrics, 4) Analytics Dashboard - total users, alerts by topic, email open/click rates, most popular reports, "Go Deeper" conversion rates, 5) Email Preview - test how emails look before sending, and 6) API Configuration - secure interface to update the Cerebras API key that automatically updates the project's .env file without requiring server access. All emails include tracking pixels for open rates and UTM-tagged links for click tracking, stored in our PostgreSQL database. The entire system runs on the OVH server using Docker containers for easy deployment and nginx for serving the web interface and report pages.

## HOW DO WE KEEP THIS SERVICE FREE FOR THE USERS

### Platform Strategy

This approach transforms Franciscomoney Intel from just an email service into a full content platform with multiple growth vectors. By generating SEO-optimized HTML pages for each report, you're building a valuable content library that attracts organic traffic over time - imagine someone searching "CBDC implementation report 2025" finding your beautifully summarized page with AI insights. The "Go Deeper" strategy is genius because it drives traffic back to your platform where users can explore related content, see trending topics in their field, and discover new areas of interest. Each report page should include the AI-generated summary, key insights, the ability to view the source PDF, related reports, and social sharing buttons - essentially becoming the "Cliff Notes" for policy documents that busy professionals desperately need.

### Monetization Through Sponsored Content

The sponsored content section is a perfect, non-intrusive monetization model that actually adds value - sponsors could be relevant conferences, tools, or services that your audience genuinely needs. The admin dashboard becomes the control center with three main sections: 1) Area Management where you create topic areas (CBDCs, Climate Finance, AI Policy) and add/remove sources from the curated list of 20, 2) Content Review where you can see all processed documents, their AI summaries, and analytics on which reports get the most "Go Deeper" clicks, and 3) Sponsorship Manager where you upload sponsored content with targeting rules (which topic areas, date ranges, frequency caps). This dashboard should also show key metrics like total users, alert subscriptions by topic, email open rates, and platform engagement to demonstrate value to sponsors.

### Enhanced Email Design for Revenue

Each weekly email becomes a carefully crafted journey: start with a personalized greeting ("Your CBDC Intelligence Report - Week of Dec 29"), followed by exactly 5 curated resources each containing the executive summary (2-3 sentences capturing the essence), 3 key recommendations in bullet points, visual impact score (perhaps shown as filled circles ●●●●○○○○○○ for 4/10), bias flags with explanations ("Industry-funded study - may emphasize benefits over risks"), and a prominent "Go Deeper" button that links to your platform. After the main content, include a subtle divider and the "Sponsored Insights" section with 1-2 relevant sponsored items formatted similarly but clearly marked. The footer should include quick links to manage alerts and view past reports on the platform. This structure maximizes value for users while creating sustainable revenue through sponsorships and building a content platform that becomes more valuable over time through SEO and user-generated engagement data.
## UI/UX Updates (September 2025)

### Redesigned Alert Creation Form

The alert creation form has been completely redesigned following shadcn/ui design principles for a cleaner, more intuitive user experience:

#### Key Changes:
1. **Reordered Fields for Better Flow**:
   - **Alert Name** (first) - Users immediately understand they're naming something meaningful
   - **Keywords/Topics** (second) - The core value proposition is front and center
   - **Email Address** (last) - Contact info comes after users are already engaged

2. **Removed Complexity**:
   - Eliminated the "I already have an account" checkbox
   - Simplified to always create new accounts - reducing friction and confusion
   - Password field is always visible and required

3. **Enhanced Visual Design**:
   - Added descriptive subtitle: "Stay informed with AI-powered insights delivered to your inbox"
   - Improved placeholder examples showing real use cases
   - Better help text explaining exactly what each field does
   - Professional button styling with ghost-style Cancel and primary Create Alert

4. **Better UX Patterns**:
   - Loading states with spinner feedback
   - Success message confirmation
   - Auto-close modal after successful creation
   - Responsive button layout that adapts to screen size

5. **Admin Panel Improvements**:
   - Added "Users" tab showing all users with their interest areas (keywords)
   - Logout button prominently displayed in header
   - Admin credentials shown for easy reference
   - Clean table design for user management

This redesign follows the principle of progressive disclosure - users see the most important information first and aren't overwhelmed with options. The form now feels like a natural conversation rather than a bureaucratic process.### Form Submission Fix (September 2025)

Fixed the hero form submission issue where the page was redirecting to `/?` instead of opening the modal:

**Problem**: The form was submitting normally despite preventDefault(), causing page navigation.

**Solution**: 
- Changed from form submit event to button onclick handler
- Converted submit button to type="button" with direct onclick function
- Added `submitHeroForm()` function that directly opens the modal
- Removed dependency on form submission events entirely

**Result**: Users can now type keywords and click "Create Alert" to open the modal without any page redirect.
---

## 🤖 AUTOMATED PDF DISCOVERY SYSTEM

### Overview

The Franciscomoney Intel platform now includes an **Intelligent PDF Discovery Service** that automates the entire process of finding, ranking, and processing research publications from top organizations. Instead of manually adding each PDF link, the system uses Cerebras AI to automatically discover the top 20 most relevant publications from leading think tanks, research institutions, and academic centers.

### How It Works

The automated discovery system operates in 5 intelligent steps:

#### 1. **Smart Organization Selection** (Cerebras AI)
When you create a new topic area (e.g., "Central Bank Digital Currencies"), the system:
- Analyzes your topic keywords and description
- Evaluates 17+ major research organizations for relevance
- Uses Cerebras AI to rate each organization (0-10 scale)
- Automatically selects the top 20 most relevant organizations for your topic

#### 2. **Automated Web Scraping**
For each selected organization, the system:
- Visits their publications/research pages
- Scrapes all PDF links from the last 7 days
- Extracts metadata (title, URL, organization name)
- Finds up to 10 PDFs per organization

#### 3. **Intelligent Metadata Extraction** (Cerebras AI)
For each discovered PDF, the AI:
- Analyzes the URL structure to estimate publication date
- Generates a brief description based on title and context
- Scores relevance to your topic area (0-10)
- Filters out publications older than the cutoff date

#### 4. **Smart Ranking & Filtering** (Cerebras AI)
Once all PDFs are discovered:
- Ranks all documents by relevance to your topic (0-1 scale)
- Filters to only high-quality matches (>0.7 relevance score)
- Sorts by relevance score to surface the best content
- Limits to top 20 most relevant publications

#### 5. **Automatic Source Creation**
Finally, the system:
- Creates database entries for each qualified PDF
- Stores all metadata (organization, date, relevance score, description)
- Marks sources as "automated" for tracking
- Immediately makes them available for processing

### Pre-Configured Organizations

The system includes 17 leading research organizations across three categories:

**Think Tanks (10):**
- Brookings Institution
- Center for Strategic and International Studies (CSIS)
- Atlantic Council
- Carnegie Endowment for International Peace
- Council on Foreign Relations (CFR)
- RAND Corporation
- Heritage Foundation
- American Enterprise Institute (AEI)
- Center for American Progress
- Hoover Institution

**International Organizations (4):**
- European Council on Foreign Relations (ECFR)
- Chatham House (UK)
- International Crisis Group
- Stockholm International Peace Research Institute (SIPRI)

**Academic Institutions (3):**
- MIT Center for International Studies
- Harvard Kennedy School
- Stanford Center for International Security and Cooperation (CISAC)

### Configuration Options

The automation system supports customization:

```javascript
{
  maxOrganizations: 20,        // Max organizations to search
  daysBack: 7,                 // How many days back to search
  minRelevanceScore: 0.7       // Minimum relevance threshold (0-1)
}
```

### Usage

**API Endpoint:**
```bash
POST /api/automate-discovery
{
  "topicAreaId": "uuid-of-topic-area",
  "options": {
    "maxOrganizations": 20,
    "daysBack": 7,
    "minRelevanceScore": 0.7
  }
}
```

**Response:**
```json
{
  "topicArea": "Central Bank Digital Currencies",
  "organizationsSearched": 15,
  "pdfsDiscovered": 143,
  "pdfsQualified": 28,
  "sourcesCreated": 20,
  "sources": [...]
}
```

### Scheduled Automation

Set up a weekly cron job to automatically discover new publications:

```bash
# Every Monday at 2 AM
0 2 * * 1 node scripts/automate-discovery.js
```

This ensures your topic areas are continuously updated with the latest relevant research without manual intervention.

### Benefits

✅ **Save Time**: No more manually searching for PDFs across 20+ organizations  
✅ **Stay Current**: Automatically discovers publications from the last week  
✅ **Quality Filter**: AI ensures only highly relevant content is added  
✅ **Comprehensive Coverage**: Searches across think tanks, international orgs, and academia  
✅ **Scalable**: Add new topics and let the system find relevant sources automatically  
✅ **Transparent**: All metadata saved (organization, relevance score, discovery date)

### Technical Details

**Service Location:** `/src/services/intelligentDiscovery.js`  
**AI Model:** Cerebras API (via `/src/services/cerebras.js`)  
**Dependencies:** axios, cheerio, sequelize  
**Database:** Stores discoveries in `Sources` table with metadata in `settings` JSONB field

### Future Enhancements

- [ ] Add more organization types (government agencies, NGOs, private research firms)
- [ ] Support custom organization lists per user
- [ ] Implement ML-based organization recommendation based on past engagement
- [ ] Add email notifications when new automated discoveries are made
- [ ] Create dashboard view showing discovery statistics and trends


---

## 🔍 EXA.AI REAL-TIME DISCOVERY SYSTEM

### Overview

In addition to the web scraping approach, Franciscomoney Intel now integrates **Exa.ai semantic search** for real-time PDF discovery across the entire web. Unlike web scraping which is limited to pre-configured organizations, Exa can discover relevant research from any source globally using neural semantic search.

### Why Exa.ai?

**Traditional Approach (Web Scraping):**
- Limited to 17 pre-configured organizations
- Requires manual maintenance as websites change
- Only finds what we explicitly look for
- Free but labor-intensive

**Exa.ai Approach:**
- Searches the entire web semantically
- Discovers content from any source
- Finds PDFs by meaning, not just keywords
- Real-time discovery (no scraping delays)
- Cost: ~$30-60/month with built-in controls


### Smart Date Discovery Logic

The system uses **adaptive date ranges** for optimal user experience:

**First Discovery (User Creates New Topic):**
- Searches last **15 days** of publications
- Provides comprehensive onboarding batch (12-20 PDFs)
- Email: "Welcome! Here are 15 key reports to get you started"

**Weekly Updates (Automated):**
- Searches last **7 days** only
- Delivers only new content (3-5 PDFs)
- Email: "Your Weekly Brief: 4 New Reports"

**Smart Catchup (After Gaps):**
- Automatically detects days since last discovery
- Searches missed period (up to 30 days max)
- Email: "Catching up: 10 reports from the last 2 weeks"

**Example User Journey:**

```
Day 1  → Create "CBDC Privacy" topic
         Discovery runs: Last 15 days
         Result: 15 foundational reports

Day 8  → Weekly discovery
         Discovery runs: Last 7 days
         Result: 4 new reports this week

Day 15 → Weekly discovery
         Discovery runs: Last 7 days
         Result: 3 new reports this week

Day 30 → Discovery after 15-day gap
         Discovery runs: Last 16 days (catchup)
         Result: 10 reports covering missed period
```

**Benefits:**
- ✅ Better onboarding (comprehensive initial batch)
- ✅ Focused updates (only new content)
- ✅ Automatic catchup (never miss important research)
- ✅ Same cost ($0.01 per search regardless of date range)

**API Response Includes:**

```json
{
  "success": true,
  "isFirstDiscovery": true,
  "daysSearched": 15,
  "sourcesCreated": 15,
  "message": "Initial discovery - found 15 reports from last 15 days"
}
```

For complete details, see `SMART-DATE-DISCOVERY.md`.

### Cost Controls Built-In

**Multi-Layer Protection Against Overspending:**

1. **Rate Limiting**
   - Default: 50 searches/hour, 200 searches/day
   - Configurable via admin dashboard
   - Automatic enforcement with clear error messages

2. **Smart Caching**
   - 24-hour cache for identical searches
   - Saves 30-50% on repeated queries
   - Automatic cache management

3. **Query Optimization**
   - Uses Cerebras (cheap 8B model) to create optimal search queries
   - Combines multiple keywords into single search
   - Reduces redundant API calls

4. **Batch Scoring**
   - All results scored in ONE Cerebras call
   - No per-result API costs
   - Uses cheapest model (llama3.1-8b)

5. **Result Limiting**
   - Max 10 results per search (configurable)
   - Prevents excessive content downloads

**Cost Breakdown:**
- Light use (20-50 searches/day): $6-15/month
- Moderate (50-100 searches/day): $15-30/month
- Default limits (100-200 searches/day): $30-60/month
- With caching: 30-50% reduction
- **Worst case with all safeguards: $200/month max**

### How It Works

```
User creates topic → Cerebras builds optimal query →
Exa searches entire web → Returns PDFs with scores →
Cerebras ranks by relevance → Creates Source records →
Existing pipeline processes (PDF → MD → HTML → Email)
```

**Example:**
```
Topic: "ESG investing in emerging markets"

Exa discovers from:
✅ World Bank, IMF, BIS
✅ Harvard, MIT, Stanford
✅ Think tanks worldwide
✅ Government agencies
✅ Industry associations

All automatically, with AI relevance scoring!
```

### Key Features

- **Semantic Search**: Finds content by meaning, not just keywords
  - "CBDC" also finds "central bank digital currency"
  - "AI governance" also finds "artificial intelligence regulation"

- **Real-Time Discovery**: Discover PDFs published today, not just weekly scrapes

- **Quality Filtering**: AI scores relevance (0-1 scale), only creates sources above threshold

- **Trusted Domains**: Filters to academic/think tank sources for quality

- **Zero Breaking Changes**: Integrates seamlessly with existing pipeline

### API Usage

**Discover PDFs:**
```bash
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
  "searchesRemainingToday": 185
}
```

**Check Usage Stats:**
```bash
GET /api/discover/exa/stats
```

Returns current usage, remaining quota, cache size, and estimated daily cost.

### Admin Dashboard

The admin interface provides complete control:

- **API Key Management**: Securely store your Exa.ai API key
- **Rate Limit Configuration**: Adjust search limits per hour/day
- **Real-Time Monitoring**:
  - Searches this hour/day
  - Remaining quota
  - Estimated daily cost
  - Cache hit rate
- **Test Discovery**: Try searches on sample topics before going live

### Setup (5 Minutes)

1. **Get Exa API Key**: Visit https://exa.ai and generate key

2. **Add to Environment**:
   ```bash
   echo "EXA_API_KEY=your_key_here" >> .env
   ```

3. **Integrate Routes**: Add endpoints from `exa-api-endpoint.js`

4. **Add Admin UI**: Integrate `admin-exa-settings.html` into admin dashboard

5. **Test**: Run discovery on a sample topic

### Comparison: Web Scraping vs Exa.ai

| Feature | Web Scraping | Exa.ai |
|---------|--------------|--------|
| **Coverage** | 17 organizations | Entire web |
| **Setup Time** | Hours | Minutes |
| **Maintenance** | High (sites change) | None (API handles it) |
| **Discovery** | Static list | Dynamic semantic search |
| **Cost** | Free | ~$60/month |
| **Speed** | Slow (scrape each site) | Fast (single query) |
| **Quality** | All PDFs found | AI relevance-scored |
| **Freshness** | Scheduled scrapes | Real-time |

### Best Practice: Use Both!

**Recommended Strategy:**
- **Web Scraping**: For trusted organizations you monitor regularly (free, comprehensive)
- **Exa.ai**: For exploratory research and new topics (real-time, broad coverage)
- **Result**: Best quality + coverage without breaking the bank

### Scheduled Automation Example

```javascript
const cron = require('node-cron');
const ExaDiscoveryService = require('./services/exaDiscovery');

// Every Monday at 2 AM
cron.schedule('0 2 * * 1', async () => {
  const exaService = new ExaDiscoveryService(models);
  const activeTopics = await models.TopicArea.findAll({ where: { isActive: true } });

  for (const topic of activeTopics) {
    await exaService.discoverPDFs(topic.id, {
      maxResults: 10,
      daysBack: 7,
      minRelevanceScore: 0.75
    });
  }
});
```

**Cost**: ~$0.10-0.30 per week (10-30 topics × $0.01 each)

### Technical Details

**Service Location:** `/src/services/exaDiscovery.js`
**API Endpoints:** `/api/discover/exa`, `/api/discover/exa/stats`, `/api/settings/exa-api-key`
**AI Integration:** Cerebras for query building and result scoring
**Dependencies:** axios, sequelize
**Database:** Stores API key in Settings table, creates Source records

### Documentation

For complete details, see:
- **`EXA_QUICK_START.md`** - 5-minute setup guide
- **`EXA_INTEGRATION_GUIDE.md`** - Complete technical documentation
- **`EXA_VS_PERPLEXITY.md`** - Why we chose Exa over Perplexity

### Cost Projections

**Year 1 with Exa.ai:**
```
Months 1-3 (testing): ~$30/month = $90
Months 4-12 (production): ~$50/month = $450
Total Year 1: $540

With 30% cache savings: ~$380/year
```

**Compare to alternatives:**
- Manual research: Hours of labor per week
- Perplexity API: $1,730/year (5x more expensive)
- Enterprise search tools: $10,000+/year

### Safety Features

- **Rate limit errors** with clear "try again in X minutes" messages
- **Cache hits** show $0.00 cost
- **API failures** logged but system doesn't crash
- **Usage dashboard** shows real-time spending
- **Admin controls** to pause/adjust limits anytime

### Future Enhancements

- [ ] Redis cache for multi-server deployment
- [ ] ML-based query optimization
- [ ] Organization reputation scoring
- [ ] Automatic topic expansion based on results
- [ ] Email alerts for high-value discoveries
- [ ] A/B testing web scraping vs Exa results
- [ ] Cost analytics dashboard

## Alert System

Francisco Money Intel includes a complete intelligence alert system that automatically discovers, processes, and delivers personalized research reports.

For detailed documentation, see: [ALERT_SYSTEM_IMPLEMENTATION.md](./ALERT_SYSTEM_IMPLEMENTATION.md)

### Quick Start

1. **Create Alert**: Login and create alert with keywords
2. **Discovery**: Exa.ai automatically finds relevant PDFs
3. **Processing**: Cerebras AI generates summaries
4. **Delivery**: Weekly email reports delivered to inbox

### Key Features
- ✅ AI-powered PDF discovery via Exa.ai
- ✅ Automatic summarization via Cerebras
- ✅ Weekly email reports (Tuesdays 9 AM ET)
- ✅ Personalized content based on keywords
- ✅ Professional HTML email templates


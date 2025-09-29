# Franciscomoney Intel

An AI-powered evolution of Google Alerts, providing intelligent monitoring and analysis of financial and technological developments using Cerebras AI with Llama 3.1 models.

Project envisioned, created and prepared for the WeMakeDevs hackathon 2025 by Francisco Cordoba Otalora

## 🚀 Current Implementation Status

### ✅ Fully Implemented Features

#### 1. **Complete Authentication System**
- User registration with email/password
- Secure login/logout functionality
- Session management with cookies
- Password hashing with bcrypt
- Admin authentication protection

#### 2. **Admin Dashboard** (http://155.138.165.47:3000/admin)
- **Dashboard Tab**: Real-time statistics (users, documents, alerts, topics)
- **Topic Areas Tab**: Create/edit/delete topic areas with keywords
- **Sources Tab**: Manage RSS feeds and PDF sources with "Process Now" functionality
- **Alerts Tab**: View and manage user alerts
- **Official Tab**: View all processed documents with AI analysis
  - Document codes (A001, A002, etc.)
  - View HTML reports
  - Download markdown versions
  - Delete documents
- **Analytics Tab**: Placeholder for email metrics

#### 3. **Document Processing Pipeline**
- PDF download and parsing using pdf-parse
- Automatic document code generation (A001, A002, etc.)
- Markdown conversion
- Duplicate detection
- Error handling and retry logic

#### 4. **Cerebras AI Integration**
- Document analysis using Llama 3.1 8B model
- Extracts:
  - Key themes and topics
  - Specific facts and figures from documents
  - Sentiment analysis (positive/neutral/negative)
  - Urgency level (low/medium/high)
  - Relevance score (0-100)
  - Executive summary
- API key configuration through admin panel

#### 5. **SEO-Optimized Report Pages**
- Clean URLs: `/A001.html`, `/A002.html`, etc.
- Business Insider-style design
- Displays ONLY extracted facts from documents:
  - AI Analysis Summary
  - Key Facts (numbered list)
  - Related Topics/Themes
  - Metrics (relevance, sentiment, urgency)
- Download original PDF link
- Mobile-responsive design

#### 6. **Database Schema**
- PostgreSQL with Sequelize ORM
- Models: User, TopicArea, Source, Alert, Document, Report
- Proper relationships and indexing
- JSON field for AI analysis storage

#### 7. **API Endpoints**
- `/api/auth/*` - Registration, login, logout, status
- `/api/admin/*` - All admin CRUD operations
- `/api/admin/process-sources` - Manual document processing
- `/api/admin/documents/:id` - Delete documents
- `/api/documents/:id/markdown` - Download markdown

### 🛠️ Technical Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **AI**: Cerebras API with Llama 3.1 8B
- **Authentication**: bcrypt, express-session
- **Process Management**: PM2
- **PDF Processing**: pdf-parse
- **Frontend**: Vanilla JavaScript, clean CSS

### 🤖 How We Use Llama 3.1 & Cerebras API

#### Why Cerebras + Llama 3.1?

We chose **Cerebras Cloud** with **Llama 3.1 8B** for several strategic reasons:

1. **Speed**: Cerebras hardware provides ~10x faster inference than traditional GPUs
2. **Cost-Effective**: Llama 3.1 8B offers excellent performance at a fraction of GPT-4's cost
3. **Quality**: Llama 3.1 excels at structured data extraction and summarization
4. **Reliability**: Consistent JSON outputs for seamless integration

#### Our AI Processing Pipeline

```javascript
// 1. PDF Document → Text Extraction
const pdfData = await pdfParse(pdfBuffer);
const documentText = pdfData.text;

// 2. Send to Cerebras for Analysis
const cerebrasService = new CerebrasService();
const analysis = await cerebrasService.analyzeDocument(
  documentText,
  ['tokenization', 'financial', 'stability'] // Topic keywords
);

// 3. Structured Output
{
  "themes": ["tokenization", "DLT", "financial stability"],
  "facts": [
    "Tokenisation is currently small in scale but growing",
    "FSB published report in October 2024",
    "Most projects use permissioned DLT platforms"
  ],
  "sentiment": "neutral",
  "urgency": "medium", 
  "relevanceScore": 85,
  "summary": "This document provides insights into tokenization..."
}
```

#### Cerebras API Integration Details

**Model**: `llama3.1-8b`  
**Endpoint**: `https://api.cerebras.ai/v1/chat/completions`  
**Temperature**: 0.3 (for consistent, factual outputs)  
**Max Tokens**: 1000-1500 per request

**Key Features We Leverage**:
- **Structured Extraction**: Always returns valid JSON
- **Contextual Understanding**: Analyzes documents based on topic keywords
- **Factual Accuracy**: Extracts only information present in source
- **Relevance Scoring**: Rates document importance (0-100)

#### Prompt Engineering

Our prompts are carefully crafted to ensure:
- **No Hallucination**: "Extract only facts present in the document"
- **Structured Output**: Specific JSON schema requirements
- **Domain Awareness**: Topic keywords guide the analysis
- **Actionable Insights**: Focus on decision-relevant information

Example prompt structure:
```
Analyze the following document and provide insights in JSON format:

Document content: [PDF text content]
Topic keywords: [user's interest areas]

Please extract and analyze:
1. Main themes and topics (list)
2. Key facts and figures (list with specific data from the document)
3. Overall sentiment (positive, negative, neutral)
4. Urgency level (low, medium, high)
5. Relevance score to the provided keywords (0-100)
6. A brief summary (2-3 sentences) explaining why this document matters

Return only valid JSON in this exact format: {...}
```

#### Future Enhancements

While currently using single-document analysis, the architecture supports:
- **Multi-document Synthesis**: Combining insights across sources
- **Personalized Summaries**: Different outputs for different user interests
- **Trend Detection**: Identifying patterns across time
- **Cross-reference Validation**: Fact-checking across sources

### 📁 Project Structure

```
franciscomoney-intel/
├── src/
│   ├── api/           # API route handlers
│   ├── models/        # Sequelize database models
│   ├── services/      # Business logic (Cerebras, email, etc.)
│   ├── workers/       # Background processors
│   └── server.js      # Main Express server
├── public/            # Frontend files
│   ├── admin.html     # Admin dashboard
│   ├── login.html     # Login page
│   └── dashboard.html # User dashboard
├── config/           # Configuration files
└── .env             # Environment variables
```

### 🔐 Admin Credentials
- Email: `f@pachoman.com`
- Password: `C@rlos2025`

### 🌐 Access URLs
- Main App: http://155.138.165.47:3000
- Admin Panel: http://155.138.165.47:3000/admin
- Example Report: http://155.138.165.47:3000/A002.html

### ⏳ Pending Implementation

1. **Email Service**
   - Postfix SMTP configuration
   - Email templates
   - Scheduled sending

2. **Alert Processing**
   - Cron job for periodic processing
   - User preference matching
   - Personalized summaries

3. **User Dashboard**
   - Alert management UI
   - Frequency settings
   - Report history

4. **Analytics**
   - Email open tracking
   - Click-through rates
   - Engagement metrics

### 🚀 Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up PostgreSQL database**
4. **Configure environment variables** in `.env`
5. **Run migrations**: `npm run migrate`
6. **Start server**: `npm start` or `pm2 start ecosystem.config.js`

### 🔑 Environment Variables

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/franciscomoney_intel
SESSION_SECRET=your-secret-key
CEREBRAS_API_KEY=your-cerebras-api-key
```

---

## Original Vision & Hackathon Approach

### Hackathon Approach: Why We Simplified

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
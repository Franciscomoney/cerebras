require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const session = require('express-session');
const path = require('path');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

// Import routers
const authRouter = require('./api/auth');
const alertsRouter = require('./api/alerts');
const reportsRouter = require('./api/reports');
const adminRouter = require('./api/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration without Redis for now

// Security middleware - disabled for development
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP completely for now
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  strictTransportSecurity: false,
}));

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins for now (you should restrict this in production)
    return callback(null, true);
  },
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'franciscomoney-session-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false for HTTP
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// View engine setup
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// User dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

// Admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Register page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});

// Test page
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'test.html'));
});

// Report pages (SEO-optimized)
app.get('/reports/:topic/:slug', (req, res) => {
  // This will be implemented to serve SEO-optimized report pages
  res.render('report', { topic: req.params.topic, slug: req.params.slug });
});

// Official document HTML pages (e.g., /A001.html)
app.get('/:code.html', async (req, res) => {
  try {
    const { Document } = require('./models');
    const document = await Document.findOne({
      where: { code: req.params.code },
      include: [{
        model: require('./models').Source,
        as: 'source',
        include: [{
          model: require('./models').TopicArea,
          as: 'topicArea'
        }]
      }]
    });
    
    if (!document) {
      return res.status(404).send('Document not found');
    }
    
    // Generate Business Insider style HTML page
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title} | Franciscomoney Intel</title>
    <meta name="description" content="${document.aiAnalysis?.summary || document.title}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #111;
            background: #fff;
        }
        
        .header {
            background: #fff;
            border-bottom: 1px solid #e5e5e5;
            padding: 20px 0;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        }
        
        .container {
            max-width: 720px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .logo {
            font-size: 24px;
            font-weight: 900;
            color: #0066cc;
            text-decoration: none;
            display: inline-block;
        }
        
        .article-meta {
            margin: 40px 0 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e5e5;
        }
        
        .category {
            color: #0066cc;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 1px;
            margin-bottom: 10px;
            display: inline-block;
        }
        
        h1 {
            font-size: 42px;
            line-height: 1.2;
            font-weight: 900;
            margin: 15px 0 20px;
            color: #111;
        }
        
        .byline {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .byline .author {
            font-weight: 500;
            color: #111;
        }
        
        .date {
            font-size: 14px;
            color: #666;
        }
        
        .key-takeaways {
            background: #f8f9fa;
            border-left: 4px solid #0066cc;
            padding: 25px 30px;
            margin: 30px 0;
        }
        
        .key-takeaways h2 {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .key-takeaways ul {
            list-style: none;
            padding: 0;
        }
        
        .key-takeaways li {
            position: relative;
            padding-left: 25px;
            margin-bottom: 12px;
            line-height: 1.6;
        }
        
        .key-takeaways li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #0066cc;
            font-weight: bold;
            font-size: 20px;
            line-height: 20px;
        }
        
        .article-content {
            font-size: 18px;
            line-height: 1.8;
            color: #333;
            margin: 40px 0;
        }
        
        .article-content p {
            margin-bottom: 24px;
        }
        
        .article-content h2 {
            font-size: 28px;
            font-weight: 700;
            margin: 40px 0 20px;
            color: #111;
        }
        
        .metrics {
            display: flex;
            gap: 40px;
            margin: 40px 0;
            padding: 30px 0;
            border-top: 1px solid #e5e5e5;
            border-bottom: 1px solid #e5e5e5;
        }
        
        .metric {
            text-align: center;
            flex: 1;
        }
        
        .metric-value {
            font-size: 36px;
            font-weight: 900;
            color: #0066cc;
            margin-bottom: 5px;
        }
        
        .metric-label {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .themes-section {
            margin: 40px 0;
        }
        
        .themes {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
        }
        
        .theme-tag {
            display: inline-block;
            padding: 8px 16px;
            background: #f0f4f8;
            color: #333;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            text-transform: capitalize;
        }
        
        .footer {
            margin-top: 60px;
            padding: 40px 0;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        
        .original-link {
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            text-align: center;
        }
        
        .original-link a {
            color: #0066cc;
            text-decoration: none;
            font-weight: 500;
        }
        
        .original-link a:hover {
            text-decoration: underline;
        }
        
        .why-read {
            background: #f0f8ff;
            border-left: 4px solid #0066cc;
            padding: 20px 25px;
            margin: 30px 0;
        }
        
        .why-read h2 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 10px;
            color: #0066cc;
        }
        
        .why-read p {
            font-size: 16px;
            line-height: 1.6;
            color: #333;
            margin: 0;
        }
        
        .analysis-section {
            margin: 50px 0;
        }
        
        .analysis-section h2 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 25px;
            color: #111;
            border-bottom: 2px solid #e5e5e5;
            padding-bottom: 10px;
        }
        
        .highlight-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 25px;
        }
        
        .highlight-box p {
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 15px;
        }
        
        .highlight-box p:last-child {
            margin-bottom: 0;
        }
        
        .insight-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .insight-card {
            background: #fff;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .insight-card h3 {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #0066cc;
        }
        
        .insight-card p {
            font-size: 15px;
            line-height: 1.6;
            color: #444;
        }
        
        .risk-analysis {
            background: #fff5f5;
            border: 1px solid #ffdddd;
            border-radius: 8px;
            padding: 25px;
        }
        
        .risk-item {
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ffdddd;
        }
        
        .risk-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .risk-item h4 {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #d32f2f;
        }
        
        .risk-item p {
            font-size: 15px;
            line-height: 1.6;
            color: #444;
        }
        
        .timeline {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .timeline-item {
            background: #f8f9fa;
            border-left: 4px solid #0066cc;
            padding: 20px;
        }
        
        .timeline-item h4 {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #0066cc;
        }
        
        .timeline-item p {
            font-size: 15px;
            line-height: 1.6;
            color: #444;
        }
        
        .action-items {
            background: #e8f5e9;
            border: 1px solid #c8e6c9;
            border-radius: 8px;
            padding: 25px;
        }
        
        .action-items p {
            font-size: 15px;
            line-height: 1.8;
            margin-bottom: 12px;
            color: #333;
        }
        
        .action-items p:last-child {
            margin-bottom: 0;
        }
        
        .facts-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .fact-item {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #0066cc;
        }
        
        .fact-number {
            background: #0066cc;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            flex-shrink: 0;
        }
        
        .fact-item p {
            margin: 0;
            line-height: 1.6;
            color: #333;
        }
        
        .document-content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 8px;
            font-size: 16px;
            line-height: 1.8;
        }
        
        .document-content p {
            margin-bottom: 20px;
            color: #333;
        }
        
        .document-content p:last-child {
            margin-bottom: 0;
        }
        
        @media (max-width: 768px) {
            h1 { font-size: 32px; }
            .article-content { font-size: 16px; }
            .metrics { flex-direction: column; gap: 20px; }
            .key-takeaways { padding: 20px; }
            .why-read { padding: 20px; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <a href="/" class="logo">Franciscomoney Intel</a>
        </div>
    </header>

    <main class="container">
        <article>
            <div class="article-meta">
                <span class="category">${document.source?.topicArea?.name || 'Intelligence Report'}</span>
                <h1>${document.title}</h1>
                <div class="byline">
                    Analysis by <span class="author">Franciscomoney AI</span> • Source: ${document.source?.name || 'Research'}
                </div>
                <div class="date">
                    ${document.processedAt ? new Date(document.processedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    }) : new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </div>
            </div>

            ${document.aiAnalysis?.facts && document.aiAnalysis.facts.length > 0 ? `
            <div class="key-takeaways">
                <h2>Key Takeaways</h2>
                <ul>
                    ${document.aiAnalysis.facts.slice(0, 5).map(fact => `<li>${fact}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            ${document.aiAnalysis ? `
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">${document.aiAnalysis.relevanceScore || 'N/A'}</div>
                    <div class="metric-label">Relevance Score</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${document.aiAnalysis.sentiment || 'Neutral'}</div>
                    <div class="metric-label">Sentiment</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${document.aiAnalysis.urgency || 'Medium'}</div>
                    <div class="metric-label">Urgency Level</div>
                </div>
            </div>
            ` : ''}

            ${document.aiAnalysis?.summary || document.markdownContent ? `
            <div class="why-read">
                <h2>Why This Matters</h2>
                <p>I selected this ${document.source?.topicArea?.name || 'intelligence'} report because ${
                    document.title.toLowerCase().includes('tokenization') || document.title.toLowerCase().includes('tokenisation')
                    ? 'tokenization could fundamentally reshape how $100+ trillion in global assets are traded, owned, and managed. The FSB\'s analysis reveals both massive opportunities and critical risks that every financial professional needs to understand'
                    : 'it addresses game-changing developments in financial technology that could transform traditional markets'
                }.</p>
            </div>
            ` : ''}

            ${document.aiAnalysis ? `
            <div class="analysis-section">
                <h2>📊 AI Analysis Summary</h2>
                <div class="highlight-box">
                    ${document.aiAnalysis.summary ? `<p>${document.aiAnalysis.summary}</p>` : ''}
                </div>
            </div>
            ` : ''}

            ${document.aiAnalysis?.facts && document.aiAnalysis.facts.length > 0 ? `
            <div class="analysis-section">
                <h2>📌 Key Facts from Document</h2>
                <div class="facts-list">
                    ${document.aiAnalysis.facts.map((fact, index) => `
                        <div class="fact-item">
                            <span class="fact-number">${index + 1}</span>
                            <p>${fact}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}


            ${document.aiAnalysis?.themes && document.aiAnalysis.themes.length > 0 ? `
            <div class="themes-section">
                <h2>Related Topics</h2>
                <div class="themes">
                    ${document.aiAnalysis.themes.map(theme => 
                        `<span class="theme-tag">${theme}</span>`
                    ).join('')}
                </div>
            </div>
            ` : ''}

            ${document.pdfUrl ? `
            <div class="original-link">
                <a href="${document.pdfUrl}" target="_blank" rel="noopener noreferrer">
                    Download Original PDF →
                </a>
            </div>
            ` : ''}
        </article>
    </main>

    <footer class="footer">
        <div class="container">
            <p>© ${new Date().getFullYear()} Franciscomoney Intel. AI-powered intelligence for better decisions.</p>
        </div>
    </footer>
</body>
</html>`;
    
    res.send(html);
  } catch (error) {
    logger.error('Error serving document HTML:', error);
    res.status(500).send('Internal server error');
  }
});

// Download markdown endpoint
app.get('/api/documents/:id/markdown', async (req, res) => {
  try {
    const { Document } = require('./models');
    const document = await Document.findByPk(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${document.code || document.id}.md"`);
    res.send(document.markdownContent || '# No content available');
  } catch (error) {
    logger.error('Error downloading markdown:', error);
    res.status(500).json({ error: 'Failed to download markdown' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Sync database models
    logger.info('Syncing database models...');
    await sequelize.sync({ force: false });
    logger.info('Database models synchronized');
    
    // Create admin user if it doesn't exist
    const createAdminUser = require('../scripts/createAdmin');
    await createAdminUser();
    logger.info('Admin user checked/created');
    
    // Start listening
    app.listen(PORT, () => {
      logger.info(`Franciscomoney Intel server running on port ${PORT}`);
      logger.info(`Admin: http://155.138.165.47:3000/admin`);
      logger.info(`Registration: http://155.138.165.47:3000/register`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../public/reports');
    this.counter = 0;
  }

  async initialize() {
    // Ensure reports directory exists
    await fs.mkdir(this.reportsDir, { recursive: true });

    // Get the highest existing report number
    try {
      const files = await fs.readdir(this.reportsDir);
      const reportNumbers = files
        .filter(f => f.match(/^\d+\.html$/))
        .map(f => parseInt(f.match(/\d+/)[0]))
        .filter(n => !isNaN(n));

      this.counter = reportNumbers.length > 0 ? Math.max(...reportNumbers) : 0;
    } catch (e) {
      this.counter = 0;
    }
  }

  getNextCode() {
    this.counter++;
    return String(this.counter).padStart(5, '0');
  }

  async generateReport(document, cerebrasAnalysis, pdfUrl) {
    const code = this.getNextCode();
    const htmlPath = path.join(this.reportsDir, `${code}.html`);

    const html = this.createBusinessInsiderHTML(code, document, cerebrasAnalysis, pdfUrl);

    await fs.writeFile(htmlPath, html, 'utf8');

    logger.info(`Generated report: ${code}.html`);

    return {
      code,
      htmlPath,
      url: `/reports/${code}.html`
    };
  }

  createBusinessInsiderHTML(code, document, analysis, pdfUrl) {
    const {
      executiveSummary = 'Summary not available',
      detailedInsights = [],
      relevanceScore = 0,
      sentiment = 'neutral',
      urgency = 'medium',
      themes = []
    } = analysis;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${executiveSummary}">
  <title>${document.title} - Franciscomoney Intel</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #fff;
    }

    .header {
      border-bottom: 3px solid #e41e13;
      padding: 16px 0;
      background: #fff;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #000;
      text-decoration: none;
    }

    .article {
      max-width: 720px;
      margin: 40px auto;
      padding: 0 20px;
    }

    .article-header {
      margin-bottom: 32px;
    }

    h1 {
      font-size: 42px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 16px;
      color: #000;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 16px;
      color: #666;
      font-size: 14px;
      margin-bottom: 24px;
    }

    .meta-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #f0f0f0;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .meta-badge.high { background: #fee; color: #c00; }
    .meta-badge.medium { background: #ffeaa7; color: #856404; }
    .meta-badge.low { background: #d4edda; color: #155724; }

    .summary {
      font-size: 20px;
      line-height: 1.5;
      color: #333;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e5e5;
    }

    .content {
      font-size: 18px;
      line-height: 1.8;
    }

    h2 {
      font-size: 28px;
      font-weight: 700;
      margin: 40px 0 20px;
      color: #000;
    }

    .insights {
      list-style: none;
      margin: 24px 0;
    }

    .insight-item {
      margin-bottom: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-left: 4px solid #e41e13;
      border-radius: 4px;
    }

    .insight-text {
      font-size: 16px;
      color: #1a1a1a;
      margin-bottom: 8px;
    }

    .insight-citation {
      font-size: 13px;
      color: #666;
      font-style: italic;
    }

    .themes {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 20px 0;
    }

    .theme-tag {
      padding: 6px 14px;
      background: #000;
      color: #fff;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }

    .download-section {
      margin: 40px 0;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      text-align: center;
    }

    .download-btn {
      display: inline-block;
      padding: 14px 32px;
      background: #fff;
      color: #667eea;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 700;
      font-size: 16px;
      transition: transform 0.2s;
    }

    .download-btn:hover {
      transform: translateY(-2px);
    }

    .download-title {
      color: #fff;
      font-size: 20px;
      margin-bottom: 16px;
      font-weight: 600;
    }

    .footer {
      border-top: 1px solid #e5e5e5;
      padding: 40px 0;
      margin-top: 60px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      h1 { font-size: 32px; }
      .summary { font-size: 18px; }
      .content { font-size: 16px; }
      h2 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="container">
      <a href="/" class="logo">FRANCISCOMONEY INTEL</a>
    </div>
  </header>

  <article class="article">
    <div class="article-header">
      <h1>${document.title}</h1>

      <div class="meta">
        <span class="meta-badge ${urgency}">${urgency.toUpperCase()} PRIORITY</span>
        <span>Relevance: ${relevanceScore}/100</span>
        <span>Sentiment: ${sentiment}</span>
      </div>

      <div class="themes">
        ${themes.map(theme => `<span class="theme-tag">${theme}</span>`).join('')}
      </div>
    </div>

    <div class="summary">
      ${executiveSummary}
    </div>

    <div class="content">
      <h2>Key Insights</h2>

      <ul class="insights">
        ${detailedInsights.map((insight, i) => `
          <li class="insight-item">
            <div class="insight-text"><strong>${i + 1}.</strong> ${insight.text}</div>
            <div class="insight-citation">Source: ${insight.citation || 'Document analysis'}</div>
          </li>
        `).join('')}
      </ul>

      <div class="download-section">
        <div class="download-title">Read the Full Report</div>
        <a href="${pdfUrl}" class="download-btn" download>Download Original PDF →</a>
      </div>
    </div>
  </article>

  <footer class="footer">
    <div class="container">
      <p>© ${new Date().getFullYear()} Franciscomoney Intel. AI-Powered Intelligence Reports.</p>
      <p style="margin-top: 8px; font-size: 12px;">Report ID: ${code}</p>
    </div>
  </footer>
</body>
</html>`;
  }
}

module.exports = ReportGenerator;

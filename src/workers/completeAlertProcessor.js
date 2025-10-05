const exaDiscovery = require('../services/exaDiscovery');
const CerebrasService = require('../services/cerebras');
const ReportGenerator = require('../services/reportGenerator');
const emailService = require('../services/emailService');
const { Alert, User, Source, Document } = require('../models');
const logger = require('../utils/logger');
const axios = require('axios');
const pdfParse = require('pdf-parse');

class CompleteAlertProcessor {
  constructor() {
    this.cerebras = new CerebrasService();
    this.reportGenerator = new ReportGenerator();
  }

  async initialize() {
    await this.reportGenerator.initialize();
  }

  async processNewAlert(alertId) {
    logger.info(`Processing new alert: ${alertId}`);

    const alert = await Alert.findByPk(alertId, {
      include: [{ model: User, as: 'user' }]
    });

    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    // Step 1: Use EXA to find 20 PDFs from last month
    logger.info(`Step 1: Searching for PDFs with keywords: ${alert.keywords}`);
    const sources = await exaDiscovery.discoverSources(alert.keywords, alert.id);

    if (sources.length === 0) {
      logger.warn('No sources found');
      return { success: false, reason: 'No sources found' };
    }

    logger.info(`Found ${sources.length} sources`);

    // Step 2: Download PDFs and analyze with Cerebras
    const analyzedDocs = [];

    for (const source of sources.slice(0, 20)) {
      try {
        // Download PDF
        const pdfBuffer = await this.downloadPDF(source.url);

        // Parse PDF to text
        const pdfData = await pdfParse(pdfBuffer);
        const pdfText = pdfData.text;

        // Convert to markdown (simple version)
        const markdownContent = pdfText;

        // Analyze with Cerebras
        const cerebrasAnalysis = await this.cerebras.analyzeDocument(
          markdownContent,
          alert.keywords.split(',').map(k => k.trim())
        );

        // Store the PDF
        const pdfPath = await this.savePDF(pdfBuffer, source.title);

        analyzedDocs.push({
          source,
          pdfPath,
          pdfUrl: pdfPath,
          markdownContent,
          cerebrasAnalysis,
          relevanceScore: cerebrasAnalysis.relevanceScore || 0
        });

        logger.info(`Analyzed: ${source.title} - Score: ${cerebrasAnalysis.relevanceScore}`);

      } catch (error) {
        logger.error(`Error processing source ${source.url}:`, error.message);
      }
    }

    if (analyzedDocs.length === 0) {
      return { success: false, reason: 'Failed to analyze any documents' };
    }

    // Step 3: Select top 5 using Cerebras relevance scores
    const top5 = analyzedDocs
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

    logger.info(`Selected top 5 documents out of ${analyzedDocs.length}`);

    // Step 4: Generate HTML reports for each (fintech001.html, etc.)
    const reports = [];

    for (const doc of top5) {
      const reportInfo = await this.reportGenerator.generateReport(
        { title: doc.source.title },
        doc.cerebrasAnalysis,
        doc.pdfUrl
      );

      // Create Document record
      const document = await Document.create({
        sourceId: doc.source.id,
        title: doc.source.title,
        url: doc.source.url,
        content: doc.markdownContent,
        summary: doc.cerebrasAnalysis.executiveSummary,
        publishedAt: doc.source.publishedDate || new Date(),
        metadata: {
          code: reportInfo.code,
          htmlUrl: reportInfo.url,
          cerebrasAnalysis: doc.cerebrasAnalysis
        }
      });

      // Extract one-sentence summary
      const oneSentenceSummary = doc.cerebrasAnalysis.executiveSummary.split('.')[0] + '.';

      reports.push({
        title: doc.source.title,
        oneSentenceSummary,
        htmlUrl: `http://51.178.253.51:3000${reportInfo.url}`,
        code: reportInfo.code,
        relevanceScore: doc.relevanceScore,
        sentiment: doc.cerebrasAnalysis.sentiment,
        urgency: doc.cerebrasAnalysis.urgency
      });
    }

    logger.info(`Generated ${reports.length} HTML reports`);

    // Step 5: Send email with one-sentence summaries
    await emailService.sendAlertEmailWithReports(
      alert.user,
      alert,
      reports
    );

    // Update alert last sent time
    await alert.update({ lastSentAt: new Date() });

    logger.info(`Alert ${alertId} processed successfully!`);

    return {
      success: true,
      reportsGenerated: reports.length,
      reports
    };
  }

  async downloadPDF(url) {
    const response = await axios({
      method: 'get',
      url,
      responseType: 'arraybuffer',
      timeout: 30000
    });

    return Buffer.from(response.data);
  }

  async savePDF(buffer, title) {
    const fs = require('fs').promises;
    const path = require('path');

    const pdfsDir = path.join(__dirname, '../../public/pdfs');
    await fs.mkdir(pdfsDir, { recursive: true });

    const filename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 50) + '.pdf';

    const filepath = path.join(pdfsDir, filename);
    await fs.writeFile(filepath, buffer);

    return `/pdfs/${filename}`;
  }
}

module.exports = CompleteAlertProcessor;

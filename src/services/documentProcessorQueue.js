const axios = require('axios');
const pdfParse = require('pdf-parse');
const crypto = require('crypto');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const cerebrasService = require('./cerebras');
const TurndownService = require('turndown');

/**
 * Document Processor Queue with Intelligent Deduplication
 * Ensures each PDF is processed only once, even with multiple users
 */
class DocumentProcessorQueue {
  constructor(models) {
    this.models = models;
    this.turndownService = new TurndownService();
    this.processingLocks = new Map(); // In-memory locks for concurrent processing
  }

  /**
   * Main entry point: Process a document with full deduplication
   */
  async processDocument(url, metadata = {}) {
    try {
      logger.info(`Processing document: ${url}`);

      // STEP 1: Check if URL already exists
      let document = await this.models.Document.findOne({ where: { url } });

      if (document) {
        logger.info(`Document already exists: ${url}, status: ${document.processingStatus}`);

        // If completed, just increment reference count and return
        if (document.processingStatus === 'completed') {
          await document.increment('timesReferenced');
          logger.info(`Reusing completed document (referenced ${document.timesReferenced + 1} times)`);
          return document;
        }

        // If currently processing, wait for completion
        if (document.processingStatus === 'processing') {
          return await this.waitForProcessing(document.id);
        }

        // If failed, retry
        if (document.processingStatus === 'failed') {
          logger.info('Retrying failed document');
          await document.update({ processingStatus: 'processing' });
        }
      } else {
        // STEP 2: Create new document record
        document = await this.models.Document.create({
          url,
          title: metadata.title || this.extractTitleFromUrl(url),
          organization: metadata.organization,
          publishedAt: metadata.publishedAt,
          processingStatus: 'processing',
          metadata: metadata
        });
      }

      // STEP 3: Acquire processing lock
      if (this.processingLocks.has(document.id)) {
        return await this.waitForProcessing(document.id);
      }
      this.processingLocks.set(document.id, true);

      try {
        // STEP 4: Fetch PDF
        logger.info(`Fetching PDF: ${url}`);
        const pdfBuffer = await this.fetchPDF(url);

        // STEP 5: Generate content hash
        const contentHash = crypto.createHash('sha256')
          .update(pdfBuffer)
          .digest('hex');

        // STEP 6: Check for content duplicates (same PDF, different URL)
        const duplicate = await this.models.Document.findOne({
          where: {
            contentHash,
            id: { [Op.ne]: document.id },
            processingStatus: 'completed'
          }
        });

        if (duplicate) {
          logger.info(`Duplicate content detected! Original: ${duplicate.url}`);
          await document.update({
            processingStatus: 'duplicate',
            duplicateOf: duplicate.id,
            contentHash
          });
          await duplicate.increment('timesReferenced');
          return duplicate; // Return the original instead
        }

        // STEP 7: Convert PDF to markdown
        logger.info('Converting PDF to markdown...');
        const markdown = await this.convertToMarkdown(pdfBuffer);

        // STEP 8: AI analysis - extract topics and generate baseline summary
        logger.info('Analyzing content with AI...');
        const analysis = await this.analyzeContent(markdown, metadata);

        // STEP 9: Generate HTML page
        logger.info('Generating HTML page...');
        const htmlPath = await this.generateHTMLPage(markdown, {
          ...metadata,
          summary: analysis.summary,
          topics: analysis.topics
        });

        // STEP 10: Update document with all processed data
        await document.update({
          contentHash,
          markdownContent: markdown,
          htmlPath,
          baselineSummary: analysis.summary,
          extractedTopics: analysis.topics,
          extractedEntities: analysis.entities,
          processedAt: new Date(),
          processingStatus: 'completed'
        });

        logger.info(`Document processed successfully: ${document.id}`);
        return document;

      } catch (error) {
        logger.error(`Error processing document: ${error.message}`);
        await document.update({ processingStatus: 'failed' });
        throw error;
      } finally {
        // Release lock
        this.processingLocks.delete(document.id);
      }

    } catch (error) {
      logger.error(`Document processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch PDF from URL
   */
  async fetchPDF(url) {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FranciscomoneyBot/1.0)'
      }
    });

    return Buffer.from(response.data);
  }

  /**
   * Convert PDF to markdown
   */
  async convertToMarkdown(pdfBuffer) {
    const pdfData = await pdfParse(pdfBuffer);
    
    // Clean up the text
    let markdown = pdfData.text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Add metadata header
    const header = `# ${pdfData.info?.Title || 'Document'}\n\n`;
    if (pdfData.info?.Author) {
      markdown = `${header}**Author:** ${pdfData.info.Author}\n\n${markdown}`;
    } else {
      markdown = `${header}${markdown}`;
    }

    return markdown;
  }

  /**
   * Analyze content with AI to extract topics, entities, and summary
   */
  async analyzeContent(markdown, metadata) {
    const prompt = `Analyze this document and extract key information:

Title: ${metadata.title || 'Unknown'}
Organization: ${metadata.organization || 'Unknown'}

First 2000 characters of content:
${markdown.substring(0, 2000)}

Return ONLY valid JSON with:
{
  "summary": "2-3 sentence executive summary",
  "topics": ["topic1", "topic2", "topic3"],
  "entities": {
    "companies": ["Company A", "Company B"],
    "technologies": ["Tech A", "Tech B"],
    "locations": ["Location A"],
    "people": ["Person A"]
  }
}`;

    try {
      const response = await cerebrasService.generateCompletion(prompt, {
        temperature: 0.2,
        max_tokens: 500
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      logger.error('Error in AI analysis:', error);
      // Return defaults
      return {
        summary: markdown.substring(0, 300) + '...',
        topics: [],
        entities: {}
      };
    }
  }

  /**
   * Generate static HTML page for document
   */
  async generateHTMLPage(markdown, metadata) {
    const slug = this.generateSlug(metadata.title);
    const year = metadata.publishedAt ? new Date(metadata.publishedAt).getFullYear() : new Date().getFullYear();
    const htmlPath = `/reports/${metadata.organization || 'general'}/${year}-${slug}.html`;

    // TODO: Implement actual HTML generation and saving
    // For now, just return the path
    logger.info(`HTML path would be: ${htmlPath}`);

    return htmlPath;
  }

  /**
   * Wait for a document that's currently being processed
   */
  async waitForProcessing(documentId, maxWaitMs = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const doc = await this.models.Document.findByPk(documentId);

      if (!doc) {
        throw new Error('Document disappeared during processing');
      }

      if (doc.processingStatus === 'completed') {
        return doc;
      }

      if (doc.processingStatus === 'failed') {
        throw new Error('Document processing failed');
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Timeout waiting for document processing');
  }

  /**
   * Helper: Extract title from URL
   */
  extractTitleFromUrl(url) {
    const filename = url.split('/').pop();
    return filename.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
  }

  /**
   * Helper: Generate URL slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  /**
   * Find existing documents relevant to keywords
   */
  async findRelevantDocuments(keywords, minScore = 0.7) {
    const allDocs = await this.models.Document.findAll({
      where: { processingStatus: 'completed' }
    });

    if (allDocs.length === 0) {
      return [];
    }

    // Use AI to score relevance
    const docList = allDocs.slice(0, 100).map((doc, i) =>
      `${i}. ${doc.title} | Topics: ${doc.extractedTopics.join(', ')} | Org: ${doc.organization}`
    ).join('\n');

    const prompt = `Given keywords: ${keywords.join(', ')}

Rate these documents for relevance (0-1 scale):

${docList}

Return ONLY JSON array:
[{"index": 0, "score": 0.95}, {"index": 1, "score": 0.82}, ...]`;

    try {
      const response = await cerebrasService.generateCompletion(prompt, {
        temperature: 0.1,
        max_tokens: 1000
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        // Fallback: simple topic matching
        return this.fallbackTopicMatching(allDocs, keywords, minScore);
      }

      const scores = JSON.parse(jsonMatch[0]);

      return allDocs
        .map((doc, index) => {
          const scoreObj = scores.find(s => s.index === index);
          return {
            document: doc,
            relevanceScore: scoreObj ? scoreObj.score : 0
          };
        })
        .filter(item => item.relevanceScore >= minScore)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .map(item => ({
          ...item.document.toJSON(),
          relevanceScore: item.relevanceScore
        }));

    } catch (error) {
      logger.error('Error scoring documents:', error);
      return this.fallbackTopicMatching(allDocs, keywords, minScore);
    }
  }

  /**
   * Fallback: Simple keyword/topic matching
   */
  fallbackTopicMatching(documents, keywords, minScore) {
    return documents
      .map(doc => {
        const docText = `${doc.title} ${doc.extractedTopics.join(' ')}`.toLowerCase();
        const matchCount = keywords.filter(kw =>
          docText.includes(kw.toLowerCase())
        ).length;
        const score = matchCount / keywords.length;

        return {
          ...doc.toJSON(),
          relevanceScore: score
        };
      })
      .filter(doc => doc.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

module.exports = DocumentProcessorQueue;

require('dotenv').config();
const { Source, Document, TopicArea } = require('../models');
const DocumentProcessor = require('../services/documentProcessor');
const CerebrasService = require('../services/cerebras');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class SourceProcessor {
  constructor() {
    this.documentProcessor = new DocumentProcessor();
    this.cerebrasService = new CerebrasService();
    this.processedCount = 0;
  }

  async processAllSources() {
    try {
      logger.info('Starting source processing');
      
      const sources = await Source.findAll({
        where: { isActive: true },
        include: [{ model: TopicArea, as: 'topicArea' }]
      });

      logger.info(`Found ${sources.length} active sources to process`);

      for (const source of sources) {
        await this.processSource(source);
      }

      logger.info(`Source processing completed. Processed ${this.processedCount} documents`);
      return { processedCount: this.processedCount };

    } catch (error) {
      logger.error('Error in source processing:', error);
      throw error;
    }
  }

  async processSource(source) {
    try {
      logger.info(`Processing source: ${source.name} (${source.url})`);
      
      // Fetch the document content
      const fetchedData = await this.documentProcessor.fetchDocument(source);
      
      if (!fetchedData) {
        logger.warn(`No data fetched from source: ${source.name}`);
        return;
      }

      // Check if document already exists
      const existingDoc = await Document.findOne({
        where: { 
          sourceId: source.id,
          title: fetchedData.title
        }
      });

      if (existingDoc) {
        logger.info(`Document already exists: ${fetchedData.title}`);
        return;
      }

      // Generate document code
      const docCount = await Document.count();
      const code = `A${String(docCount + 1).padStart(3, '0')}`;

      // Create slug from title
      const slug = fetchedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Save document
      const document = await Document.create({
        id: uuidv4(),
        sourceId: source.id,
        title: fetchedData.title,
        slug: slug,
        code: code,
        pdfUrl: source.url,
        markdownContent: fetchedData.content,
        publishedAt: fetchedData.publishedAt || new Date(),
        processedAt: null // Will be set after AI analysis
      });

      logger.info(`Created document: ${document.title} (${document.code})`);

      // Analyze with Cerebras AI
      try {
        if (!process.env.CEREBRAS_API_KEY) {
          logger.warn(`Skipping AI analysis - CEREBRAS_API_KEY not configured`);
          // Still mark as processed without AI analysis
          await document.update({
            processedAt: new Date()
          });
        } else {
          const analysis = await this.cerebrasService.analyzeDocument(
            fetchedData.content,
            source.topicArea?.keywords || []
          );

          // Update document with AI analysis
          await document.update({
            aiAnalysis: analysis,
            processedAt: new Date()
          });

          logger.info(`AI analysis completed for document: ${document.code}`);
        }
        
        this.processedCount++;

      } catch (aiError) {
        logger.error(`AI analysis failed for document ${document.code}:`, aiError);
        // Still count as processed even if AI fails
        await document.update({
          processedAt: new Date()
        });
        this.processedCount++;
      }

    } catch (error) {
      logger.error(`Error processing source ${source.name}:`, error);
      source.lastError = error.message;
      source.lastFetchedAt = new Date();
      await source.save();
    }
  }

  async processSingleSource(sourceId) {
    try {
      const source = await Source.findByPk(sourceId, {
        include: [{ model: TopicArea, as: 'topicArea' }]
      });

      if (!source) {
        throw new Error('Source not found');
      }

      await this.processSource(source);
      return { success: true, processedCount: this.processedCount };

    } catch (error) {
      logger.error('Error processing single source:', error);
      throw error;
    }
  }
}

module.exports = SourceProcessor;
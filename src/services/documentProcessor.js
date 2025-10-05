const axios = require('axios');
const pdfParse = require('pdf-parse');
const TurndownService = require('turndown');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const { Document } = require('../models');
const logger = require('../utils/logger');

class DocumentProcessor {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.turndownService = new TurndownService();
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  async fetchDocument(source) {
    try {
      switch (source.type) {
        case 'pdf':
          return await this.fetchPdf(source.url);
        case 'rss':
          return await this.parseRssFeed(source.url);
        case 'webpage':
          return await this.fetchWebpage(source.url);
        case 'api':
          return await this.fetchApiData(source.url, source.settings);
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }
    } catch (error) {
      console.error(`Error fetching document from ${source.url}:`, error.message);
      throw error;
    }
  }

  async fetchPdf(url) {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    const pdfBuffer = Buffer.from(response.data);
    const pdfData = await pdfParse(pdfBuffer);
    
    return {
      title: pdfData.info.Title || this.extractTitleFromUrl(url),
      author: pdfData.info.Author || null,
      publishedAt: pdfData.info.CreationDate ? new Date(pdfData.info.CreationDate) : null,
      content: pdfData.text,
      rawContent: pdfData.text
    };
  }

  async fetchWebpage(url) {
    const response = await axios.get(url, { timeout: 30000 });
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Remove common non-content elements
    $('script, style, nav, footer, aside, .advertisement, .ads, .sidebar').remove();
    
    // Extract title
    const title = $('title').text() || this.extractTitleFromUrl(url);
    
    // Extract main content (try common content selectors)
    let content = '';
    const contentSelectors = ['main', 'article', '.content', '#content', '.post', '.entry'];
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }
    
    // Fallback to body content if no main content found
    if (!content) {
      content = $('body').text();
    }
    
    // Extract published date
    let publishedAt = null;
    const dateSelectors = ['meta[property="article:published_time"]', 'time', '.published-date', '.date'];
    for (const selector of dateSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const dateValue = element.attr('datetime') || element.attr('content') || element.text();
        if (dateValue) {
          publishedAt = new Date(dateValue);
          break;
        }
      }
    }
    
    return {
      title: title,
      author: this.extractAuthor($),
      publishedAt: publishedAt,
      content: this.extractTextFromHtml(html),
      rawContent: html
    };
  }

  async fetchApiData(url, settings = {}) {
    const headers = settings.headers || {};
    const response = await axios.get(url, { headers, timeout: 30000 });
    
    return {
      title: settings.titleField ? response.data[settings.titleField] : 'API Document',
      author: settings.authorField ? response.data[settings.authorField] : null,
      publishedAt: settings.dateField ? new Date(response.data[settings.dateField]) : new Date(),
      content: JSON.stringify(response.data, null, 2),
      rawContent: response.data
    };
  }

  async parseRssFeed(url) {
    const response = await axios.get(url, { timeout: 30000 });
    const $ = cheerio.load(response.data, { xmlMode: true });
    
    const entries = [];
    $('item, entry').each((i, item) => {
      const $item = $(item);
      entries.push({
        title: $item.find('title').text(),
        author: $item.find('author').text() || $item.find('creator').text(),
        publishedAt: new Date($item.find('pubDate').text() || $item.find('published').text()),
        content: $item.find('description').text() || $item.find('content').text(),
        link: $item.find('link').text()
      });
    });
    
    return entries;
  }

  extractTextFromHtml(html) {
    const $ = cheerio.load(html);
    
    // Remove non-content elements
    $('script, style, nav, footer, aside, .advertisement, .ads, .sidebar').remove();
    
    // Convert to markdown
    return this.turndownService.turndown($.html());
  }

  extractTitleFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.split('/').pop();
      return path ? decodeURIComponent(path).replace(/\.[^/.]+$/, "") : 'Untitled Document';
    } catch (error) {
      return 'Untitled Document';
    }
  }

  extractAuthor($) {
    const authorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      '.author',
      '.byline',
      '.post-author'
    ];
    
    for (const selector of authorSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const author = element.attr('content') || element.text();
        if (author) return author.trim();
      }
    }
    
    return null;
  }

  async processDocument(source) {
    try {
      // Check cache first
      const cacheKey = `${source.type}:${source.url}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`Using cached document for ${source.url}`);
        return cached.data;
      }
      
      let documents = [];
      
      if (source.type === 'rss') {
        const feedEntries = await this.fetchDocument(source);
        for (const entry of feedEntries) {
          const document = await this.createDocumentRecord(source.id, {
            title: entry.title,
            content: entry.content,
            publishedAt: entry.publishedAt
          });
          documents.push(document);
        }
      } else {
        const fetchedData = await this.fetchDocument(source);
        const document = await this.createDocumentRecord(source.id, fetchedData);
        documents.push(document);
      }
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: documents,
        timestamp: Date.now()
      });
      
      return documents;
    } catch (error) {
      console.error(`Error processing document from source ${source.name}:`, error.message);
      throw error;
    }
  }

  async createDocumentRecord(sourceId, data) {
    const slug = data.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    
    const document = await Document.create({
      id: uuidv4(),
      sourceId: sourceId,
      title: data.title,
      slug: slug,
      markdownContent: data.content,
      publishedAt: data.publishedAt,
      processedAt: new Date()
    });
    
    return document;
  }
}

module.exports = DocumentProcessor;
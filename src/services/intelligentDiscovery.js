const axios = require('axios');
const cheerio = require('cheerio');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const cerebrasService = require('./cerebras');

/**
 * Intelligent PDF Discovery Service
 * Uses Cerebras AI to automatically find and rank PDFs from top organizations
 */
class IntelligentDiscoveryService {
  constructor(models) {
    this.models = models;
    this.cerebrasApiKey = process.env.CEREBRAS_API_KEY;
    
    // Common research organization patterns
    this.organizationPatterns = {
      thinkTanks: [
        { name: 'Brookings Institution', domain: 'brookings.edu', pdfPath: '/research/' },
        { name: 'CSIS', domain: 'csis.org', pdfPath: '/analysis/' },
        { name: 'Atlantic Council', domain: 'atlanticcouncil.org', pdfPath: '/in-depth-research-reports/' },
        { name: 'Carnegie Endowment', domain: 'carnegieendowment.org', pdfPath: '/research/' },
        { name: 'Council on Foreign Relations', domain: 'cfr.org', pdfPath: '/reports/' },
        { name: 'RAND Corporation', domain: 'rand.org', pdfPath: '/pubs/' },
        { name: 'Heritage Foundation', domain: 'heritage.org', pdfPath: '/research/' },
        { name: 'American Enterprise Institute', domain: 'aei.org', pdfPath: '/research-products/' },
        { name: 'Center for American Progress', domain: 'americanprogress.org', pdfPath: '/issues/' },
        { name: 'Hoover Institution', domain: 'hoover.org', pdfPath: '/research/' }
      ],
      international: [
        { name: 'European Council on Foreign Relations', domain: 'ecfr.eu', pdfPath: '/publications/' },
        { name: 'Chatham House', domain: 'chathamhouse.org', pdfPath: '/publications/' },
        { name: 'International Crisis Group', domain: 'crisisgroup.org', pdfPath: '/reports/' },
        { name: 'Stockholm International Peace Research Institute', domain: 'sipri.org', pdfPath: '/publications/' }
      ],
      academic: [
        { name: 'MIT Center for International Studies', domain: 'cis.mit.edu', pdfPath: '/publications/' },
        { name: 'Harvard Kennedy School', domain: 'hks.harvard.edu', pdfPath: '/research-insights/' },
        { name: 'Stanford CISAC', domain: 'cisac.fsi.stanford.edu', pdfPath: '/publications/' }
      ]
    };
  }

  /**
   * Main automation function: Discover and process PDFs for a topic area
   */
  async automateDiscovery(topicAreaId, options = {}) {
    const {
      maxOrganizations = 20,
      daysBack = 7,
      minRelevanceScore = 0.7
    } = options;

    try {
      logger.info(`Starting automated discovery for topic area: ${topicAreaId}`);

      // Step 1: Get topic area details
      const topicArea = await this.models.TopicArea.findByPk(topicAreaId);
      if (!topicArea) {
        throw new Error(`Topic area ${topicAreaId} not found`);
      }

      logger.info(`Topic area: ${topicArea.name}`);

      // Step 2: Use Cerebras to identify relevant organizations for this topic
      const relevantOrgs = await this.findRelevantOrganizations(topicArea);
      logger.info(`Found ${relevantOrgs.length} potentially relevant organizations`);

      // Step 3: For each organization, find recent PDFs
      const allDiscoveredPDFs = [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      for (const org of relevantOrgs.slice(0, maxOrganizations)) {
        try {
          const pdfs = await this.discoverPDFsFromOrganization(org, cutoffDate, topicArea);
          allDiscoveredPDFs.push(...pdfs);
          logger.info(`Found ${pdfs.length} PDFs from ${org.name}`);
        } catch (error) {
          logger.error(`Error discovering PDFs from ${org.name}:`, error.message);
        }
      }

      // Step 4: Rank PDFs by relevance using Cerebras
      const rankedPDFs = await this.rankPDFsByRelevance(allDiscoveredPDFs, topicArea);

      // Step 5: Filter by relevance score
      const qualifiedPDFs = rankedPDFs.filter(pdf => pdf.relevanceScore >= minRelevanceScore);

      // Step 6: Create sources in database for top PDFs
      const createdSources = [];
      for (const pdf of qualifiedPDFs.slice(0, 20)) {
        const source = await this.createSource(topicAreaId, pdf);
        createdSources.push(source);
      }

      logger.info(`Automation complete. Created ${createdSources.length} new sources`);

      return {
        topicArea: topicArea.name,
        organizationsSearched: relevantOrgs.length,
        pdfsDiscovered: allDiscoveredPDFs.length,
        pdfsQualified: qualifiedPDFs.length,
        sourcesCreated: createdSources.length,
        sources: createdSources
      };

    } catch (error) {
      logger.error('Error in automated discovery:', error);
      throw error;
    }
  }

  /**
   * Use Cerebras AI to find organizations relevant to a topic
   */
  async findRelevantOrganizations(topicArea) {
    const prompt = `Given the topic area "${topicArea.name}" with description: "${topicArea.description || ''}" and keywords: ${topicArea.keywords?.join(', ') || 'none'},

Please analyze which of the following organizations would be MOST likely to publish relevant research reports or policy papers on this topic.

Rate each organization from 0-10 for relevance, and return ONLY a JSON array with the top organizations.

Organizations to consider:
${this.getAllOrganizations().map(org => `- ${org.name} (${org.domain})`).join('\n')}

Return format:
[
  {"name": "Organization Name", "domain": "domain.com", "relevanceScore": 9, "reasoning": "brief reason"},
  ...
]

Return ONLY valid JSON, no other text.`;

    try {
      const response = await cerebrasService.generateCompletion(prompt, {
        temperature: 0.3,
        max_tokens: 2000
      });

      // Parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in Cerebras response');
      }

      const organizations = JSON.parse(jsonMatch[0]);

      // Merge with our organization patterns to get full config
      return organizations
        .filter(org => org.relevanceScore >= 6)
        .map(org => {
          const fullOrg = this.findOrganizationByName(org.name);
          return {
            ...fullOrg,
            relevanceScore: org.relevanceScore,
            reasoning: org.reasoning
          };
        })
        .filter(org => org.domain) // Only keep orgs we have config for
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

    } catch (error) {
      logger.error('Error using Cerebras for organization selection:', error);
      // Fallback: return all organizations
      return this.getAllOrganizations().map(org => ({ ...org, relevanceScore: 5 }));
    }
  }

  /**
   * Discover PDFs from a specific organization
   */
  async discoverPDFsFromOrganization(organization, cutoffDate, topicArea) {
    const discovered = [];

    try {
      // Build search URL
      const searchUrl = `https://${organization.domain}${organization.pdfPath}`;
      
      logger.info(`Searching ${searchUrl} for PDFs...`);

      // Fetch organization's publication page
      const response = await axios.get(searchUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FranciscomoneyBot/1.0)'
        }
      });

      const $ = cheerio.load(response.data);

      // Find all PDF links
      const pdfLinks = [];
      $('a[href$=".pdf"], a[href*=".pdf"]').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `https://${organization.domain}${href}`;
          const title = $(elem).text().trim() || $(elem).attr('title') || 'Untitled';
          
          pdfLinks.push({
            url: fullUrl,
            title: title,
            organization: organization.name,
            discoveredAt: new Date()
          });
        }
      });

      logger.info(`Found ${pdfLinks.length} PDF links on ${organization.name}`);

      // Use Cerebras to filter for recent publications and extract metadata
      for (const link of pdfLinks.slice(0, 10)) { // Limit to 10 per org for performance
        try {
          const metadata = await this.extractPDFMetadata(link, topicArea, organization);
          
          // Check if publication date is recent enough
          if (metadata.publishedAt && metadata.publishedAt >= cutoffDate) {
            discovered.push({
              ...link,
              ...metadata,
              organizationDomain: organization.domain
            });
          }
        } catch (error) {
          logger.error(`Error extracting metadata for ${link.url}:`, error.message);
        }
      }

      return discovered;

    } catch (error) {
      logger.error(`Error discovering PDFs from ${organization.name}:`, error.message);
      return [];
    }
  }

  /**
   * Use Cerebras to extract PDF metadata from context
   */
  async extractPDFMetadata(pdfLink, topicArea, organization) {
    const prompt = `Analyze this PDF link and extract metadata:

URL: ${pdfLink.url}
Title: ${pdfLink.title}
Organization: ${organization.name}

Based on the URL and title, provide:
1. Estimated publication date (analyze URL patterns like /2025/ or /202510/ for dates)
2. Brief description of what this document is likely about
3. Relevance to the topic "${topicArea.name}" (0-10)

Return ONLY valid JSON:
{
  "publishedAt": "2025-10-01" or null if can't determine,
  "description": "brief description",
  "topicRelevance": 8
}`;

    try {
      const response = await cerebrasService.generateCompletion(prompt, {
        temperature: 0.2,
        max_tokens: 300
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in metadata response');
      }

      const metadata = JSON.parse(jsonMatch[0]);
      
      return {
        publishedAt: metadata.publishedAt ? new Date(metadata.publishedAt) : new Date(),
        description: metadata.description,
        topicRelevance: metadata.topicRelevance
      };

    } catch (error) {
      logger.error('Error extracting PDF metadata:', error);
      // Return defaults
      return {
        publishedAt: new Date(),
        description: pdfLink.title,
        topicRelevance: 5
      };
    }
  }

  /**
   * Rank PDFs by relevance using Cerebras
   */
  async rankPDFsByRelevance(pdfs, topicArea) {
    if (pdfs.length === 0) return [];

    const prompt = `Given the topic area "${topicArea.name}" with keywords: ${topicArea.keywords?.join(', ') || 'none'},

Rank the following documents by relevance (0-1 scale):

${pdfs.slice(0, 50).map((pdf, i) => `${i + 1}. ${pdf.title} - ${pdf.organization} - ${pdf.description || ''}`).join('\n')}

Return ONLY a JSON array with relevance scores:
[{"index": 0, "score": 0.95}, {"index": 1, "score": 0.82}, ...]`;

    try {
      const response = await cerebrasService.generateCompletion(prompt, {
        temperature: 0.1,
        max_tokens: 1000
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        // Fallback: use topicRelevance if available
        return pdfs.map(pdf => ({
          ...pdf,
          relevanceScore: (pdf.topicRelevance || 5) / 10
        }));
      }

      const rankings = JSON.parse(jsonMatch[0]);

      return pdfs.map((pdf, index) => {
        const ranking = rankings.find(r => r.index === index);
        return {
          ...pdf,
          relevanceScore: ranking?.score || 0.5
        };
      }).sort((a, b) => b.relevanceScore - a.relevanceScore);

    } catch (error) {
      logger.error('Error ranking PDFs:', error);
      return pdfs.map(pdf => ({
        ...pdf,
        relevanceScore: (pdf.topicRelevance || 5) / 10
      }));
    }
  }

  /**
   * Create a source in the database
   */
  async createSource(topicAreaId, pdfData) {
    try {
      // Check if source already exists
      const existing = await this.models.Source.findOne({
        where: { url: pdfData.url }
      });

      if (existing) {
        logger.info(`Source already exists: ${pdfData.url}`);
        return existing;
      }

      const source = await this.models.Source.create({
        topicAreaId: topicAreaId,
        name: `${pdfData.organization} - ${pdfData.title}`,
        url: pdfData.url,
        type: 'pdf',
        isActive: true,
        settings: {
          discoveredAt: pdfData.discoveredAt,
          publishedAt: pdfData.publishedAt,
          organization: pdfData.organization,
          organizationDomain: pdfData.organizationDomain,
          relevanceScore: pdfData.relevanceScore,
          description: pdfData.description,
          automated: true
        }
      });

      logger.info(`Created source: ${source.name}`);
      return source;

    } catch (error) {
      logger.error('Error creating source:', error);
      throw error;
    }
  }

  /**
   * Helper: Get all organizations
   */
  getAllOrganizations() {
    return [
      ...this.organizationPatterns.thinkTanks,
      ...this.organizationPatterns.international,
      ...this.organizationPatterns.academic
    ];
  }

  /**
   * Helper: Find organization by name
   */
  findOrganizationByName(name) {
    const allOrgs = this.getAllOrganizations();
    return allOrgs.find(org => 
      org.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(org.name.toLowerCase())
    ) || { name, domain: '', pdfPath: '' };
  }
}

module.exports = IntelligentDiscoveryService;

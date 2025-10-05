const axios = require('axios');
const logger = require('../utils/logger');

class CerebrasService {
  constructor() {
    this.apiKey = process.env.CEREBRAS_API_KEY;
    this.baseUrl = 'https://api.cerebras.ai/v1';
    this.model = 'llama3.1-8b';
    this.rateLimiter = {
      lastRequestTime: 0,
      minInterval: 1000
    };
    this.maxRetries = 3;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey || ''}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async _makeRequest(payload, retries = 0) {
    if (!this.apiKey) {
      throw new Error('CEREBRAS_API_KEY is not configured. Please set it in the admin panel.');
    }
    
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.rateLimiter.lastRequestTime;
      if (timeSinceLastRequest < this.rateLimiter.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.rateLimiter.minInterval - timeSinceLastRequest)
        );
      }

      logger.info('Making Cerebras API request', { 
        model: this.model, 
        promptLength: payload.prompt?.length || payload.messages?.reduce((acc, msg) => acc + msg.content.length, 0) 
      });
      
      this.rateLimiter.lastRequestTime = Date.now();
      const response = await this.client.post('/chat/completions', payload);
      
      logger.info('Cerebras API request successful', { 
        responseLength: response.data.choices[0].message.content.length 
      });
      
      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Cerebras API request failed', { 
        error: error.message, 
        status: error.response?.status,
        retries 
      });
      
      if (retries < this.maxRetries) {
        const delay = Math.pow(2, retries) * 1000;
        logger.info(`Retrying in ${delay}ms`, { retries: retries + 1 });
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._makeRequest(payload, retries + 1);
      }
      
      throw new Error(`Cerebras API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async analyzeDocument(content, topicKeywords = []) {
    if (!content) {
      throw new Error('Document content is required');
    }

    const prompt = `
      Analyze the following document and provide insights in JSON format:
      
      Document content:
      ${content}
      
      Topic keywords: ${topicKeywords.join(', ')}
      
      Please extract and analyze:
      1. Main themes and topics (list)
      2. Key facts and figures (list with specific data from the document)
      3. Overall sentiment (positive, negative, neutral)
      4. Urgency level (low, medium, high)
      5. Relevance score to the provided keywords (0-100)
      6. A brief summary (2-3 sentences) explaining why this document matters
      
      Return only valid JSON in this exact format:
      {
        "themes": ["theme1", "theme2"],
        "facts": ["fact1", "fact2"],
        "sentiment": "neutral",
        "urgency": "medium",
        "relevanceScore": 75,
        "summary": "Brief summary of why this matters"
      }
    `;

    try {
      const response = await this._makeRequest({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a document analysis expert. Return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return JSON.parse(response);
    } catch (error) {
      logger.error('Document analysis failed', { error: error.message });
      return {
        themes: [],
        facts: [],
        sentiment: 'neutral',
        urgency: 'low',
        relevanceScore: 0
      };
    }
  }

  async generateSummary(documents, alertQuery = '') {
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      throw new Error('Documents array is required');
    }

    const documentTexts = documents.map((doc, index) => 
      `[Document ${index + 1}]: ${doc.content || doc}`
    ).join('\n\n');

    const prompt = `
      Create a personalized summary from the following documents based on this query/topic: "${alertQuery}"
      
      Documents:
      ${documentTexts}
      
      Please provide:
      1. An executive summary (2-3 sentences)
      2. Detailed key insights (5-7 bullet points)
      3. Citations for each insight referencing the source document number
      
      Return only valid JSON in this exact format:
      {
        "executiveSummary": "Brief executive summary here",
        "detailedInsights": [
          {
            "text": "Key insight 1",
            "citation": "Document 1"
          },
          {
            "text": "Key insight 2",
            "citation": "Document 3"
          }
        ]
      }
    `;

    try {
      const response = await this._makeRequest({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a summary generation expert. Return only valid JSON with executive summary and detailed insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1500
      });

      return JSON.parse(response);
    } catch (error) {
      logger.error('Summary generation failed', { error: error.message });
      return {
        executiveSummary: "Unable to generate summary at this time.",
        detailedInsights: []
      };
    }
  }

  async scoreRelevance(content, keywords) {
    if (!content || !keywords || !Array.isArray(keywords)) {
      throw new Error('Content and keywords array are required');
    }

    const prompt = `
      Score the relevance of the following document to these keywords: ${keywords.join(', ')}
      
      Document:
      ${content}
      
      Provide a relevance score from 0-100 where:
      - 0 = completely irrelevant
      - 50 = moderately relevant
      - 100 = highly relevant
      
      Return only a single number as the relevance score.
    `;

    try {
      const response = await this._makeRequest({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a relevance scoring expert. Return only a number from 0-100."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      const score = parseInt(response.trim(), 10);
      return isNaN(score) ? 0 : Math.max(0, Math.min(100, score));
    } catch (error) {
      logger.error('Relevance scoring failed', { error: error.message });
      return 0;
    }
  }

  async extractKeyInsights(content) {
    if (!content) {
      throw new Error('Content is required');
    }

    const prompt = `
      Extract key insights from the following document as bullet points:
      
      Document:
      ${content}
      
      Please provide 5-10 key insights in bullet point format.
      
      Return only valid JSON in this exact format:
      {
        "insights": [
          "Key insight 1",
          "Key insight 2",
          "Key insight 3"
        ]
      }
    `;

    try {
      const response = await this._makeRequest({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an insights extraction expert. Return only valid JSON with insights array."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const result = JSON.parse(response);
      return result.insights || [];
    } catch (error) {
      logger.error('Key insights extraction failed', { error: error.message });
      return [];
    }
  }

  async personalizeDocument(content, userKeywords, existingAnalysis) {
    if (!content || !userKeywords) {
      throw new Error('Content and user keywords are required');
    }

    const prompt = `
      Based on the user's specific interests (${userKeywords}), create a personalized analysis of this document.
      
      Existing document analysis:
      ${JSON.stringify(existingAnalysis, null, 2)}
      
      Document content excerpt:
      ${content.substring(0, 3000)}...
      
      Create a personalized summary that:
      1. Focuses on aspects most relevant to the user's keywords: ${userKeywords}
      2. Highlights why this document matters for their specific interests
      3. Extracts facts specifically related to their topics
      
      Return only valid JSON in this exact format:
      {
        "personalizedSummary": "A 2-3 sentence summary tailored to their interests",
        "relevantFacts": ["fact 1 related to their keywords", "fact 2", "fact 3"],
        "relevanceScore": 85
      }
    `;

    try {
      const response = await this._makeRequest({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a personalization expert. Create summaries tailored to user interests. Return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 800
      });

      const result = JSON.parse(response);
      
      // Merge with existing analysis
      return {
        summary: result.personalizedSummary || existingAnalysis.summary,
        facts: result.relevantFacts || existingAnalysis.facts,
        relevanceScore: result.relevanceScore || existingAnalysis.relevanceScore
      };
      
    } catch (error) {
      logger.error('Document personalization failed', { error: error.message });
      return existingAnalysis; // Fallback to original analysis
    }
  }
}

module.exports = CerebrasService;
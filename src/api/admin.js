const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { User, Alert, TopicArea, Source, EmailLog, Sponsor, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Middleware to check admin access
router.use((req, res, next) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Admin access required' });
  }
  next();
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, activeAlerts, emailsSent, documentsProcessed] = await Promise.all([
      User.count(),
      Alert.count({ where: { isActive: true } }),
      EmailLog.count(),
      0 // Document model removed
    ]);

    res.json({
      totalUsers,
      activeAlerts,
      emailsSent,
      documentsProcessed
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Topic Areas CRUD
router.get('/topics', async (req, res) => {
  try {
    const topics = await TopicArea.findAll({
      include: [{ model: Source, as: 'sources' }]
    });
    res.json(topics);
  } catch (error) {
    logger.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

router.post('/topics', async (req, res) => {
  try {
    const { name, description, keywords } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const topic = await TopicArea.create({
      name,
      slug,
      description,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : []
    });

    res.status(201).json(topic);
  } catch (error) {
    logger.error('Error creating topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

router.put('/topics/:id', async (req, res) => {
  try {
    const topic = await TopicArea.findByPk(req.params.id);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    await topic.update(req.body);
    res.json(topic);
  } catch (error) {
    logger.error('Error updating topic:', error);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

router.delete('/topics/:id', async (req, res) => {
  try {
    const deleted = await TopicArea.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

// Sources CRUD
router.get('/sources', async (req, res) => {
  try {
    const sources = await Source.findAll({
      include: [{ model: TopicArea, as: 'topicArea' }]
    });
    res.json(sources);
  } catch (error) {
    logger.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

router.post('/sources', async (req, res) => {
  try {
    const source = await Source.create(req.body);
    res.status(201).json(source);
  } catch (error) {
    logger.error('Error creating source:', error);
    res.status(500).json({ error: 'Failed to create source' });
  }
});

router.put('/sources/:id', async (req, res) => {
  try {
    const source = await Source.findByPk(req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    await source.update(req.body);
    res.json(source);
  } catch (error) {
    logger.error('Error updating source:', error);
    res.status(500).json({ error: 'Failed to update source' });
  }
});

router.delete('/sources/:id', async (req, res) => {
  try {
    const deleted = await Source.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
      return res.status(404).json({ error: 'Source not found' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting source:', error);
    res.status(500).json({ error: 'Failed to delete source' });
  }
});

// Sponsors CRUD
router.get('/sponsors', async (req, res) => {
  try {
    const sponsors = await Sponsor.findAll({
      include: [{ model: TopicArea, as: 'topicAreas' }]
    });
    res.json(sponsors);
  } catch (error) {
    logger.error('Error fetching sponsors:', error);
    res.status(500).json({ error: 'Failed to fetch sponsors' });
  }
});

router.post('/sponsors', async (req, res) => {
  try {
    const { topicAreas, ...sponsorData } = req.body;
    const sponsor = await Sponsor.create(sponsorData);

    if (topicAreas && topicAreas.length > 0) {
      await sponsor.setTopicAreas(topicAreas);
    }

    res.status(201).json(sponsor);
  } catch (error) {
    logger.error('Error creating sponsor:', error);
    res.status(500).json({ error: 'Failed to create sponsor' });
  }
});

router.put('/sponsors/:id', async (req, res) => {
  try {
    const sponsor = await Sponsor.findByPk(req.params.id);
    if (!sponsor) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }

    const { topicAreas, ...sponsorData } = req.body;
    await sponsor.update(sponsorData);

    if (topicAreas) {
      await sponsor.setTopicAreas(topicAreas);
    }

    res.json(sponsor);
  } catch (error) {
    logger.error('Error updating sponsor:', error);
    res.status(500).json({ error: 'Failed to update sponsor' });
  }
});

router.delete('/sponsors/:id', async (req, res) => {
  try {
    const deleted = await Sponsor.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting sponsor:', error);
    res.status(500).json({ error: 'Failed to delete sponsor' });
  }
});

// API Configuration - UPDATED to support both Cerebras and Exa API keys
router.get('/api-config', async (req, res) => {
  try {
    const cerebras_api_key = process.env.CEREBRAS_API_KEY || '';
    const exa_api_key = process.env.EXA_API_KEY || '';

    // Return keys for the form
    res.json({
      cerebras_api_key: cerebras_api_key,
      exa_api_key: exa_api_key,
      has_cerebras: !!cerebras_api_key,
      has_exa: !!exa_api_key
    });
  } catch (error) {
    logger.error('Error fetching API config:', error);
    res.status(500).json({ error: 'Failed to fetch API configuration' });
  }
});

router.put('/api-config', async (req, res) => {
  try {
    const { cerebras_api_key, exa_api_key } = req.body;

    if (!cerebras_api_key && !exa_api_key) {
      return res.status(400).json({ error: 'At least one API key required' });
    }

    // Update .env file
    const envPath = path.join(__dirname, '..', '..', '.env');
    let envContent = await fs.readFile(envPath, 'utf-8');

    // Update Cerebras key
    if (cerebras_api_key) {
      if (envContent.includes('CEREBRAS_API_KEY=')) {
        envContent = envContent.replace(/CEREBRAS_API_KEY=.*/g, `CEREBRAS_API_KEY=${cerebras_api_key}`);
      } else {
        envContent += `\nCEREBRAS_API_KEY=${cerebras_api_key}`;
      }
      process.env.CEREBRAS_API_KEY = cerebras_api_key;
    }

    // Update Exa key
    if (exa_api_key) {
      if (envContent.includes('EXA_API_KEY=')) {
        envContent = envContent.replace(/EXA_API_KEY=.*/g, `EXA_API_KEY=${exa_api_key}`);
      } else {
        envContent += `\nEXA_API_KEY=${exa_api_key}`;
      }
      process.env.EXA_API_KEY = exa_api_key;
    }

    await fs.writeFile(envPath, envContent);

    res.json({ success: true, message: 'API keys updated successfully' });
  } catch (error) {
    logger.error('Error updating API config:', error);
    res.status(500).json({ error: 'Failed to update API configuration' });
  }
});

// Test API connection
router.get('/api-test', async (req, res) => {
  try {
    const hasKey = !!process.env.CEREBRAS_API_KEY;

    if (!hasKey) {
      return res.json({ status: 'inactive', message: 'No API key configured' });
    }

    // TODO: Actually test the Cerebras API connection
    res.json({ status: 'active', message: 'API key configured' });
  } catch (error) {
    logger.error('Error testing API:', error);
    res.status(500).json({ error: 'Failed to test API' });
  }
});

// Users management
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'createdAt']
    });

    res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.email.split('@')[0],
      alertsCount: 0,
      interestAreas: [],
      isActive: true,
      createdAt: u.createdAt
    })));
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get documents for official tab
router.get('/documents', async (req, res) => {
  try {
    const { topicId } = req.query;

    const whereClause = {};
    const includeClause = [{
      model: Source,
      as: 'source',
      include: [{
        model: TopicArea,
        as: 'topicArea',
        where: topicId ? { id: topicId } : undefined
      }]
    }];

    const documents = await Document.findAll({
      where: whereClause,
      include: includeClause,
      order: [['processedAt', 'DESC'], ['createdAt', 'DESC']],
      limit: 50
    });

    const formattedDocs = documents.map((doc, index) => {
      // Generate code if not exists
      if (!doc.code) {
        doc.code = `A${String(index + 1).padStart(3, '0')}`;
      }

      return {
        id: doc.id,
        code: doc.code,
        title: doc.title,
        summary: doc.aiAnalysis?.summary || null,
        sourceName: doc.source?.name || 'Unknown',
        topicName: doc.source?.topicArea?.name || 'Unknown',
        processedAt: doc.processedAt,
        originalUrl: doc.pdfUrl || null
      };
    });

    res.json(formattedDocs);
  } catch (error) {
    logger.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Process documents from sources
router.post('/process-sources', async (req, res) => {
  try {
    const SourceProcessor = require('../workers/sourceProcessor');
    const processor = new SourceProcessor();

    const result = await processor.processAllSources();
    res.json({
      success: true,
      message: `Processed ${result.processedCount} documents`,
      processedCount: result.processedCount
    });
  } catch (error) {
    logger.error('Error processing sources:', error);
    res.status(500).json({ error: 'Failed to process sources' });
  }
});

// Process single source
router.post('/sources/:id/process', async (req, res) => {
  try {
    const SourceProcessor = require('../workers/sourceProcessor');
    const processor = new SourceProcessor();

    const result = await processor.processSingleSource(req.params.id);
    res.json({
      success: true,
      message: 'Source processed successfully',
      processedCount: result.processedCount
    });
  } catch (error) {
    logger.error('Error processing source:', error);
    res.status(500).json({ error: 'Failed to process source' });
  }
});

// Delete document
router.delete('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await document.destroy();

    logger.info(`Document deleted: ${document.code} - ${document.title}`);

    res.json({
      success: true,
      message: `Document ${document.code} deleted successfully`
    });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;

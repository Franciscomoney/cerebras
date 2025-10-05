// Add to your routes file (e.g., routes/api.js)

const ExaDiscoveryService = require('../services/exaDiscovery');

/**
 * POST /api/discover/exa
 * Discover PDFs using Exa.ai semantic search
 */
router.post('/discover/exa', async (req, res) => {
  try {
    const { topicAreaId, options } = req.body;

    if (!topicAreaId) {
      return res.status(400).json({ error: 'topicAreaId is required' });
    }

    const exaService = new ExaDiscoveryService(req.app.get('models'));
    const results = await exaService.discoverPDFs(topicAreaId, options);

    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    logger.error('Exa discovery error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/discover/exa/stats
 * Get Exa API usage statistics
 */
router.get('/discover/exa/stats', async (req, res) => {
  try {
    const exaService = new ExaDiscoveryService(req.app.get('models'));
    const stats = exaService.getUsageStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/settings/exa-api-key
 * Update Exa API key (admin only)
 */
router.put('/settings/exa-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required' });
    }

    // Store in settings table
    const [setting, created] = await req.app.get('models').Setting.findOrCreate({
      where: { key: 'EXA_API_KEY' },
      defaults: { value: apiKey }
    });

    if (!created) {
      setting.value = apiKey;
      await setting.save();
    }

    res.json({
      success: true,
      message: 'Exa API key updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/settings/exa-rate-limits
 * Update rate limits (admin only)
 */
router.put('/settings/exa-rate-limits', async (req, res) => {
  try {
    const { searchesPerHour, searchesPerDay, maxResultsPerSearch } = req.body;

    // Store in settings
    const rateLimits = {
      searchesPerHour: searchesPerHour || 50,
      searchesPerDay: searchesPerDay || 200,
      maxResultsPerSearch: maxResultsPerSearch || 10
    };

    const [setting, created] = await req.app.get('models').Setting.findOrCreate({
      where: { key: 'EXA_RATE_LIMITS' },
      defaults: { value: JSON.stringify(rateLimits) }
    });

    if (!created) {
      setting.value = JSON.stringify(rateLimits);
      await setting.save();
    }

    res.json({
      success: true,
      message: 'Rate limits updated successfully',
      rateLimits
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

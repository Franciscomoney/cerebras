const express = require('express');
const router = express.Router();
const exaDiscovery = require('../services/exaDiscovery');

// POST /api/discover/exa - Trigger Exa discovery
router.post('/exa', async (req, res) => {
    try {
        const { topicAreaId, options } = req.body;
        
        if (!topicAreaId) {
            return res.status(400).json({ 
                success: false, 
                error: 'topicAreaId is required' 
            });
        }

        const result = await exaDiscovery.discoverPDFs(topicAreaId, options);
        res.json(result);
    } catch (error) {
        console.error('Exa discovery error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// GET /api/discover/usage - Get usage stats
router.get('/usage', async (req, res) => {
    try {
        const usage = exaDiscovery.getUsageStats();
        res.json(usage);
    } catch (error) {
        console.error('Usage stats error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;

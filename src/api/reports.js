const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Reports list endpoint - to be implemented' });
});

router.get('/:slug', async (req, res) => {
  res.json({ message: 'Single report endpoint - to be implemented' });
});

module.exports = router;
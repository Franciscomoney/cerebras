const express = require('express');
const path = require('path');

const app = express();
let cerebrasApiKey = '';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/key', (req, res) => {
  res.json({ key: cerebrasApiKey });
});

app.post('/api/key', (req, res) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'API key is required' });
  }
  cerebrasApiKey = key;
  res.json({ message: 'API key updated successfully' });
});

app.listen(3000, () => {
  console.log('Server started successfully on port 3000');
});
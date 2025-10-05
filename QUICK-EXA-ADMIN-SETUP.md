# Quick Exa Admin Setup

## ✅ Done:
- Added Exa API key input field to admin.html
- Backup created: admin.html.backup-20251003-093520

## 📝 What You See Now:

Go to http://51.178.253.51:3000/admin → API Config tab

You should now see:
- **Cerebras API Key** field (existing)
- **Exa.ai API Key** field (NEW - just added!)

## 🔧 To Make It Work:

The field is there, but the backend doesn't save it yet. You have 2 options:

### Option 1: Manual .env Setup (FASTEST - 30 seconds)

1. SSH to OVH:
```bash
ssh debian@51.178.253.51
```

2. Add your Exa API key to .env:
```bash
cd /home/debian/franciscomoney-intel
echo "EXA_API_KEY=your_exa_key_here" >> .env
```

3. Restart PM2:
```bash
pm2 restart franciscomoney-intel
```

4. Done! The Exa service will now work.

### Option 2: Full Backend Integration (Complete solution)

The backend endpoint needs to be updated to save the Exa API key to the Settings table.

**File to update:** `/home/debian/franciscomoney-intel/src/server.js`

**Find the existing `/api/admin/api-config` endpoint and update it to:**

```javascript
app.put('/api/admin/api-config', async (req, res) => {
  try {
    const { cerebras_api_key, exa_api_key, exa_rate_limits } = req.body;

    // Save Cerebras key to .env (existing code)
    if (cerebras_api_key) {
      // ... existing .env update code ...
    }

    // Save Exa key to Settings table (NEW)
    if (exa_api_key) {
      const [setting, created] = await models.Setting.findOrCreate({
        where: { key: 'EXA_API_KEY' },
        defaults: { value: exa_api_key }
      });

      if (!created) {
        setting.value = exa_api_key;
        await setting.save();
      }
    }

    // Save Exa rate limits (NEW)
    if (exa_rate_limits) {
      const [rateLimitSetting, created] = await models.Setting.findOrCreate({
        where: { key: 'EXA_RATE_LIMITS' },
        defaults: { value: JSON.stringify(exa_rate_limits) }
      });

      if (!created) {
        rateLimitSetting.value = JSON.stringify(exa_rate_limits);
        await rateLimitSetting.save();
      }
    }

    res.json({ success: true, message: 'API configuration updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🎯 Recommended Approach:

**Use Option 1 now** (manual .env) to test Exa immediately, then implement Option 2 later for the full admin interface.

## 📊 Testing Exa Discovery

Once you have the API key configured:

```bash
curl -X POST http://51.178.253.51:3000/api/discover/exa \
  -H "Content-Type: application/json" \
  -d '{
    "topicAreaId": "your-topic-uuid",
    "options": {
      "maxResults": 5,
      "daysBack": 7
    }
  }'
```

You should see:
```json
{
  "success": true,
  "searchQuery": "optimized query here",
  "resultsFound": 25,
  "pdfsFound": 12,
  "sourcesCreated": 5,
  "costEstimate": "0.010"
}
```

## 💡 Current Status Summary:

✅ Admin UI updated (Exa field visible)
✅ Exa service code ready (/src/services/exaDiscovery.js)
✅ API endpoints documented (exa-api-endpoint.js)
⚠️ Backend endpoint needs update to save Exa key to Settings table
⚠️ Or use manual .env method (works immediately!)

## 📁 Files on Server:

- `/home/debian/franciscomoney-intel/src/services/exaDiscovery.js` ✅
- `/home/debian/franciscomoney-intel/EXA_INTEGRATION_GUIDE.md` ✅
- `/home/debian/franciscomoney-intel/EXA_QUICK_START.md` ✅
- `/home/debian/franciscomoney-intel/public/admin.html` ✅ (updated)

All ready to use once you add the API key!

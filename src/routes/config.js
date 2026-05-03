const express = require('express');
const router = express.Router();
const { getConfig, updatePreferences } = require('../controllers/configController');
const { apiKeyAuth } = require('../middleware/auth');

router.get('/', apiKeyAuth, getConfig);
router.put('/preferences/:deviceId', apiKeyAuth, updatePreferences);

module.exports = router;

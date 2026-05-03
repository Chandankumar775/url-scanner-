const express = require('express');
const router = express.Router();
const { scanUrl, getScanHistory, getScanById } = require('../controllers/scanController');
const { apiKeyAuth } = require('../middleware/auth');

router.post('/', apiKeyAuth, scanUrl);
router.get('/history', apiKeyAuth, getScanHistory);
router.get('/:scanId', apiKeyAuth, getScanById);

module.exports = router;

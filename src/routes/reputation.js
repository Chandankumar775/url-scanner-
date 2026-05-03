const express = require('express');
const router = express.Router();
const { getReputation, updateDomainStatus } = require('../controllers/reputationController');
const { apiKeyAuth } = require('../middleware/auth');

router.get('/', apiKeyAuth, getReputation);
router.put('/:domain', apiKeyAuth, updateDomainStatus);

module.exports = router;

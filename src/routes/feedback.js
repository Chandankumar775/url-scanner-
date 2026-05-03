const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedbackStats } = require('../controllers/feedbackController');
const { apiKeyAuth } = require('../middleware/auth');

router.post('/', apiKeyAuth, submitFeedback);
router.get('/stats', apiKeyAuth, getFeedbackStats);

module.exports = router;

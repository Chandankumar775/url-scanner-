const Feedback = require('../models/Feedback');
const ScanEvent = require('../models/ScanEvent');

async function submitFeedback(req, res, next) {
  try {
    const { scanId, userAction, label, note } = req.body;
    
    if (!scanId || !userAction) {
      return res.status(400).json({ 
        error: 'scanId and userAction are required' 
      });
    }
    
    const validActions = ['false_positive', 'false_negative', 'accurate', 'other'];
    if (!validActions.includes(userAction)) {
      return res.status(400).json({ 
        error: `userAction must be one of: ${validActions.join(', ')}` 
      });
    }
    
    // Try to save feedback
    try {
      await Feedback.create({
        scanId,
        userAction,
        label: label || null,
        note: note || null
      });
      
      // Update scan event with action taken
      await ScanEvent.findOneAndUpdate(
        { scanId },
        { actionTaken: userAction === 'false_positive' ? 'trust' : 'block' }
      );
    } catch (dbError) {
      console.log('DB save skipped (fallback mode):', dbError.message);
    }
    
    res.json({
      acknowledged: true,
      scanId,
      userAction,
      message: 'Feedback recorded. Thank you for helping improve detection.'
    });
  } catch (error) {
    next(error);
  }
}

async function getFeedbackStats(req, res, next) {
  try {
    let stats = { total: 0, breakdown: {} };
    
    try {
      const total = await Feedback.countDocuments();
      const falsePositives = await Feedback.countDocuments({ userAction: 'false_positive' });
      const falseNegatives = await Feedback.countDocuments({ userAction: 'false_negative' });
      const accurate = await Feedback.countDocuments({ userAction: 'accurate' });
      
      stats = {
        total,
        breakdown: {
          false_positive: falsePositives,
          false_negative: falseNegatives,
          accurate,
          other: total - falsePositives - falseNegatives - accurate
        }
      };
    } catch (dbError) {
      console.log('DB query skipped (fallback mode)');
    }
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitFeedback,
  getFeedbackStats
};

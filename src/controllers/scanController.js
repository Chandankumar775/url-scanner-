const { analyzeUrl } = require('../services/urlAnalyzer');
const ScanEvent = require('../models/ScanEvent');
const DomainProfile = require('../models/DomainProfile');

async function scanUrl(req, res, next) {
  try {
    const { url, source = 'unknown', locale = 'en' } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Analyze URL
    const result = await analyzeUrl(url, source);
    
    // Try to save to database (non-blocking)
    try {
      await ScanEvent.create({
        scanId: result.scanId,
        source: result.source,
        rawUrl: result.url,
        normalizedUrl: result.normalizedUrl,
        domain: result.domain,
        verdict: result.verdict,
        score: result.score,
        reasons: result.reasons,
        redirectChain: result.redirectChain
      });
      
      // Update domain profile
      await DomainProfile.findOneAndUpdate(
        { domain: result.domain },
        {
          $set: { lastSeen: new Date() },
          $inc: { scanCount: 1 },
          $setOnInsert: { firstSeen: new Date() }
        },
        { upsert: true, new: true }
      );
    } catch (dbError) {
      console.log('DB save skipped (fallback mode):', dbError.message);
    }
    
    res.json({
      scanId: result.scanId,
      url: result.url,
      normalizedUrl: result.normalizedUrl,
      domain: result.domain,
      source: result.source,
      riskScore: result.score,
      verdict: result.verdict,
      reasons: result.reasons,
      redirectChain: result.redirectChain,
      recommendedAction: getRecommendedAction(result.verdict),
      cached: result.cached || false,
      timestamp: result.timestamp
    });
  } catch (error) {
    next(error);
  }
}

async function getScanHistory(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = parseInt(req.query.skip) || 0;
    
    let scans = [];
    try {
      scans = await ScanEvent.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .select('-__v');
    } catch (dbError) {
      console.log('DB query skipped (fallback mode)');
    }
    
    res.json({ scans, total: scans.length });
  } catch (error) {
    next(error);
  }
}

async function getScanById(req, res, next) {
  try {
    const { scanId } = req.params;
    
    let scan = null;
    try {
      scan = await ScanEvent.findOne({ scanId }).select('-__v');
    } catch (dbError) {
      console.log('DB query skipped (fallback mode)');
    }
    
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    
    res.json(scan);
  } catch (error) {
    next(error);
  }
}

function getRecommendedAction(verdict) {
  switch (verdict) {
    case 'safe': return 'proceed';
    case 'low_risk': return 'show_notice';
    case 'medium_risk': return 'show_preview_and_warn';
    case 'high_risk': return 'show_preview_and_block_by_default';
    default: return 'show_preview';
  }
}

module.exports = {
  scanUrl,
  getScanHistory,
  getScanById
};

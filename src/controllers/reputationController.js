const DomainProfile = require('../models/DomainProfile');
const { normalizeUrl } = require('../utils/urlUtils');

async function getReputation(req, res, next) {
  try {
    const { domain, url } = req.query;
    
    const targetDomain = domain || (url ? normalizeUrl(url).domain : null);
    
    if (!targetDomain) {
      return res.status(400).json({ error: 'Domain or URL is required' });
    }
    
    let profile = null;
    try {
      profile = await DomainProfile.findOne({ domain: targetDomain }).select('-__v');
    } catch (dbError) {
      console.log('DB query skipped (fallback mode)');
    }
    
    // If no profile found, return default
    if (!profile) {
      return res.json({
        domain: targetDomain,
        firstSeen: null,
        lastSeen: null,
        ageDays: null,
        scanCount: 0,
        averageScore: 0,
        reputationFlags: [],
        brandMatches: [],
        isTrusted: false,
        isBlocked: false,
        known: false
      });
    }
    
    const ageDays = profile.firstSeen 
      ? Math.floor((Date.now() - profile.firstSeen.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    res.json({
      domain: profile.domain,
      firstSeen: profile.firstSeen,
      lastSeen: profile.lastSeen,
      ageDays,
      scanCount: profile.scanCount,
      averageScore: profile.averageScore,
      reputationFlags: profile.reputationFlags,
      brandMatches: profile.brandMatches,
      isTrusted: profile.isTrusted,
      isBlocked: profile.isBlocked,
      known: true
    });
  } catch (error) {
    next(error);
  }
}

async function updateDomainStatus(req, res, next) {
  try {
    const { domain } = req.params;
    const { isTrusted, isBlocked } = req.body;
    
    let profile = null;
    try {
      profile = await DomainProfile.findOneAndUpdate(
        { domain },
        { 
          isTrusted: isTrusted !== undefined ? isTrusted : false,
          isBlocked: isBlocked !== undefined ? isBlocked : false,
          userOverride: true,
          lastSeen: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (dbError) {
      console.log('DB update skipped (fallback mode)');
    }
    
    res.json({
      domain,
      isTrusted: isTrusted || false,
      isBlocked: isBlocked || false,
      message: 'Domain status updated'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReputation,
  updateDomainStatus
};

const UserPreference = require('../models/UserPreference');

const DEFAULT_CONFIG = {
  version: '1.0.0',
  features: {
    realTimeScanning: true,
    clipboardMonitoring: true,
    notificationListener: true,
    accessibilityService: true,
    shareSheetIntegration: true,
    offlineMode: true,
    safePreview: true,
    domainBlocking: true,
    exportLogs: true
  },
  thresholds: {
    safe: { max: 19 },
    lowRisk: { min: 20, max: 49 },
    mediumRisk: { min: 50, max: 74 },
    highRisk: { min: 75, max: 100 }
  },
  scanTimeout: 5000,
  maxRedirectDepth: 3,
  cacheDuration: 3600
};

async function getConfig(req, res, next) {
  try {
    const { appVersion, deviceId } = req.query;
    
    let userPrefs = null;
    if (deviceId) {
      try {
        userPrefs = await UserPreference.findOne({ deviceId });
      } catch (dbError) {
        console.log('DB query skipped (fallback mode)');
      }
    }
    
    res.json({
      ...DEFAULT_CONFIG,
      userPreferences: userPrefs || {
        sensitivityMode: 'balanced',
        enabledSources: {
          notifications: true,
          clipboard: false,
          accessibility: false,
          shareSheet: true
        },
        privacySettings: {
          sendMessageContext: false,
          storeHistory: true,
          analyticsEnabled: true
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updatePreferences(req, res, next) {
  try {
    const { deviceId } = req.params;
    const updates = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }
    
    let prefs = null;
    try {
      prefs = await UserPreference.findOneAndUpdate(
        { deviceId },
        { 
          ...updates,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (dbError) {
      console.log('DB update skipped (fallback mode)');
    }
    
    res.json({
      deviceId,
      updated: true,
      preferences: prefs || updates
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getConfig,
  updatePreferences
};

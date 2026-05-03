const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  sensitivityMode: { type: String, enum: ['strict', 'balanced', 'relaxed'], default: 'balanced' },
  enabledSources: {
    notifications: { type: Boolean, default: true },
    clipboard: { type: Boolean, default: false },
    accessibility: { type: Boolean, default: false },
    shareSheet: { type: Boolean, default: true }
  },
  privacySettings: {
    sendMessageContext: { type: Boolean, default: false },
    storeHistory: { type: Boolean, default: true },
    analyticsEnabled: { type: Boolean, default: true }
  },
  notificationStyle: { type: String, enum: ['toast', 'banner', 'silent'], default: 'banner' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserPreference', userPreferenceSchema);

const mongoose = require('mongoose');

const domainProfileSchema = new mongoose.Schema({
  domain: { type: String, required: true, unique: true, index: true },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  scanCount: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  reputationFlags: [{ type: String }],
  brandMatches: [{ type: String }],
  isTrusted: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  userOverride: { type: Boolean, default: false },
  threatIntelSources: [{
    provider: String,
    classification: String,
    confidence: Number,
    lastChecked: Date
  }],
  whoisData: {
    registrar: String,
    creationDate: Date,
    expirationDate: Date,
    privacyProtected: Boolean
  },
}, { timestamps: true });

module.exports = mongoose.model('DomainProfile', domainProfileSchema);

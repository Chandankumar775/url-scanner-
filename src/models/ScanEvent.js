const mongoose = require('mongoose');

const scanEventSchema = new mongoose.Schema({
  scanId: { type: String, required: true, unique: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  source: { type: String, enum: ['notification', 'clipboard', 'share', 'accessibility', 'manual', 'unknown'], default: 'unknown' },
  rawUrl: { type: String, required: true },
  normalizedUrl: { type: String, required: true },
  domain: { type: String, required: true, index: true },
  verdict: { type: String, enum: ['safe', 'low_risk', 'medium_risk', 'high_risk', 'unknown'], default: 'unknown' },
  score: { type: Number, min: 0, max: 100, default: 0 },
  reasons: [{ type: String }],
  redirectChain: [{ type: String }],
  actionTaken: { type: String, enum: ['proceed', 'block', 'copy', 'trust', 'ignore', null], default: null },
  userAgent: String,
  ipHash: String,
}, { timestamps: true });

scanEventSchema.index({ timestamp: -1, domain: 1 });

module.exports = mongoose.model('ScanEvent', scanEventSchema);

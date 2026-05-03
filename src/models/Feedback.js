const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  scanId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  userAction: { type: String, enum: ['false_positive', 'false_negative', 'accurate', 'other'], required: true },
  label: { type: String, enum: ['safe', 'phishing', 'unsure', null], default: null },
  note: { type: String, maxlength: 1000 },
  userEmail: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);

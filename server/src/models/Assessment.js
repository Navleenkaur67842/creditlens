const mongoose = require('mongoose');

const factorSchema = new mongoose.Schema({
  factor: String,
  weight: Number,
  value: Number,
  contribution: Number,
  impact: { type: String, enum: ['positive', 'negative'] },
  tip: String
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer', required: true },
  score: { type: Number, required: true, min: 300, max: 900 },
  riskBand: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  probabilityOfDefault: { type: Number, required: true, min: 0, max: 1 },
  recommendedLoanLimit: { type: Number, required: true, min: 0 },
  factorBreakdown: [factorSchema],
  summary: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'flagged'], default: 'pending' },
  monthsAnalyzed: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);

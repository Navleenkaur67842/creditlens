const mongoose = require('mongoose');

const financialRecordSchema = new mongoose.Schema({
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer', required: true },
  month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
  sales: { type: Number, required: true, min: 0 },
  expenses: { type: Number, required: true, min: 0 },
  inventoryValue: { type: Number, required: true, min: 0 },
  supplierPaymentsOnTime: { type: Number, required: true, min: 0 },
  supplierPaymentsTotal: { type: Number, required: true, min: 0 },
  existingLoanEMI: { type: Number, default: 0, min: 0 },
  loanDefaultsCount: { type: Number, default: 0, min: 0 },
  digitalPaymentSharePct: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true });

// Unique per retailer per month
financialRecordSchema.index({ retailer: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('FinancialRecord', financialRecordSchema);

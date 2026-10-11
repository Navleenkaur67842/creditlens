const express = require('express');
const FinancialRecord = require('../models/FinancialRecord');
const Retailer = require('../models/Retailer');
const { auth, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// POST /api/financials - Add or update a monthly record
router.post('/', auth, requireRole('retailer'), validate(schemas.financialRecord), async (req, res, next) => {
  try {
    const retailer = await Retailer.findOne({ user: req.user._id });
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Please complete your business profile first.' });
    }

    const { month, sales, expenses, inventoryValue, supplierPaymentsOnTime, supplierPaymentsTotal, existingLoanEMI, loanDefaultsCount, digitalPaymentSharePct } = req.body;

    const record = await FinancialRecord.findOneAndUpdate(
      { retailer: retailer._id, month },
      { sales, expenses, inventoryValue, supplierPaymentsOnTime, supplierPaymentsTotal, existingLoanEMI, loanDefaultsCount, digitalPaymentSharePct },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, message: 'Financial record saved', data: record });
  } catch (err) {
    next(err);
  }
});

// GET /api/financials - Get all records for current retailer
router.get('/', auth, requireRole('retailer'), async (req, res, next) => {
  try {
    const retailer = await Retailer.findOne({ user: req.user._id });
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    const records = await FinancialRecord.find({ retailer: retailer._id }).sort({ month: 1 });
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/financials/:id
router.delete('/:id', auth, requireRole('retailer'), async (req, res, next) => {
  try {
    const retailer = await Retailer.findOne({ user: req.user._id });
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    const record = await FinancialRecord.findOneAndDelete({ _id: req.params.id, retailer: retailer._id });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    res.json({ success: true, message: 'Record deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

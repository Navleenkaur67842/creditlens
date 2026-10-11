const express = require('express');
const Assessment = require('../models/Assessment');
const FinancialRecord = require('../models/FinancialRecord');
const Retailer = require('../models/Retailer');
const { auth, requireRole } = require('../middleware/auth');
const { computeScore, generateSummary } = require('../services/scoring');

const router = express.Router();

// POST /api/assessments/run - Compute assessment from latest data
router.post('/run', auth, requireRole('retailer'), async (req, res, next) => {
  try {
    const retailer = await Retailer.findOne({ user: req.user._id });
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Please complete your business profile first.' });
    }

    // Get up to 12 most recent months of data
    const records = await FinancialRecord.find({ retailer: retailer._id })
      .sort({ month: -1 })
      .limit(12);

    if (records.length < 3) {
      return res.status(400).json({
        success: false,
        message: `At least 3 months of financial data required. You have ${records.length} month(s).`
      });
    }

    // Compute score
    const result = computeScore(records, retailer);

    // Generate summary (AI or local template)
    const summary = await generateSummary(result);

    // Save assessment
    const assessment = await Assessment.create({
      retailer: retailer._id,
      score: result.score,
      riskBand: result.riskBand,
      probabilityOfDefault: result.probabilityOfDefault,
      recommendedLoanLimit: result.recommendedLoanLimit,
      factorBreakdown: result.factorBreakdown,
      summary,
      monthsAnalyzed: result.monthsAnalyzed,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Assessment completed successfully',
      data: assessment
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/assessments/mine - Get all assessments for current retailer
router.get('/mine', auth, requireRole('retailer'), async (req, res, next) => {
  try {
    const retailer = await Retailer.findOne({ user: req.user._id });
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    const assessments = await Assessment.find({ retailer: retailer._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: assessments });
  } catch (err) {
    next(err);
  }
});

// GET /api/assessments/:id - Get specific assessment
router.get('/:id', auth, async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id).populate('retailer');
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    // Retailer can only see their own; admin can see all
    if (req.user.role === 'retailer') {
      const retailer = await Retailer.findOne({ user: req.user._id });
      if (!retailer || !assessment.retailer._id.equals(retailer._id)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

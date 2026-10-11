const express = require('express');
const Assessment = require('../models/Assessment');
const Retailer = require('../models/Retailer');
const FinancialRecord = require('../models/FinancialRecord');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth + admin role
router.use(auth, requireRole('admin'));

// GET /api/admin/applicants - List all retailers with latest assessment
router.get('/applicants', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', riskBand, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build retailer filter
    let retailerQuery = {};

    // If search provided, find matching users first
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const userIds = users.map(u => u._id);

      retailerQuery.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    const retailers = await Retailer.find(retailerQuery).populate('user', 'name email createdAt');
    const retailerIds = retailers.map(r => r._id);

    // Get latest assessment per retailer
    const latestAssessments = await Assessment.aggregate([
      { $match: { retailer: { $in: retailerIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$retailer',
          latestAssessment: { $first: '$$ROOT' }
        }
      }
    ]);

    const assessmentMap = {};
    latestAssessments.forEach(a => {
      assessmentMap[a._id.toString()] = a.latestAssessment;
    });

    // Build applicants array with filtering
    let applicants = retailers.map(r => ({
      retailer: r,
      assessment: assessmentMap[r._id.toString()] || null
    }));

    // Filter by riskBand
    if (riskBand) {
      applicants = applicants.filter(a => a.assessment?.riskBand === riskBand);
    }

    // Filter by status
    if (status) {
      applicants = applicants.filter(a => a.assessment?.status === status);
    }

    const total = applicants.length;
    const paginated = applicants.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        applicants: paginated,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/applicants/:id - Get applicant detail
router.get('/applicants/:id', async (req, res, next) => {
  try {
    const retailer = await Retailer.findById(req.params.id).populate('user', 'name email createdAt');
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Retailer not found.' });
    }

    const assessments = await Assessment.find({ retailer: retailer._id }).sort({ createdAt: -1 });
    const financials = await FinancialRecord.find({ retailer: retailer._id }).sort({ month: 1 });

    res.json({
      success: true,
      data: { retailer, assessments, financials }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/assessments/:id/status - Update assessment status
router.patch('/assessments/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'flagged'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const assessment = await Assessment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    res.json({ success: true, message: `Assessment ${status} successfully`, data: assessment });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const totalRetailers = await Retailer.countDocuments();
    const totalAssessments = await Assessment.countDocuments();

    // Count by risk band (latest assessment per retailer)
    const riskBandCounts = await Assessment.aggregate([
      { $sort: { retailer: 1, createdAt: -1 } },
      {
        $group: {
          _id: '$retailer',
          riskBand: { $first: '$riskBand' },
          score: { $first: '$score' },
          status: { $first: '$status' }
        }
      },
      {
        $group: {
          _id: '$riskBand',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    // Status counts
    const statusCounts = await Assessment.aggregate([
      { $sort: { retailer: 1, createdAt: -1 } },
      { $group: { _id: '$retailer', status: { $first: '$status' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const avgScoreResult = await Assessment.aggregate([
      { $group: { _id: null, avg: { $avg: '$score' } } }
    ]);
    const averageScore = avgScoreResult[0]?.avg ? Math.round(avgScoreResult[0].avg) : 0;

    const approvedCount = statusCounts.find(s => s._id === 'approved')?.count || 0;
    const totalWithAssessments = statusCounts.reduce((sum, s) => sum + s.count, 0);
    const approvalRate = totalWithAssessments > 0 ? Math.round((approvedCount / totalWithAssessments) * 100) : 0;

    const byRiskBand = {
      Low: riskBandCounts.find(r => r._id === 'Low')?.count || 0,
      Medium: riskBandCounts.find(r => r._id === 'Medium')?.count || 0,
      High: riskBandCounts.find(r => r._id === 'High')?.count || 0
    };

    const byStatus = {
      pending: statusCounts.find(s => s._id === 'pending')?.count || 0,
      approved: statusCounts.find(s => s._id === 'approved')?.count || 0,
      rejected: statusCounts.find(s => s._id === 'rejected')?.count || 0,
      flagged: statusCounts.find(s => s._id === 'flagged')?.count || 0
    };

    res.json({
      success: true,
      data: {
        totalRetailers,
        totalAssessments,
        averageScore,
        approvalRate,
        byRiskBand,
        byStatus
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

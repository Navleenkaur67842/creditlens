const express = require('express');
const Retailer = require('../models/Retailer');
const { auth, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// GET /api/retailers/me
router.get('/me', auth, requireRole('retailer'), async (req, res, next) => {
  try {
    const retailer = await Retailer.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!retailer) {
      return res.status(404).json({ success: false, message: 'Profile not found. Please complete your profile.' });
    }
    res.json({ success: true, data: retailer });
  } catch (err) {
    next(err);
  }
});

// PUT /api/retailers/me
router.put('/me', auth, requireRole('retailer'), validate(schemas.retailerProfile), async (req, res, next) => {
  try {
    const { shopName, ownerName, city, shopType, yearsInBusiness, gstRegistered, phone } = req.body;

    const retailer = await Retailer.findOneAndUpdate(
      { user: req.user._id },
      { shopName, ownerName, city, shopType, yearsInBusiness, gstRegistered, phone },
      { new: true, upsert: true, runValidators: true }
    ).populate('user', 'name email');

    res.json({ success: true, message: 'Profile updated successfully', data: retailer });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

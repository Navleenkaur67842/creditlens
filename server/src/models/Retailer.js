const mongoose = require('mongoose');

const retailerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  shopName: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  shopType: { type: String, required: true, trim: true },
  yearsInBusiness: { type: Number, required: true, min: 0 },
  gstRegistered: { type: Boolean, default: false },
  phone: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Retailer', retailerSchema);

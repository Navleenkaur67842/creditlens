require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Retailer = require('./src/models/Retailer');
const FinancialRecord = require('./src/models/FinancialRecord');
const Assessment = require('./src/models/Assessment');
const { computeScore, generateLocalSummary } = require('./src/services/scoring');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/creditlens';

function generateMonths(count, startOffset = 0) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i - startOffset, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

// Profile types
const profiles = [
  // Good retailers (4 profiles)
  {
    shopName: 'Sharma General Store', ownerName: 'Ramesh Sharma', city: 'Delhi', shopType: 'Kirana',
    yearsInBusiness: 12, gstRegistered: true, phone: '9876543210',
    financials: { sales: [180000, 190000, 195000, 200000, 210000, 215000, 220000, 225000, 230000, 238000, 245000, 250000],
      expenses: [110000, 115000, 118000, 120000, 125000, 128000, 130000, 132000, 135000, 138000, 140000, 143000],
      inventory: 350000, emiBase: 5000, supplierOnTime: 0.95, digital: 65, defaults: 0 }
  },
  {
    shopName: 'Patel Electronics', ownerName: 'Suresh Patel', city: 'Ahmedabad', shopType: 'Electronics',
    yearsInBusiness: 8, gstRegistered: true, phone: '9876543211',
    financials: { sales: [320000, 330000, 340000, 345000, 355000, 360000, 370000, 375000, 380000, 390000, 400000, 410000],
      expenses: [220000, 225000, 230000, 232000, 240000, 242000, 248000, 250000, 255000, 260000, 265000, 270000],
      inventory: 800000, emiBase: 15000, supplierOnTime: 0.90, digital: 75, defaults: 0 }
  },
  {
    shopName: 'Gupta Medical', ownerName: 'Priya Gupta', city: 'Lucknow', shopType: 'Pharmacy',
    yearsInBusiness: 15, gstRegistered: true, phone: '9876543212',
    financials: { sales: [250000, 255000, 260000, 268000, 272000, 278000, 285000, 290000, 295000, 300000, 308000, 315000],
      expenses: [160000, 162000, 165000, 168000, 172000, 175000, 178000, 180000, 182000, 185000, 190000, 193000],
      inventory: 500000, emiBase: 8000, supplierOnTime: 0.97, digital: 70, defaults: 0 }
  },
  {
    shopName: 'Khan Fashion House', ownerName: 'Amir Khan', city: 'Mumbai', shopType: 'Clothing',
    yearsInBusiness: 10, gstRegistered: true, phone: '9876543213',
    financials: { sales: [400000, 420000, 380000, 440000, 430000, 450000, 460000, 470000, 480000, 495000, 510000, 525000],
      expenses: [270000, 280000, 255000, 290000, 285000, 295000, 302000, 308000, 315000, 320000, 328000, 338000],
      inventory: 900000, emiBase: 20000, supplierOnTime: 0.88, digital: 80, defaults: 0 }
  },
  // Average retailers (4 profiles)
  {
    shopName: 'Singh Hardware', ownerName: 'Gurpreet Singh', city: 'Chandigarh', shopType: 'Hardware',
    yearsInBusiness: 5, gstRegistered: false, phone: '9876543214',
    financials: { sales: [85000, 88000, 82000, 90000, 88000, 92000, 89000, 91000, 93000, 90000, 94000, 96000],
      expenses: [65000, 67000, 63000, 69000, 67000, 70000, 68000, 69000, 71000, 69000, 72000, 74000],
      inventory: 150000, emiBase: 8000, supplierOnTime: 0.72, digital: 30, defaults: 0 }
  },
  {
    shopName: 'Verma Dairy', ownerName: 'Santosh Verma', city: 'Jaipur', shopType: 'Dairy',
    yearsInBusiness: 7, gstRegistered: false, phone: '9876543215',
    financials: { sales: [120000, 118000, 125000, 122000, 128000, 124000, 130000, 126000, 132000, 128000, 135000, 131000],
      expenses: [95000, 93000, 98000, 96000, 101000, 98000, 103000, 100000, 105000, 102000, 107000, 104000],
      inventory: 80000, emiBase: 10000, supplierOnTime: 0.68, digital: 20, defaults: 0 }
  },
  {
    shopName: 'Reddy Stationery', ownerName: 'Venkat Reddy', city: 'Hyderabad', shopType: 'Stationery',
    yearsInBusiness: 4, gstRegistered: true, phone: '9876543216',
    financials: { sales: [55000, 58000, 52000, 60000, 57000, 63000, 59000, 65000, 61000, 67000, 63000, 70000],
      expenses: [40000, 42000, 38000, 44000, 42000, 46000, 43000, 47000, 45000, 49000, 46000, 51000],
      inventory: 90000, emiBase: 5000, supplierOnTime: 0.78, digital: 45, defaults: 0 }
  },
  {
    shopName: 'Joshi Bakery', ownerName: 'Meera Joshi', city: 'Pune', shopType: 'Bakery',
    yearsInBusiness: 6, gstRegistered: false, phone: '9876543217',
    financials: { sales: [70000, 75000, 68000, 80000, 73000, 85000, 76000, 82000, 71000, 88000, 78000, 92000],
      expenses: [54000, 57000, 52000, 61000, 56000, 65000, 58000, 63000, 55000, 67000, 60000, 70000],
      inventory: 60000, emiBase: 7000, supplierOnTime: 0.75, digital: 35, defaults: 1 }
  },
  // Poor retailers (4 profiles)
  {
    shopName: 'Kumar Grocery', ownerName: 'Rajesh Kumar', city: 'Patna', shopType: 'Kirana',
    yearsInBusiness: 2, gstRegistered: false, phone: '9876543218',
    financials: { sales: [45000, 42000, 40000, 38000, 35000, 32000, 30000, 28000, 26000, 24000, 22000, 20000],
      expenses: [43000, 41000, 40000, 39000, 38000, 36000, 35000, 33000, 31000, 29000, 28000, 27000],
      inventory: 50000, emiBase: 15000, supplierOnTime: 0.40, digital: 5, defaults: 3 }
  },
  {
    shopName: 'Mishra Pan Shop', ownerName: 'Dinesh Mishra', city: 'Varanasi', shopType: 'Pan/Tobacco',
    yearsInBusiness: 1, gstRegistered: false, phone: '9876543219',
    financials: { sales: [20000, 18000, 19000, 17000, 16000, 15000, 18000, 16000, 14000, 13000, 15000, 12000],
      expenses: [18000, 17000, 18000, 17000, 16000, 15500, 17000, 16000, 14500, 13500, 15500, 13000],
      inventory: 25000, emiBase: 5000, supplierOnTime: 0.50, digital: 10, defaults: 2 }
  },
  {
    shopName: 'Yadav Motor Parts', ownerName: 'Vijay Yadav', city: 'Kanpur', shopType: 'Auto Parts',
    yearsInBusiness: 3, gstRegistered: false, phone: '9876543220',
    financials: { sales: [65000, 60000, 58000, 55000, 70000, 52000, 48000, 45000, 60000, 42000, 40000, 38000],
      expenses: [58000, 55000, 55000, 53000, 65000, 50000, 47000, 46000, 58000, 43000, 42000, 40000],
      inventory: 200000, emiBase: 18000, supplierOnTime: 0.55, digital: 8, defaults: 2 }
  },
  {
    shopName: 'Tiwari Tailors', ownerName: 'Sushma Tiwari', city: 'Bhopal', shopType: 'Tailoring',
    yearsInBusiness: 4, gstRegistered: false, phone: '9876543221',
    financials: { sales: [30000, 28000, 32000, 27000, 31000, 26000, 33000, 25000, 29000, 24000, 28000, 23000],
      expenses: [28000, 27000, 30000, 26000, 30000, 26000, 31000, 25500, 28000, 24500, 27500, 23500],
      inventory: 40000, emiBase: 8000, supplierOnTime: 0.60, digital: 15, defaults: 1 }
  }
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Retailer.deleteMany({}),
    FinancialRecord.deleteMany({}),
    Assessment.deleteMany({})
  ]);
  console.log('Cleared existing data');

  // Create admin
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@creditlens.com',
    passwordHash: adminHash,
    role: 'admin'
  });
  console.log('Created admin: admin@creditlens.com / Admin@123');

  const months = generateMonths(12);

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];

    // Create user
    const hash = await bcrypt.hash('Retailer@123', 12);
    const email = `${profile.shopName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const user = await User.create({
      name: profile.ownerName,
      email,
      passwordHash: hash,
      role: 'retailer'
    });

    // Create retailer profile
    const retailer = await Retailer.create({
      user: user._id,
      shopName: profile.shopName,
      ownerName: profile.ownerName,
      city: profile.city,
      shopType: profile.shopType,
      yearsInBusiness: profile.yearsInBusiness,
      gstRegistered: profile.gstRegistered,
      phone: profile.phone
    });

    // Create financial records
    const { sales, expenses, inventory, emiBase, supplierOnTime, digital, defaults } = profile.financials;
    const records = [];

    for (let m = 0; m < 12; m++) {
      const jitter = () => 1 + (Math.random() - 0.5) * 0.05;
      const record = await FinancialRecord.create({
        retailer: retailer._id,
        month: months[m],
        sales: Math.round(sales[m] * jitter()),
        expenses: Math.round(expenses[m] * jitter()),
        inventoryValue: Math.round(inventory * jitter()),
        supplierPaymentsOnTime: Math.round(10 * supplierOnTime),
        supplierPaymentsTotal: 10,
        existingLoanEMI: emiBase,
        loanDefaultsCount: Math.max(0, defaults + (Math.random() > 0.8 ? 1 : 0) - (Math.random() > 0.8 ? 1 : 0)),
        digitalPaymentSharePct: Math.round(digital * jitter())
      });
      records.push(record);
    }

    // Compute and save assessment
    try {
      const result = computeScore(records, retailer);
      const summary = generateLocalSummary(result);

      const statusOptions = ['pending', 'approved', 'rejected', 'flagged'];
      const status = result.riskBand === 'Low' ? 'approved' : result.riskBand === 'High' ? 'rejected' : 'pending';

      await Assessment.create({
        retailer: retailer._id,
        score: result.score,
        riskBand: result.riskBand,
        probabilityOfDefault: result.probabilityOfDefault,
        recommendedLoanLimit: result.recommendedLoanLimit,
        factorBreakdown: result.factorBreakdown,
        summary,
        monthsAnalyzed: result.monthsAnalyzed,
        status
      });

      console.log(`✅ ${profile.shopName}: Score=${result.score}, Risk=${result.riskBand}, Status=${status}`);
    } catch (err) {
      console.error(`❌ Failed assessment for ${profile.shopName}:`, err.message);
    }
  }

  console.log('\n🌱 Seed complete!');
  console.log('Admin: admin@creditlens.com / Admin@123');
  console.log('Retailers: email is shopname@example.com / Retailer@123');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

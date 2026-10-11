/**
 * CreditLens AI Scoring Engine
 * Explainable weighted scoring model for small retailer creditworthiness.
 * Score range: 300-900, no external API required.
 * If GEMINI_API_KEY is set, generates AI summary; otherwise uses local template.
 */

const WEIGHTS = {
  profitMargin: 0.20,
  salesGrowth: 0.15,
  salesVolatility: 0.10,
  debtToIncome: 0.15,
  supplierPaymentRatio: 0.15,
  inventoryTurnover: 0.08,
  yearsInBusiness: 0.07,
  gstRegistered: 0.04,
  digitalPaymentShare: 0.04,
  loanDefaults: 0.02
};

const FACTOR_LABELS = {
  profitMargin: 'Average Profit Margin',
  salesGrowth: 'Sales Growth Trend',
  salesVolatility: 'Sales Stability',
  debtToIncome: 'Debt-to-Income Ratio',
  supplierPaymentRatio: 'Supplier Payment Timeliness',
  inventoryTurnover: 'Inventory Turnover',
  yearsInBusiness: 'Business Tenure',
  gstRegistered: 'GST Registration',
  digitalPaymentShare: 'Digital Payment Adoption',
  loanDefaults: 'Loan Default History'
};

const TIPS = {
  profitMargin: 'Reduce unnecessary expenses or increase pricing to improve profit margins.',
  salesGrowth: 'Focus on expanding your customer base and diversifying product offerings to grow sales.',
  salesVolatility: 'Aim for consistent monthly sales through regular promotions and loyal customer programs.',
  debtToIncome: 'Try to reduce existing EMI obligations before applying for new loans.',
  supplierPaymentRatio: 'Pay suppliers on time to build trust and improve your creditworthiness.',
  inventoryTurnover: 'Optimize inventory levels — avoid overstocking slow-moving items.',
  yearsInBusiness: 'Building a longer track record of successful business operations helps creditworthiness.',
  gstRegistered: 'Register for GST to access formal credit channels and government schemes.',
  digitalPaymentShare: 'Increase digital payment acceptance (UPI, cards) to create traceable transaction records.',
  loanDefaults: 'Avoid loan defaults at all costs — they severely impact creditworthiness.'
};

/**
 * Compute linear regression slope for sales trend.
 * Returns slope normalized per unit (positive = growing).
 */
function computeSalesSlope(records) {
  const n = records.length;
  if (n < 2) return 0;
  const xs = records.map((_, i) => i);
  const ys = records.map(r => r.sales);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0);
  const den = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  if (den === 0) return 0;
  const slope = num / den;
  // Normalize slope as % change per month relative to mean sales
  return meanY > 0 ? slope / meanY : 0;
}

/**
 * Compute coefficient of variation (std dev / mean) for sales.
 * Lower is better (more stable).
 */
function computeSalesCV(records) {
  const sales = records.map(r => r.sales);
  const mean = sales.reduce((a, b) => a + b, 0) / sales.length;
  if (mean === 0) return 1;
  const variance = sales.reduce((sum, s) => sum + (s - mean) ** 2, 0) / sales.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Clamp a value between min and max.
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Normalize a value to [0, 1] using sigmoid-like or linear mapping.
 * Returns a score from 0 (worst) to 1 (best).
 */
function normalizeFeatures(rawFeatures, retailerInfo) {
  const {
    avgProfitMargin,
    salesSlopeNorm,
    salesCV,
    avgDTI,
    supplierRatio,
    inventoryTurnoverProxy,
    yearsInBusiness,
    gstRegistered,
    digitalPaymentShare,
    avgLoanDefaults
  } = rawFeatures;

  const normalized = {};

  // Profit margin: -100% to 100% → 0 to 1 (break-even at 0.5)
  normalized.profitMargin = clamp((avgProfitMargin + 1) / 2, 0, 1);

  // Sales growth: -20% to +20% per month → 0 to 1
  normalized.salesGrowth = clamp((salesSlopeNorm + 0.20) / 0.40, 0, 1);

  // Sales volatility (CV): 0 (stable) to 1+ (volatile) → inverted, cap at 1
  normalized.salesVolatility = clamp(1 - salesCV, 0, 1);

  // Debt-to-Income: 0 (no debt) to 1+ (very high) → inverted, cap at DTI=1 meaning worst
  normalized.debtToIncome = clamp(1 - avgDTI, 0, 1);

  // Supplier payment ratio: 0 to 1 → already 0-1
  normalized.supplierPaymentRatio = clamp(supplierRatio, 0, 1);

  // Inventory turnover proxy (sales/inventory): 0 to 4+ per month → cap at 4
  normalized.inventoryTurnover = clamp(inventoryTurnoverProxy / 4, 0, 1);

  // Years in business: 0 to 20+ → normalize to 0-1
  normalized.yearsInBusiness = clamp(yearsInBusiness / 20, 0, 1);

  // GST: binary
  normalized.gstRegistered = gstRegistered ? 1 : 0;

  // Digital payment share: 0-100% → 0-1
  normalized.digitalPaymentShare = clamp(digitalPaymentShare / 100, 0, 1);

  // Loan defaults: 0 defaults = 1, any defaults reduce score significantly
  normalized.loanDefaults = clamp(1 - (avgLoanDefaults * 0.5), 0, 1);

  return normalized;
}

/**
 * Compute raw features from financial records and retailer info.
 */
function computeRawFeatures(records, retailer) {
  const n = records.length;

  const profits = records.map(r => r.sales - r.expenses);
  const avgProfit = profits.reduce((a, b) => a + b, 0) / n;

  const avgSales = records.reduce((sum, r) => sum + r.sales, 0) / n;
  const avgExpenses = records.reduce((sum, r) => sum + r.expenses, 0) / n;

  // Profit margin: (avg_profit / avg_sales)
  const avgProfitMargin = avgSales > 0 ? (avgProfit / avgSales) : -1;

  // Sales trend slope normalized
  const salesSlopeNorm = computeSalesSlope(records);

  // Sales coefficient of variation
  const salesCV = computeSalesCV(records);

  // Debt-to-Income: avg EMI / avg monthly profit (capped at 2)
  const avgEMI = records.reduce((sum, r) => sum + r.existingLoanEMI, 0) / n;
  const avgDTI = avgProfit > 0 ? clamp(avgEMI / avgProfit, 0, 2) : 2;

  // Supplier payment ratio
  const totalOnTime = records.reduce((sum, r) => sum + r.supplierPaymentsOnTime, 0);
  const totalPayments = records.reduce((sum, r) => sum + r.supplierPaymentsTotal, 0);
  const supplierRatio = totalPayments > 0 ? totalOnTime / totalPayments : 0;

  // Inventory turnover proxy: avg sales / avg inventory value
  const avgInventory = records.reduce((sum, r) => sum + r.inventoryValue, 0) / n;
  const inventoryTurnoverProxy = avgInventory > 0 ? avgSales / avgInventory : 0;

  // Average loan defaults per month
  const avgLoanDefaults = records.reduce((sum, r) => sum + r.loanDefaultsCount, 0) / n;

  // Digital payment share (average)
  const digitalPaymentShare = records.reduce((sum, r) => sum + r.digitalPaymentSharePct, 0) / n;

  return {
    avgProfitMargin,
    salesSlopeNorm,
    salesCV,
    avgDTI,
    supplierRatio,
    inventoryTurnoverProxy,
    yearsInBusiness: retailer.yearsInBusiness || 0,
    gstRegistered: retailer.gstRegistered || false,
    digitalPaymentShare,
    avgLoanDefaults,
    avgProfit,
    avgSales,
    avgEMI,
    n
  };
}

/**
 * Compute final score and all output metrics.
 */
function computeScore(records, retailer) {
  if (!records || records.length < 3) {
    throw new Error('At least 3 months of financial data required for assessment.');
  }

  // Sort records chronologically
  const sorted = [...records].sort((a, b) => a.month.localeCompare(b.month));

  const raw = computeRawFeatures(sorted, retailer);
  const norm = normalizeFeatures(raw, retailer);

  // Weighted score in [0, 1]
  let weightedScore = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    weightedScore += weight * (norm[key] || 0);
  }

  // Map to 300-900 range
  const score = Math.round(300 + weightedScore * 600);

  // Risk band
  let riskBand;
  if (score >= 720) riskBand = 'Low';
  else if (score >= 600) riskBand = 'Medium';
  else riskBand = 'High';

  // Probability of default: logistic-style, higher score = lower PD
  // PD = 1 / (1 + e^(k*(score - midpoint)))
  const k = 0.012;
  const midpoint = 600;
  const probabilityOfDefault = parseFloat((1 / (1 + Math.exp(k * (score - midpoint)))).toFixed(4));

  // Recommended loan limit: f(avg_monthly_profit, score, DTI)
  // Base multiplier ranges from 2x to 12x avg monthly profit
  const scoreMultiplier = (score - 300) / 600; // 0 to 1
  const dtiPenalty = clamp(1 - raw.avgDTI * 0.5, 0.2, 1);
  const baseMultiplier = 2 + scoreMultiplier * 10;
  const recommendedLoanLimit = Math.max(0, Math.round(raw.avgProfit * baseMultiplier * dtiPenalty / 1000) * 1000);

  // Factor breakdown
  const factorBreakdown = Object.entries(WEIGHTS).map(([key, weight]) => {
    const value = norm[key];
    const contribution = weight * value;
    const rawVal = getRawDisplayValue(key, raw, norm);

    return {
      factor: FACTOR_LABELS[key],
      weight: parseFloat((weight * 100).toFixed(1)),
      value: parseFloat(value.toFixed(4)),
      contribution: parseFloat((contribution * 100).toFixed(2)),
      impact: value >= 0.5 ? 'positive' : 'negative',
      tip: TIPS[key],
      _key: key
    };
  });

  // Sort by contribution ascending to find worst factors
  const sorted_factors = [...factorBreakdown].sort((a, b) => a.contribution - b.contribution);
  const negativeTips = sorted_factors.slice(0, 3).map(f => ({
    factor: f.factor,
    tip: f.tip
  }));

  // Clean up internal _key
  const cleanBreakdown = factorBreakdown.map(({ _key, ...rest }) => rest);

  return {
    score,
    riskBand,
    probabilityOfDefault,
    recommendedLoanLimit,
    factorBreakdown: cleanBreakdown,
    negativeTips,
    raw,
    monthsAnalyzed: sorted.length
  };
}

/**
 * Get a human-readable raw value for display.
 */
function getRawDisplayValue(key, raw) {
  switch (key) {
    case 'profitMargin': return raw.avgProfitMargin;
    case 'salesGrowth': return raw.salesSlopeNorm;
    case 'salesVolatility': return raw.salesCV;
    case 'debtToIncome': return raw.avgDTI;
    case 'supplierPaymentRatio': return raw.supplierRatio;
    case 'inventoryTurnover': return raw.inventoryTurnoverProxy;
    case 'yearsInBusiness': return raw.yearsInBusiness;
    case 'gstRegistered': return raw.gstRegistered ? 1 : 0;
    case 'digitalPaymentShare': return raw.digitalPaymentShare;
    case 'loanDefaults': return raw.avgLoanDefaults;
    default: return 0;
  }
}

/**
 * Generate a local template summary.
 */
function generateLocalSummary(result) {
  const { score, riskBand, probabilityOfDefault, recommendedLoanLimit, negativeTips } = result;
  const pdPct = (probabilityOfDefault * 100).toFixed(1);
  const loanStr = recommendedLoanLimit.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  let intro = '';
  if (riskBand === 'Low') {
    intro = `This retailer demonstrates strong creditworthiness with a score of ${score}, placing them in the Low Risk category. They show healthy financial management and reliable payment behaviour.`;
  } else if (riskBand === 'Medium') {
    intro = `This retailer has a moderate credit profile with a score of ${score}, in the Medium Risk band. There are positive aspects to their business but some areas need improvement.`;
  } else {
    intro = `This retailer currently shows a High Risk profile with a score of ${score}. Significant financial improvements are needed before a substantial loan can be recommended.`;
  }

  const pd = `The estimated probability of default is ${pdPct}%, and the recommended loan limit is ${loanStr}.`;

  const tipsText = negativeTips.length > 0
    ? `Key areas for improvement: ${negativeTips.map(t => t.factor).join(', ')}.`
    : 'The retailer is performing well across all assessed factors.';

  return `${intro} ${pd} ${tipsText}`;
}

/**
 * Generate AI summary using Gemini if API key is available.
 */
async function generateSummary(result) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateLocalSummary(result);
  }

  try {
    const https = require('https');
    const prompt = `You are a credit analyst. Based on this credit assessment data for a small Indian retailer, write a concise 3-sentence summary (no bullet points) explaining the credit score, key strengths, and improvement areas:

Score: ${result.score}/900 (${result.riskBand} Risk)
Probability of Default: ${(result.probabilityOfDefault * 100).toFixed(1)}%
Recommended Loan Limit: ₹${result.recommendedLoanLimit.toLocaleString()}
Top concerns: ${result.negativeTips.map(t => t.factor).join(', ')}
Factor scores: ${result.factorBreakdown.map(f => `${f.factor}: ${(f.value * 100).toFixed(0)}%`).join(', ')}

Write a professional, empathetic summary for the retailer.`;

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    return await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            resolve(text || generateLocalSummary(result));
          } catch {
            resolve(generateLocalSummary(result));
          }
        });
      });
      req.on('error', () => resolve(generateLocalSummary(result)));
      req.write(body);
      req.end();
    });
  } catch {
    return generateLocalSummary(result);
  }
}

module.exports = { computeScore, generateSummary, generateLocalSummary, WEIGHTS, FACTOR_LABELS };

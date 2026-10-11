const { computeScore, generateLocalSummary } = require('../src/services/scoring');

// Helper to create mock records
function makeRecords(overrides = []) {
  return overrides;
}

// Helper to create a mock retailer
function makeRetailer(opts = {}) {
  return {
    yearsInBusiness: opts.yearsInBusiness ?? 5,
    gstRegistered: opts.gstRegistered ?? true
  };
}

describe('CreditLens Scoring Engine', () => {
  // ─── GOOD RETAILER ──────────────────────────────────────────────────────────
  describe('Good Retailer Profile', () => {
    const records = [
      { month: '2024-01', sales: 200000, expenses: 120000, inventoryValue: 400000, supplierPaymentsOnTime: 9, supplierPaymentsTotal: 10, existingLoanEMI: 5000, loanDefaultsCount: 0, digitalPaymentSharePct: 70 },
      { month: '2024-02', sales: 210000, expenses: 125000, inventoryValue: 410000, supplierPaymentsOnTime: 9, supplierPaymentsTotal: 10, existingLoanEMI: 5000, loanDefaultsCount: 0, digitalPaymentSharePct: 72 },
      { month: '2024-03', sales: 220000, expenses: 130000, inventoryValue: 420000, supplierPaymentsOnTime: 10, supplierPaymentsTotal: 10, existingLoanEMI: 5000, loanDefaultsCount: 0, digitalPaymentSharePct: 74 },
      { month: '2024-04', sales: 230000, expenses: 135000, inventoryValue: 430000, supplierPaymentsOnTime: 10, supplierPaymentsTotal: 10, existingLoanEMI: 5000, loanDefaultsCount: 0, digitalPaymentSharePct: 75 },
      { month: '2024-05', sales: 240000, expenses: 138000, inventoryValue: 440000, supplierPaymentsOnTime: 10, supplierPaymentsTotal: 10, existingLoanEMI: 5000, loanDefaultsCount: 0, digitalPaymentSharePct: 78 },
      { month: '2024-06', sales: 250000, expenses: 142000, inventoryValue: 450000, supplierPaymentsOnTime: 10, supplierPaymentsTotal: 10, existingLoanEMI: 5000, loanDefaultsCount: 0, digitalPaymentSharePct: 80 },
    ];
    const retailer = makeRetailer({ yearsInBusiness: 10, gstRegistered: true });

    let result;
    beforeAll(() => { result = computeScore(records, retailer); });

    test('score should be >= 720 (Low Risk)', () => {
      expect(result.score).toBeGreaterThanOrEqual(720);
    });

    test('riskBand should be Low', () => {
      expect(result.riskBand).toBe('Low');
    });

    test('probability of default should be < 0.25', () => {
      expect(result.probabilityOfDefault).toBeLessThan(0.25);
    });

    test('recommended loan limit should be positive', () => {
      expect(result.recommendedLoanLimit).toBeGreaterThan(0);
    });

    test('factorBreakdown should have 10 factors', () => {
      expect(result.factorBreakdown).toHaveLength(10);
    });

    test('factorBreakdown factors should have required fields', () => {
      result.factorBreakdown.forEach(f => {
        expect(f).toHaveProperty('factor');
        expect(f).toHaveProperty('weight');
        expect(f).toHaveProperty('value');
        expect(f).toHaveProperty('contribution');
        expect(f).toHaveProperty('impact');
        expect(f).toHaveProperty('tip');
        expect(['positive', 'negative']).toContain(f.impact);
      });
    });

    test('summary should be generated', () => {
      const summary = generateLocalSummary(result);
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(50);
    });
  });

  // ─── AVERAGE RETAILER ───────────────────────────────────────────────────────
  describe('Average Retailer Profile', () => {
    const records = [
      { month: '2024-01', sales: 80000, expenses: 65000, inventoryValue: 120000, supplierPaymentsOnTime: 7, supplierPaymentsTotal: 10, existingLoanEMI: 8000, loanDefaultsCount: 0, digitalPaymentSharePct: 30 },
      { month: '2024-02', sales: 82000, expenses: 67000, inventoryValue: 118000, supplierPaymentsOnTime: 7, supplierPaymentsTotal: 10, existingLoanEMI: 8000, loanDefaultsCount: 0, digitalPaymentSharePct: 32 },
      { month: '2024-03', sales: 78000, expenses: 63000, inventoryValue: 122000, supplierPaymentsOnTime: 6, supplierPaymentsTotal: 10, existingLoanEMI: 8000, loanDefaultsCount: 0, digitalPaymentSharePct: 28 },
      { month: '2024-04', sales: 85000, expenses: 70000, inventoryValue: 125000, supplierPaymentsOnTime: 7, supplierPaymentsTotal: 10, existingLoanEMI: 8000, loanDefaultsCount: 1, digitalPaymentSharePct: 35 },
      { month: '2024-05', sales: 83000, expenses: 68000, inventoryValue: 119000, supplierPaymentsOnTime: 8, supplierPaymentsTotal: 10, existingLoanEMI: 8000, loanDefaultsCount: 0, digitalPaymentSharePct: 33 },
      { month: '2024-06', sales: 87000, expenses: 71000, inventoryValue: 128000, supplierPaymentsOnTime: 7, supplierPaymentsTotal: 10, existingLoanEMI: 8000, loanDefaultsCount: 0, digitalPaymentSharePct: 36 },
    ];
    const retailer = makeRetailer({ yearsInBusiness: 5, gstRegistered: false });

    let result;
    beforeAll(() => { result = computeScore(records, retailer); });

    test('score should be between 550 and 750 (Medium range)', () => {
      expect(result.score).toBeGreaterThanOrEqual(500);
      expect(result.score).toBeLessThan(780);
    });

    test('riskBand should be Medium or High', () => {
      expect(['Medium', 'High']).toContain(result.riskBand);
    });

    test('probability of default should be between 0.1 and 0.65', () => {
      expect(result.probabilityOfDefault).toBeGreaterThan(0.05);
      expect(result.probabilityOfDefault).toBeLessThan(0.75);
    });

    test('factorBreakdown should have 10 factors with valid fields', () => {
      expect(result.factorBreakdown).toHaveLength(10);
      result.factorBreakdown.forEach(f => {
        expect(f.weight).toBeGreaterThan(0);
        expect(f.contribution).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ─── POOR RETAILER ──────────────────────────────────────────────────────────
  describe('Poor Retailer Profile', () => {
    const records = [
      { month: '2024-01', sales: 40000, expenses: 42000, inventoryValue: 50000, supplierPaymentsOnTime: 3, supplierPaymentsTotal: 10, existingLoanEMI: 15000, loanDefaultsCount: 3, digitalPaymentSharePct: 5 },
      { month: '2024-02', sales: 38000, expenses: 40000, inventoryValue: 48000, supplierPaymentsOnTime: 3, supplierPaymentsTotal: 10, existingLoanEMI: 15000, loanDefaultsCount: 2, digitalPaymentSharePct: 5 },
      { month: '2024-03', sales: 36000, expenses: 39000, inventoryValue: 46000, supplierPaymentsOnTime: 2, supplierPaymentsTotal: 10, existingLoanEMI: 15000, loanDefaultsCount: 3, digitalPaymentSharePct: 4 },
      { month: '2024-04', sales: 34000, expenses: 38000, inventoryValue: 44000, supplierPaymentsOnTime: 4, supplierPaymentsTotal: 10, existingLoanEMI: 15000, loanDefaultsCount: 2, digitalPaymentSharePct: 6 },
      { month: '2024-05', sales: 32000, expenses: 37000, inventoryValue: 42000, supplierPaymentsOnTime: 3, supplierPaymentsTotal: 10, existingLoanEMI: 15000, loanDefaultsCount: 2, digitalPaymentSharePct: 5 },
      { month: '2024-06', sales: 30000, expenses: 36000, inventoryValue: 40000, supplierPaymentsOnTime: 2, supplierPaymentsTotal: 10, existingLoanEMI: 15000, loanDefaultsCount: 3, digitalPaymentSharePct: 4 },
    ];
    const retailer = makeRetailer({ yearsInBusiness: 1, gstRegistered: false });

    let result;
    beforeAll(() => { result = computeScore(records, retailer); });

    test('score should be < 600 (High Risk)', () => {
      expect(result.score).toBeLessThan(620);
    });

    test('riskBand should be High', () => {
      expect(result.riskBand).toBe('High');
    });

    test('probability of default should be > 0.5', () => {
      expect(result.probabilityOfDefault).toBeGreaterThan(0.4);
    });

    test('negativeTips should identify poor factors', () => {
      expect(result.negativeTips).toBeDefined();
      expect(result.negativeTips.length).toBeGreaterThan(0);
    });
  });

  // ─── EDGE CASES ─────────────────────────────────────────────────────────────
  describe('Edge Cases', () => {
    test('should throw error with fewer than 3 months', () => {
      const twoRecords = [
        { month: '2024-01', sales: 100000, expenses: 70000, inventoryValue: 200000, supplierPaymentsOnTime: 8, supplierPaymentsTotal: 10, existingLoanEMI: 5000, loanDefaultsCount: 0, digitalPaymentSharePct: 50 },
        { month: '2024-02', sales: 105000, expenses: 72000, inventoryValue: 205000, supplierPaymentsOnTime: 8, supplierPaymentsTotal: 10, existingLoanEMI: 5000, loanDefaultsCount: 0, digitalPaymentSharePct: 52 }
      ];
      expect(() => computeScore(twoRecords, makeRetailer())).toThrow();
    });

    test('score should always be in 300-900 range', () => {
      const records = Array.from({ length: 6 }, (_, i) => ({
        month: `2024-0${i + 1}`,
        sales: 50000,
        expenses: 49000,
        inventoryValue: 100000,
        supplierPaymentsOnTime: 5,
        supplierPaymentsTotal: 10,
        existingLoanEMI: 20000,
        loanDefaultsCount: 1,
        digitalPaymentSharePct: 10
      }));
      const result = computeScore(records, makeRetailer({ yearsInBusiness: 2, gstRegistered: false }));
      expect(result.score).toBeGreaterThanOrEqual(300);
      expect(result.score).toBeLessThanOrEqual(900);
    });
  });
});

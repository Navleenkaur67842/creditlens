const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err.name === 'ZodError') {
      const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return res.status(400).json({ success: false, message: messages.join('; ') });
    }
    next(err);
  }
};

const schemas = {
  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    role: z.enum(['retailer', 'admin']).optional().default('retailer')
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  }),

  retailerProfile: z.object({
    shopName: z.string().min(1, 'Shop name is required'),
    ownerName: z.string().min(2, 'Owner name is required'),
    city: z.string().min(1, 'City is required'),
    shopType: z.string().min(1, 'Shop type is required'),
    yearsInBusiness: z.number().min(0).max(100),
    gstRegistered: z.boolean(),
    phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits')
  }),

  financialRecord: z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be YYYY-MM format'),
    sales: z.number().min(0, 'Sales cannot be negative'),
    expenses: z.number().min(0, 'Expenses cannot be negative'),
    inventoryValue: z.number().min(0, 'Inventory value cannot be negative'),
    supplierPaymentsOnTime: z.number().min(0),
    supplierPaymentsTotal: z.number().min(0),
    existingLoanEMI: z.number().min(0),
    loanDefaultsCount: z.number().int().min(0),
    digitalPaymentSharePct: z.number().min(0).max(100)
  })
};

module.exports = { validate, schemas };

# CreditLens — AI Creditworthiness Assessment for Small Retailers

> An explainable AI credit scoring platform for kirana shops and small retailers with no formal credit history.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local: `mongodb://localhost:27017` or Atlas URI)

### Setup & Run

```bash
# 1. Clone / open the project
cd creditlens

# 2. Install all dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 3. Configure environment variables
cp server/.env.example server/.env   # edit as needed
cp client/.env.example client/.env   # edit as needed

# 4. Seed the database
npm run seed

# 5. Start both servers
npm run dev
```

- **Frontend**: http://localhost:5173  
- **Backend API**: http://localhost:5000/api

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@creditlens.com | Admin@123 |
| Retailer (Good) | sharma.general.store@example.com | Retailer@123 |
| Retailer (Avg) | singh.hardware@example.com | Retailer@123 |
| Retailer (Poor) | kumar.grocery@example.com | Retailer@123 |

---

## 🛠️ Environment Variables

### `server/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/creditlens` | MongoDB connection string |
| `JWT_SECRET` | (required) | Secret for signing JWT tokens |
| `CLIENT_URL` | `http://localhost:5173` | CORS allowed origin |
| `GEMINI_API_KEY` | (optional) | Enables AI-generated summaries |
| `NODE_ENV` | `development` | Environment |

### `client/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new retailer |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

### Retailer Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/retailers/me` | Retailer | Get own profile |
| PUT | `/api/retailers/me` | Retailer | Create / update profile |

### Financial Records
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/financials` | Retailer | Add / update monthly record |
| GET | `/api/financials` | Retailer | List all own records |
| DELETE | `/api/financials/:id` | Retailer | Delete a record |

### Assessments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/assessments/run` | Retailer | Compute new assessment (min 3 months) |
| GET | `/api/assessments/mine` | Retailer | List own assessment history |
| GET | `/api/assessments/:id` | Retailer/Admin | Get specific assessment |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/applicants` | Admin | List applicants (paginated, filterable) |
| GET | `/api/admin/applicants/:id` | Admin | Applicant detail |
| PATCH | `/api/admin/assessments/:id/status` | Admin | Approve / Reject / Flag |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |

---

## 🧠 Scoring Methodology

The scoring engine (`server/src/services/scoring.js`) uses an **explainable weighted linear model**:

### Features & Weights

| Feature | Weight | Description |
|---------|--------|-------------|
| Average Profit Margin | 20% | (Sales - Expenses) / Sales |
| Sales Growth Trend | 15% | Linear regression slope over months |
| Sales Stability | 10% | Inverse coefficient of variation |
| Debt-to-Income Ratio | 15% | Monthly EMI / Average monthly profit |
| Supplier Payment Timeliness | 15% | On-time payments / Total payments |
| Inventory Turnover | 8% | Average sales / Average inventory value |
| Years in Business | 7% | Capped at 20 years |
| GST Registration | 4% | Binary: registered or not |
| Digital Payment Share | 4% | % of sales via digital methods |
| Loan Default History | 2% | Inverse of defaults per month |

### Score Mapping
- Each feature is normalized to [0, 1]
- Weighted sum maps to **300–900** range
- **≥ 720** → Low Risk 🟢
- **600–719** → Medium Risk 🟡
- **< 600** → High Risk 🔴

### Probability of Default
Logistic function: `PD = 1 / (1 + e^(0.012 × (score − 600)))`

### Recommended Loan Limit
`Loan = avg_monthly_profit × (2 + score_percentile × 10) × dti_penalty`

### AI Summary (Optional)
If `GEMINI_API_KEY` is set, uses Google Gemini to generate a natural-language summary. Otherwise, a high-quality local template is used. **The app works fully without the key.**

---

## 🧪 Running Tests

```bash
npm test
# or
cd server && npm test
```

Tests cover the scoring engine for good, average, poor, and edge-case retailer profiles.

---

## 📁 Project Structure

```
creditlens/
├── package.json              # Root: concurrently dev script
├── server/
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── app.js            # Express app
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # REST API routes
│   │   ├── middleware/       # Auth, validation, errors
│   │   ├── services/         # Scoring engine
│   │   └── utils/            # DB connection
│   ├── tests/                # Jest unit tests
│   └── seed.js               # Database seeder
└── client/
    └── src/
        ├── App.jsx            # Router
        ├── context/           # AuthContext
        ├── pages/             # All pages
        ├── components/        # Shared components
        └── services/          # Axios API service
```

---

## 📸 Screenshots

*Run the app and navigate to see the UI. Key screens:*
- **Landing Page** — Hero with gradient, how-it-works, feature cards
- **Retailer Dashboard** — Credit score gauge, loan limit, trend charts
- **Financial Data** — Table with add/edit/delete/CSV import
- **Assessment Result** — Factor breakdown chart, tips, detailed table
- **Admin Dashboard** — Stats cards, risk pie chart, applicants table
- **Admin Detail** — Full applicant view with approve/reject/flag

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts, Axios |
| Backend | Node.js, Express, Mongoose, JWT, bcryptjs, Zod |
| Database | MongoDB (local or Atlas) |
| Testing | Jest |
| Dev Tools | Nodemon, Concurrently |

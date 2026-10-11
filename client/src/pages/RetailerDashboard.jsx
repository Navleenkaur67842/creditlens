import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import ScoreGauge from '../components/ScoreGauge'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function RetailerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [retailer, setRetailer] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [financials, setFinancials] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, aRes, fRes] = await Promise.all([
          api.get('/retailers/me').catch(() => ({ data: { data: null } })),
          api.get('/assessments/mine').catch(() => ({ data: { data: [] } })),
          api.get('/financials').catch(() => ({ data: { data: [] } }))
        ])
        setRetailer(rRes.data.data)
        setAssessments(aRes.data.data)
        setFinancials(fRes.data.data)
      } catch {
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleRunAssessment = async () => {
    setRunning(true)
    try {
      const res = await api.post('/assessments/run')
      const newAssessment = res.data.data
      setAssessments(prev => [newAssessment, ...prev])
      toast.success('Assessment completed! Score: ' + newAssessment.score)
      navigate(`/assessment/${newAssessment._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assessment failed')
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <LoadingSpinner fullScreen />

  const latest = assessments[0]
  const chartData = financials.slice(-6).map(f => ({
    month: f.month,
    Sales: f.sales,
    Expenses: f.expenses,
    Profit: f.sales - f.expenses
  }))
  const scoreHistory = assessments.slice(0, 6).reverse().map(a => ({
    date: new Date(a.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    Score: a.score
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {retailer?.ownerName || user?.name} 👋
          </h1>
          <p className="text-gray-500 mt-1">{retailer?.shopName || 'Complete your business profile to get started'}</p>
        </div>
        <div className="flex gap-3">
          {!retailer && (
            <Link to="/profile" className="btn-primary">Complete Profile</Link>
          )}
          {retailer && financials.length >= 3 && (
            <button onClick={handleRunAssessment} disabled={running} className="btn-primary">
              {running ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assessing...
                </span>
              ) : '🚀 Run New Assessment'}
            </button>
          )}
        </div>
      </div>

      {/* Profile incomplete banner */}
      {!retailer && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800">Profile Incomplete</p>
            <p className="text-amber-600 text-sm">Complete your business profile and add financial data to get your credit score.</p>
          </div>
          <Link to="/profile" className="btn-warning text-sm">Complete Now</Link>
        </div>
      )}

      {/* Financial data needed */}
      {retailer && financials.length < 3 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-800">Add Financial Data</p>
            <p className="text-blue-600 text-sm">You need at least 3 months of financial data. You have {financials.length} month(s).</p>
          </div>
          <Link to="/financials" className="btn-primary text-sm">Add Data</Link>
        </div>
      )}

      {/* Score Section */}
      {latest ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Score Gauge */}
          <div className="card flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Latest Credit Score</h2>
            <ScoreGauge score={latest.score} />
            <RiskBadge band={latest.riskBand} size="lg" />
            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Default Risk</p>
                <p className="font-bold text-gray-800">{(latest.probabilityOfDefault * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Status</p>
                <span className={`badge-${latest.status} text-xs`}>{latest.status}</span>
              </div>
            </div>
          </div>

          {/* Loan Limit */}
          <div className="card flex flex-col justify-center">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Recommended Loan Limit</h2>
            <p className="text-4xl font-bold text-blue-600 mb-2">{fmt(latest.recommendedLoanLimit)}</p>
            <p className="text-sm text-gray-500 mb-4">Based on your business profile and financial history</p>
            <Link to={`/assessment/${latest._id}`} className="btn-secondary text-sm">
              View Full Report →
            </Link>
          </div>

          {/* Score Trend */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Score History</h2>
            {scoreHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[300, 900]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Score" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Run more assessments to see trend</p>
            )}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 mb-8">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Assessments Yet</h2>
          <p className="text-gray-500 mb-4">Add at least 3 months of financial data and run your first assessment</p>
          <Link to="/financials" className="btn-primary">Add Financial Data</Link>
        </div>
      )}

      {/* Financial Charts */}
      {chartData.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Sales vs Expenses (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend />
              <Bar dataKey="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Assessment History */}
      {assessments.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700">Assessment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Score', 'Risk Band', 'Loan Limit', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assessments.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(a.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{a.score}</td>
                    <td className="px-4 py-3"><RiskBadge band={a.riskBand} /></td>
                    <td className="px-4 py-3 text-sm">{fmt(a.recommendedLoanLimit)}</td>
                    <td className="px-4 py-3"><span className={`badge-${a.status}`}>{a.status}</span></td>
                    <td className="px-4 py-3">
                      <Link to={`/assessment/${a._id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

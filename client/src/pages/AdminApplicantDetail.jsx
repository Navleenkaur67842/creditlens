import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import RiskBadge from '../components/RiskBadge'

/* ── helpers ── */
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value ?? '—'}</span>
    </div>
  )
}

function ScoreMeter({ score }) {
  const pct = ((score - 300) / 600) * 100
  const color =
    score >= 700 ? 'bg-emerald-500'
    : score >= 550 ? 'bg-amber-500'
    : 'bg-red-500'
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>300</span>
        <span className="font-bold text-gray-700 text-base">{score}</span>
        <span>900</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
        />
      </div>
    </div>
  )
}

const STATUS_BUTTON = {
  approved: { label: '✅ Approve', cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  rejected: { label: '❌ Reject',  cls: 'bg-red-600 hover:bg-red-700 text-white' },
  flagged:  { label: '🚩 Flag',    cls: 'bg-amber-500 hover:bg-amber-600 text-white' }
}

export default function AdminApplicantDetail() {
  const { retailerId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    api.get(`/admin/applicants/${retailerId}`)
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load applicant details'))
      .finally(() => setLoading(false))
  }, [retailerId])

  const handleStatusChange = async (newStatus) => {
    if (!data?.latestAssessment?._id) return
    setActionLoading(true)
    try {
      const r = await api.patch(`/admin/assessments/${data.latestAssessment._id}/status`, { status: newStatus })
      setData(prev => ({
        ...prev,
        latestAssessment: { ...prev.latestAssessment, status: newStatus },
        assessments: prev.assessments.map(a =>
          a._id === data.latestAssessment._id ? { ...a, status: newStatus } : a
        )
      }))
      toast.success(`Assessment ${newStatus} successfully`)
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to update status`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (!data) return (
    <div className="flex flex-col items-center justify-center h-64">
      <p className="text-gray-400 text-lg">Applicant not found</p>
      <Link to="/admin" className="mt-4 btn-primary">← Back to Dashboard</Link>
    </div>
  )

  const { retailer, latestAssessment, assessments } = data

  /* Factor breakdown chart data */
  const factorData = latestAssessment?.factors
    ? Object.entries(latestAssessment.factors).map(([name, contribution]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        contribution: parseFloat(contribution.toFixed(2))
      })).sort((a, b) => b.contribution - a.contribution)
    : []

  /* Financial history chart data */
  const finHistory = retailer?.financialHistory
    ? retailer.financialHistory.map(m => ({
        month: m.month,
        Sales: m.sales,
        Expenses: m.expenses
      }))
    : []

  /* Improvement tips: negative-contribution factors */
  const tips = factorData.filter(f => f.contribution < 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* Back + Header */}
      <div>
        <Link to="/admin" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4">
          ← Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{retailer.shopName}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {retailer.user?.name} · {retailer.city} · {retailer.shopType}
            </p>
          </div>
          {latestAssessment && (
            <div className="flex items-center gap-2">
              <RiskBadge band={latestAssessment.riskBand} />
              <span className={`badge-${latestAssessment.status}`}>{latestAssessment.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Retailer Info + Assessment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Retailer Info */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">📋 Retailer Profile</h2>
          <InfoRow label="Owner"              value={retailer.user?.name} />
          <InfoRow label="Email"              value={retailer.user?.email} />
          <InfoRow label="Phone"              value={retailer.phone} />
          <InfoRow label="City"               value={retailer.city} />
          <InfoRow label="Shop Type"          value={retailer.shopType} />
          <InfoRow label="Years in Business"  value={retailer.yearsInBusiness} />
          <InfoRow label="GST Number"         value={retailer.gstNumber || 'Not provided'} />
          <InfoRow label="Profile Status"     value={retailer.profileStatus} />
        </div>

        {/* Latest Assessment Summary */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">🏆 Latest Assessment</h2>
          {latestAssessment ? (
            <div className="space-y-3">
              <ScoreMeter score={latestAssessment.score} />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-500 mb-1">Default Probability</p>
                  <p className="text-xl font-bold text-blue-700">
                    {(latestAssessment.probabilityOfDefault * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-600 mb-1">Recommended Limit</p>
                  <p className="text-xl font-bold text-emerald-700">
                    ₹{(latestAssessment.recommendedLoanLimit ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              {latestAssessment.summary && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-2 leading-relaxed">
                  {latestAssessment.summary}
                </p>
              )}
              {/* Action buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                {Object.entries(STATUS_BUTTON).map(([s, { label, cls }]) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={actionLoading || latestAssessment.status === s}
                    className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
                  >
                    {actionLoading && latestAssessment.status !== s ? '…' : label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p>No assessment available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Factor Breakdown Chart */}
      {factorData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">📊 Score Factor Breakdown</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={factorData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={v => v > 0 ? `+${v}` : v}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
              <Tooltip
                formatter={(v) => [v > 0 ? `+${v}` : v, 'Contribution']}
              />
              <ReferenceLine x={0} stroke="#d1d5db" />
              <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                {factorData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.contribution >= 0 ? '#3b82f6' : '#ef4444'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Improvement Tips */}
      {tips.length > 0 && (
        <div className="card border-l-4 border-amber-400">
          <h2 className="font-semibold text-gray-800 mb-3">💡 Improvement Suggestions</h2>
          <ul className="space-y-2">
            {tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-amber-500 mt-0.5">▸</span>
                <span>
                  <strong>{t.name}</strong> is dragging the score down by{' '}
                  <span className="text-red-600 font-semibold">{Math.abs(t.contribution)} pts</span>.
                  Improving this metric will positively impact the credit score.
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Financial History */}
      {finHistory.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">💰 Financial History</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={finHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, '']} />
              <Legend />
              <Bar dataKey="Sales"    fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Expenses" fill="#f87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Assessment History Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">🗂 Assessment History</h2>
        </div>
        {assessments && assessments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Score', 'Risk Band', 'Prob. of Default', 'Loan Limit', 'Status'].map(h => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assessments.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(a.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">{a.score}</td>
                    <td className="px-4 py-3"><RiskBadge band={a.riskBand} /></td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {(a.probabilityOfDefault * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      ₹{(a.recommendedLoanLimit ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-${a.status}`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-400">No assessment history found</div>
        )}
      </div>
    </div>
  )
}

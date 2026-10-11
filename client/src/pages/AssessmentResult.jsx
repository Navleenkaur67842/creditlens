import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import api from '../services/api'
import ScoreGauge from '../components/ScoreGauge'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'

const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
const pct = n => `${(n * 100).toFixed(1)}%`

export default function AssessmentResult() {
  const { id } = useParams()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/assessments/${id}`)
      .then(res => setAssessment(res.data.data))
      .catch(() => toast.error('Failed to load assessment'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner fullScreen />
  if (!assessment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Assessment Not Found</h2>
        <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    )
  }

  const { score, riskBand, probabilityOfDefault, recommendedLoanLimit, factorBreakdown, summary, status, monthsAnalyzed, createdAt } = assessment

  // Prepare chart data — sort by contribution descending
  const chartData = [...factorBreakdown]
    .sort((a, b) => b.contribution - a.contribution)
    .map(f => ({
      name: f.factor.replace('Average ', '').replace('Ratio', 'Ratio').split(' ').slice(0, 3).join(' '),
      contribution: parseFloat(f.contribution.toFixed(2)),
      impact: f.impact
    }))

  const positiveFactors = factorBreakdown.filter(f => f.impact === 'positive').sort((a, b) => b.contribution - a.contribution)
  const negativeFactors = factorBreakdown.filter(f => f.impact === 'negative').sort((a, b) => a.contribution - b.contribution)

  const bandColor = riskBand === 'Low' ? '#10b981' : riskBand === 'Medium' ? '#f59e0b' : '#ef4444'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/dashboard" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Credit Assessment Report</h1>
          <p className="text-gray-500 mt-1">
            Generated on {new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            {monthsAnalyzed && ` • Based on ${monthsAnalyzed} months of data`}
          </p>
        </div>
        <span className={`badge-${status} text-sm px-3 py-1`}>{status}</span>
      </div>

      {/* Top summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Score Gauge */}
        <div className="card flex flex-col items-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Credit Score</h2>
          <ScoreGauge score={score} />
          <RiskBadge band={riskBand} size="lg" />
        </div>

        {/* Key Metrics */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Key Metrics</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Score</span>
              <span className="font-bold text-lg" style={{ color: bandColor }}>{score}/900</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Default Probability</span>
              <span className={`font-semibold ${probabilityOfDefault > 0.5 ? 'text-red-500' : probabilityOfDefault > 0.25 ? 'text-amber-500' : 'text-emerald-600'}`}>{pct(probabilityOfDefault)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Risk Category</span>
              <RiskBadge band={riskBand} />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Recommended Loan</span>
              <span className="font-bold text-blue-600">{fmt(recommendedLoanLimit)}</span>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Assessment Summary</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
        </div>
      </div>

      {/* Factor Breakdown Chart */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Factor Breakdown</h2>
        <p className="text-sm text-gray-500 mb-4">Contribution of each factor to your credit score (higher is better)</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 130, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 'auto']} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={125} />
            <Tooltip formatter={(v, n) => [`${v}%`, 'Contribution']} />
            <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.impact === 'positive' ? '#3b82f6' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500" /> Positive impact</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500" /> Needs improvement</div>
        </div>
      </div>

      {/* Positive & Negative factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Strengths */}
        <div className="card">
          <h2 className="text-lg font-semibold text-emerald-700 mb-3">✅ Strengths</h2>
          {positiveFactors.length === 0 ? (
            <p className="text-gray-400 text-sm">No strong positive factors identified</p>
          ) : (
            <div className="space-y-2">
              {positiveFactors.map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{f.factor}</p>
                    <p className="text-xs text-gray-500">Score contribution: {f.contribution.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Areas to Improve */}
        <div className="card">
          <h2 className="text-lg font-semibold text-red-600 mb-3">⚠️ Areas to Improve</h2>
          {negativeFactors.length === 0 ? (
            <p className="text-gray-400 text-sm">All factors look good!</p>
          ) : (
            <div className="space-y-2">
              {negativeFactors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{f.factor}</p>
                    <p className="text-xs text-gray-500">Score contribution: {f.contribution.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Improvement Tips */}
      {negativeFactors.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">💡 Improvement Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {negativeFactors.slice(0, 4).map((f, i) => (
              <div key={i} className="border border-amber-200 rounded-xl p-4 bg-amber-50">
                <p className="text-sm font-semibold text-amber-800 mb-1">{f.factor}</p>
                <p className="text-sm text-amber-700">{f.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Factors Detail Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700">Detailed Factor Analysis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Factor', 'Weight', 'Score (0-1)', 'Contribution', 'Impact'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {factorBreakdown.map((f, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{f.factor}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{f.weight}%</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${f.impact === 'positive' ? 'bg-blue-500' : 'bg-red-400'}`}
                          style={{ width: `${(f.value * 100).toFixed(0)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-10">{(f.value * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{f.contribution.toFixed(2)}%</td>
                  <td className="px-4 py-3">
                    <span className={f.impact === 'positive' ? 'badge-low' : 'badge-high'}>
                      {f.impact === 'positive' ? '↑ Positive' : '↓ Improve'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Link to="/dashboard" className="btn-secondary">← Back to Dashboard</Link>
        <Link to="/financials" className="btn-primary">Update Financial Data</Link>
      </div>
    </div>
  )
}

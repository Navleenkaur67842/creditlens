import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import RiskBadge from '../components/RiskBadge'

const RISK_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' }
const STATUS_COLORS = {
  pending: '#6b7280',
  approved: '#10b981',
  rejected: '#ef4444',
  flagged: '#f59e0b'
}

function StatCard({ label, value, icon, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600'
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 })
  const [search, setSearch] = useState('')
  const [riskBand, setRiskBand] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data.data))
      .catch(() => toast.error('Failed to load stats'))
  }, [])

  const fetchApplicants = useCallback(async (page = 1) => {
    setTableLoading(true)
    try {
      const params = { page, limit: 10, search, riskBand, status }
      const r = await api.get('/admin/applicants', { params })
      setApplicants(r.data.data.applicants)
      setPagination(r.data.data.pagination)
    } catch {
      toast.error('Failed to load applicants')
    } finally {
      setTableLoading(false)
      setLoading(false)
    }
  }, [search, riskBand, status])

  useEffect(() => {
    fetchApplicants(1)
  }, [fetchApplicants])

  const pieData = stats
    ? Object.entries(stats.byRiskBand).map(([name, value]) => ({ name, value }))
    : []

  const barData = stats
    ? Object.entries(stats.byStatus).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        fill: STATUS_COLORS[name]
      }))
    : []

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage retailer assessments and applications</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Retailers"    value={stats?.totalRetailers ?? 0}          icon="🏪" color="blue"   />
        <StatCard label="Average Score"      value={stats?.averageScore ?? 0}             icon="📊" color="purple" />
        <StatCard label="Approval Rate"      value={`${stats?.approvalRate ?? 0}%`}       icon="✅" color="green"  />
        <StatCard label="Total Assessments"  value={stats?.totalAssessments ?? 0}         icon="📋" color="amber"  />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Risk Band Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No data available</p>
          )}
        </div>

        {/* Bar Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Applications by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name, shop, or city..."
            className="input flex-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="input w-40"
            value={riskBand}
            onChange={e => setRiskBand(e.target.value)}
          >
            <option value="">All Risks</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select
            className="input w-40"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Applicants Table */}
      <div className="card overflow-hidden p-0">
        {tableLoading ? (
          <LoadingSpinner />
        ) : applicants.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-gray-400 text-lg">No applicants found</p>
            <p className="text-gray-300 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Shop Name', 'Owner', 'City', 'Risk', 'Score', 'Status', 'Date', ''].map(h => (
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
                {applicants.map(({ retailer, assessment }) => (
                  <tr key={retailer._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 text-sm">{retailer.shopName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{retailer.user?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{retailer.city}</td>
                    <td className="px-4 py-3">
                      {assessment
                        ? <RiskBadge band={assessment.riskBand} />
                        : <span className="badge-pending">No Assessment</span>
                      }
                    </td>
                    <td className="px-4 py-3 font-semibold text-sm text-gray-800">
                      {assessment?.score ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-${assessment?.status || 'pending'}`}>
                        {assessment?.status || 'no data'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {assessment
                        ? new Date(assessment.createdAt).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/applicants/${retailer._id}`}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {applicants.length} of {pagination.total}
            </p>
            <div className="flex gap-2 items-center">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchApplicants(pagination.page - 1)}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600 px-2 py-1.5 font-medium">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchApplicants(pagination.page + 1)}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

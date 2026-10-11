import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const EMPTY_FORM = {
  month: '', sales: '', expenses: '', inventoryValue: '',
  supplierPaymentsOnTime: '', supplierPaymentsTotal: '',
  existingLoanEMI: '0', loanDefaultsCount: '0', digitalPaymentSharePct: '0'
}

const FIELDS = [
  { key: 'sales', label: 'Monthly Sales (₹)', hint: 'Total revenue for the month' },
  { key: 'expenses', label: 'Monthly Expenses (₹)', hint: 'All business expenses including rent, salaries, utilities' },
  { key: 'inventoryValue', label: 'Inventory Value (₹)', hint: 'Current value of stock on hand' },
  { key: 'supplierPaymentsOnTime', label: 'Supplier Payments On Time', hint: 'Number of supplier payments made on time' },
  { key: 'supplierPaymentsTotal', label: 'Total Supplier Payments', hint: 'Total number of supplier payments due' },
  { key: 'existingLoanEMI', label: 'Monthly Loan EMI (₹)', hint: 'Total EMI for all existing loans (0 if none)' },
  { key: 'loanDefaultsCount', label: 'Loan Defaults This Month', hint: 'Number of loan payments missed this month' },
  { key: 'digitalPaymentSharePct', label: 'Digital Payment Share (%)', hint: 'Percentage of sales collected via UPI, cards, etc.' }
]

const fmt = n => new Intl.NumberFormat('en-IN').format(n)

function parseCSVData(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = vals[i] || '' })
    return obj
  })
}

export default function FinancialData() {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    api.get('/financials')
      .then(res => setRecords(res.data.data))
      .catch(() => toast.error('Failed to load financial records'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.month) return toast.error('Please select a month')
    const numFields = ['sales', 'expenses', 'inventoryValue', 'supplierPaymentsOnTime', 'supplierPaymentsTotal', 'existingLoanEMI', 'loanDefaultsCount', 'digitalPaymentSharePct']
    for (const f of numFields) {
      if (form[f] === '' || isNaN(parseFloat(form[f]))) return toast.error(`Invalid value for ${f}`)
    }
    if (parseFloat(form.digitalPaymentSharePct) > 100) return toast.error('Digital payment share cannot exceed 100%')
    if (parseFloat(form.supplierPaymentsOnTime) > parseFloat(form.supplierPaymentsTotal)) return toast.error('On-time payments cannot exceed total payments')

    setSaving(true)
    try {
      const body = { ...form }
      numFields.forEach(f => { body[f] = parseFloat(body[f]) })
      const res = await api.post('/financials', body)
      const updated = res.data.data
      setRecords(prev => {
        const existing = prev.findIndex(r => r.month === updated.month)
        if (existing >= 0) { const n = [...prev]; n[existing] = updated; return n }
        return [...prev, updated].sort((a, b) => a.month.localeCompare(b.month))
      })
      toast.success(`Record for ${form.month} saved!`)
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save record')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return
    try {
      await api.delete(`/financials/${id}`)
      setRecords(prev => prev.filter(r => r._id !== id))
      toast.success('Record deleted')
    } catch {
      toast.error('Failed to delete record')
    }
  }

  const handleEdit = record => {
    setForm({
      month: record.month,
      sales: record.sales.toString(),
      expenses: record.expenses.toString(),
      inventoryValue: record.inventoryValue.toString(),
      supplierPaymentsOnTime: record.supplierPaymentsOnTime.toString(),
      supplierPaymentsTotal: record.supplierPaymentsTotal.toString(),
      existingLoanEMI: record.existingLoanEMI.toString(),
      loanDefaultsCount: record.loanDefaultsCount.toString(),
      digitalPaymentSharePct: record.digitalPaymentSharePct.toString()
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const rows = parseCSVData(ev.target.result)
        if (rows.length === 0) return toast.error('No valid rows found in CSV')
        let success = 0, failed = 0
        for (const row of rows) {
          try {
            const body = {
              month: row.month || row['month'],
              sales: parseFloat(row.sales || row['sales'] || 0),
              expenses: parseFloat(row.expenses || row['expenses'] || 0),
              inventoryValue: parseFloat(row.inventoryvalue || row['inventory_value'] || row['inventoryValue'] || 0),
              supplierPaymentsOnTime: parseFloat(row.supplierpaymentsonttime || row['supplier_payments_on_time'] || row['supplierPaymentsOnTime'] || 0),
              supplierPaymentsTotal: parseFloat(row.supplierPaymentsTotal || row['supplier_payments_total'] || row['supplierpaymentsTotal'] || 10),
              existingLoanEMI: parseFloat(row.existingLoanEMI || row['existing_loan_emi'] || row['existingloanemi'] || 0),
              loanDefaultsCount: parseInt(row.loanDefaultsCount || row['loan_defaults_count'] || row['loandefaultscount'] || 0),
              digitalPaymentSharePct: parseFloat(row.digitalPaymentSharePct || row['digital_payment_share_pct'] || row['digitalpaymentshare'] || 0)
            }
            const res = await api.post('/financials', body)
            setRecords(prev => {
              const existing = prev.findIndex(r => r.month === res.data.data.month)
              const updated = res.data.data
              if (existing >= 0) { const n = [...prev]; n[existing] = updated; return n }
              return [...prev, updated].sort((a, b) => a.month.localeCompare(b.month))
            })
            success++
          } catch { failed++ }
        }
        toast.success(`Imported ${success} records${failed > 0 ? `, ${failed} failed` : ''}`)
      } catch { toast.error('Failed to parse CSV') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Data</h1>
          <p className="text-gray-500 mt-1">Add monthly financial records to enable credit assessment. Minimum 3 months required.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current.click()} className="btn-secondary text-sm">
            📂 Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button onClick={() => setShowForm(f => !f)} className="btn-primary text-sm">
            {showForm ? 'Cancel' : '+ Add Month'}
          </button>
        </div>
      </div>

      {/* CSV template download hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 text-sm text-blue-700">
        <strong>CSV format:</strong> month,sales,expenses,inventoryValue,supplierPaymentsOnTime,supplierPaymentsTotal,existingLoanEMI,loanDefaultsCount,digitalPaymentSharePct
        <br />Example: 2024-01,150000,90000,200000,8,10,5000,0,40
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-6 border-2 border-blue-100">
          <h2 className="text-lg font-semibold mb-4">{form.month && records.find(r => r.month === form.month) ? `Edit Record — ${form.month}` : 'Add Monthly Record'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="label">Month (YYYY-MM) *</label>
              <input type="month" name="month" value={form.month} onChange={handleChange} className="input w-48" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {FIELDS.map(({ key, label, hint }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    type="number"
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    className="input"
                    min="0"
                    step={key === 'digitalPaymentSharePct' ? '1' : '1'}
                    max={key === 'digitalPaymentSharePct' ? '100' : undefined}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">{hint}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Record'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Financial Records Yet</h3>
          <p className="text-gray-400 mb-4">Start by adding your monthly financial data</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Add First Month</button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Month', 'Sales', 'Expenses', 'Profit', 'Inventory', 'Supplier OT', 'Loan EMI', 'Defaults', 'Digital%', ''].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => {
                  const profit = r.sales - r.expenses
                  return (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 font-medium text-sm text-gray-900">{r.month}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">₹{fmt(r.sales)}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">₹{fmt(r.expenses)}</td>
                      <td className={`px-3 py-3 text-sm font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {profit >= 0 ? '+' : ''}₹{fmt(profit)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">₹{fmt(r.inventoryValue)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{r.supplierPaymentsOnTime}/{r.supplierPaymentsTotal}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">₹{fmt(r.existingLoanEMI)}</td>
                      <td className={`px-3 py-3 text-sm font-medium ${r.loanDefaultsCount > 0 ? 'text-red-500' : 'text-gray-500'}`}>{r.loanDefaultsCount}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{r.digitalPaymentSharePct}%</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(r)} className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors">Edit</button>
                          <button onClick={() => handleDelete(r._id)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors">Del</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{records.length} month{records.length !== 1 ? 's' : ''} of data</p>
            {records.length < 3 && (
              <p className="text-sm text-amber-600 font-medium">⚠️ Need at least 3 months for assessment</p>
            )}
            {records.length >= 3 && (
              <p className="text-sm text-emerald-600 font-medium">✅ Ready for assessment!</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

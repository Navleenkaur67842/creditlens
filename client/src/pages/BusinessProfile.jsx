import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const SHOP_TYPES = ['Kirana', 'Grocery', 'Electronics', 'Pharmacy', 'Clothing', 'Hardware', 'Dairy', 'Bakery', 'Stationery', 'Auto Parts', 'Tailoring', 'Restaurant', 'Mobile/Recharge', 'Pan/Tobacco', 'Other']

export default function BusinessProfile() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    shopName: '', ownerName: '', city: '', shopType: '',
    yearsInBusiness: '', gstRegistered: false, phone: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/retailers/me')
      .then(res => {
        const d = res.data.data
        if (d) setForm({
          shopName: d.shopName || '',
          ownerName: d.ownerName || '',
          city: d.city || '',
          shopType: d.shopType || '',
          yearsInBusiness: d.yearsInBusiness ?? '',
          gstRegistered: d.gstRegistered || false,
          phone: d.phone || ''
        })
      })
      .catch(() => {}) // Profile may not exist yet
      .finally(() => setLoading(false))
  }, [])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!/^\d{10}$/.test(form.phone)) return toast.error('Phone must be 10 digits')
    const years = parseFloat(form.yearsInBusiness)
    if (isNaN(years) || years < 0) return toast.error('Years in business must be a positive number')

    setSaving(true)
    try {
      await api.put('/retailers/me', { ...form, yearsInBusiness: years })
      toast.success('Profile saved successfully!')
      navigate('/financials')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
        <p className="text-gray-500 mt-1">Tell us about your shop so we can assess your creditworthiness</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Shop / Business Name *</label>
              <input type="text" name="shopName" value={form.shopName} onChange={handleChange} className="input" placeholder="Sharma General Store" required />
            </div>
            <div>
              <label className="label">Owner Name *</label>
              <input type="text" name="ownerName" value={form.ownerName} onChange={handleChange} className="input" placeholder="Ramesh Sharma" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">City *</label>
              <input type="text" name="city" value={form.city} onChange={handleChange} className="input" placeholder="Delhi" required />
            </div>
            <div>
              <label className="label">Shop Type *</label>
              <select name="shopType" value={form.shopType} onChange={handleChange} className="input" required>
                <option value="">Select type...</option>
                {SHOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Years in Business *</label>
              <input type="number" name="yearsInBusiness" value={form.yearsInBusiness} onChange={handleChange} className="input" placeholder="5" min="0" max="100" step="0.5" required />
            </div>
            <div>
              <label className="label">Mobile Number *</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="9876543210" maxLength={10} required />
            </div>
          </div>

          {/* GST Registration */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="gstRegistered"
              name="gstRegistered"
              checked={form.gstRegistered}
              onChange={handleChange}
              className="w-5 h-5 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="gstRegistered" className="cursor-pointer">
              <p className="font-medium text-gray-900">GST Registered</p>
              <p className="text-sm text-gray-500">GST registration improves your credit score and opens formal credit channels</p>
            </label>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <strong>📌 Why we collect this:</strong> Your business profile helps calibrate the scoring model. All data is used only for your credit assessment.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
              {saving ? (
                <span className="flex items-center gap-2 justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Save Profile & Continue →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

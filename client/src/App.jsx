import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import RetailerDashboard from './pages/RetailerDashboard'
import BusinessProfile from './pages/BusinessProfile'
import FinancialData from './pages/FinancialData'
import AssessmentResult from './pages/AssessmentResult'
import AdminDashboard from './pages/AdminDashboard'
import AdminApplicantDetail from './pages/AdminApplicantDetail'
import LoadingSpinner from './components/LoadingSpinner'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

          {/* Retailer routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute role="retailer"><RetailerDashboard /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute role="retailer"><BusinessProfile /></ProtectedRoute>
          } />
          <Route path="/financials" element={
            <ProtectedRoute role="retailer"><FinancialData /></ProtectedRoute>
          } />
          <Route path="/assessment/:id" element={
            <ProtectedRoute role="retailer"><AssessmentResult /></ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/applicants/:id" element={
            <ProtectedRoute role="admin"><AdminApplicantDetail /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

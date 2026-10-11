export default function RiskBadge({ band, size = 'md' }) {
  if (!band) return null

  const classMap = {
    Low: 'badge-low',
    Medium: 'badge-medium',
    High: 'badge-high'
  }

  const iconMap = {
    Low: '✅',
    Medium: '⚠️',
    High: '🔴'
  }

  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2.5 py-0.5'

  return (
    <span className={`${classMap[band] || 'badge-pending'} ${sizeClass} font-semibold`}>
      {iconMap[band]} {band} Risk
    </span>
  )
}

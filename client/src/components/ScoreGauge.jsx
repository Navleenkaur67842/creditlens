/**
 * ScoreGauge - SVG arc gauge for credit score display
 * Score range: 300-900
 */
export default function ScoreGauge({ score }) {
  if (!score) return null

  const min = 300
  const max = 900
  const normalised = (score - min) / (max - min) // 0-1
  const angle = normalised * 180 // 0-180 degrees

  // SVG arc parameters
  const cx = 100
  const cy = 95
  const r = 75
  const startAngle = 180
  const endAngle = startAngle + angle

  const toRad = deg => (deg * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))

  const bgX1 = cx + r * Math.cos(toRad(180))
  const bgY1 = cy + r * Math.sin(toRad(180))
  const bgX2 = cx + r * Math.cos(toRad(360))
  const bgY2 = cy + r * Math.sin(toRad(360))

  const largeArc = angle > 180 ? 1 : 0

  let color, riskBand
  if (score >= 720) { color = '#10b981'; riskBand = 'Low Risk' }
  else if (score >= 600) { color = '#f59e0b'; riskBand = 'Medium Risk' }
  else { color = '#ef4444'; riskBand = 'High Risk' }

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d={`M ${bgX1} ${bgY1} A ${r} ${r} 0 0 1 ${bgX2} ${bgY2}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Score arc */}
        {angle > 0 && (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
          />
        )}
        {/* Score text */}
        <text x={cx} y={cy + 5} textAnchor="middle" className="text-4xl font-bold" fill={color} fontSize="28" fontWeight="700">
          {score}
        </text>
        {/* Min/Max labels */}
        <text x="22" y="105" fill="#9ca3af" fontSize="10">300</text>
        <text x="165" y="105" fill="#9ca3af" fontSize="10">900</text>
      </svg>
      <span className="text-sm font-semibold mt-1" style={{ color }}>{riskBand}</span>
    </div>
  )
}

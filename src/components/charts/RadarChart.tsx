interface RadarDataPoint {
  label: string
  value: number
}

interface RadarChartProps {
  data: RadarDataPoint[]
  color: string
  size?: number
}

export default function RadarChart({ data, color, size = 120 }: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 20
  const n = data.length
  const angleStep = (2 * Math.PI) / n

  const getPoint = (i: number, val: number) => {
    const angle = angleStep * i - Math.PI / 2
    const dist = (val / 100) * r
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
    }
  }

  // Grid rings
  const rings = [25, 50, 75, 100]
  const gridPaths = rings.map((pct) => {
    const pts = Array.from({ length: n }, (_, i) => getPoint(i, pct))
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  })

  // Data polygon
  const dataPts = data.map((d, i) => getPoint(i, d.value))
  const dataPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  // Axis lines
  const axisEnds = Array.from({ length: n }, (_, i) => getPoint(i, 100))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {gridPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--color-surface-border)" strokeWidth={0.5} opacity={0.5} />
      ))}

      {/* Axis lines */}
      {axisEnds.map((end, i) => (
        <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--color-surface-border)" strokeWidth={0.5} opacity={0.3} />
      ))}

      {/* Data fill */}
      <path d={dataPath} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.5} />

      {/* Data points */}
      {dataPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}

      {/* Labels */}
      {data.map((d, i) => {
        const labelPt = getPoint(i, 120)
        return (
          <text
            key={i}
            x={labelPt.x}
            y={labelPt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill="var(--color-espresso-300)"
            fontWeight={600}
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

interface RadarChartProps {
  labels: string[]
  values: number[]   // 0-20 each
  maxValue?: number
  size?: number
  color?: string
}

export default function RadarChart({
  labels,
  values,
  maxValue = 20,
  size = 200,
  color = '#3b82f6',
}: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 30
  const n = labels.length

  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2

  function getPoint(i: number, val: number) {
    const angle = startAngle + i * angleStep
    const ratio = val / maxValue
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle),
    }
  }

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1]
  const gridLines = rings.map((ring) => {
    const points = Array.from({ length: n }, (_, i) => {
      const angle = startAngle + i * angleStep
      return `${cx + r * ring * Math.cos(angle)},${cy + r * ring * Math.sin(angle)}`
    })
    return points.join(' ')
  })

  // Axes
  const axes = Array.from({ length: n }, (_, i) => {
    const angle = startAngle + i * angleStep
    return {
      x2: cx + r * Math.cos(angle),
      y2: cy + r * Math.sin(angle),
    }
  })

  // Data polygon
  const dataPoints = values.map((v, i) => {
    const p = getPoint(i, v)
    return `${p.x},${p.y}`
  })

  // Label positions
  const labelPositions = labels.map((label, i) => {
    const angle = startAngle + i * angleStep
    const labelR = r + 18
    return {
      label,
      x: cx + labelR * Math.cos(angle),
      y: cy + labelR * Math.sin(angle),
      value: values[i],
    }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {gridLines.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="#2a3348"
          strokeWidth={1}
          opacity={0.6}
        />
      ))}

      {/* Axes */}
      {axes.map((axis, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={axis.x2}
          y2={axis.y2}
          stroke="#2a3348"
          strokeWidth={1}
          opacity={0.4}
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={dataPoints.join(' ')}
        fill={`${color}20`}
        stroke={color}
        strokeWidth={2}
      />

      {/* Data points */}
      {values.map((v, i) => {
        const p = getPoint(i, v)
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={color}
          />
        )
      })}

      {/* Labels */}
      {labelPositions.map((lp, i) => (
        <text
          key={i}
          x={lp.x}
          y={lp.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[9px] fill-gray-400"
        >
          {lp.label} ({lp.value})
        </text>
      ))}
    </svg>
  )
}

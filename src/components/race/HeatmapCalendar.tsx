import { useMemo, useState } from 'react'

interface DayData {
  date: string
  value: number
}

interface HeatmapCalendarProps {
  year: number
  data: DayData[]
  colorScale?: string[]
}

function getWeekDay(dateStr: string) {
  return new Date(dateStr).getDay()
}

function getDaysInYear(year: number) {
  const days: string[] = []
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export default function HeatmapCalendar({ year, data, colorScale }: HeatmapCalendarProps) {
  const [tooltip, setTooltip] = useState<{ date: string; value: number; x: number; y: number } | null>(null)

  const colors = colorScale ?? ['#302920', '#5c4a28', '#d97706', '#f59e0b', '#fbbf24']

  const { grid, maxVal } = useMemo(() => {
    const dataMap = new Map(data.map((d) => [d.date, d.value]))
    const allDays = getDaysInYear(year)
    const maxVal = Math.max(1, ...data.map((d) => d.value))

    // Group by week
    const weeks: { date: string; value: number; weekDay: number }[][] = []
    let currentWeek: typeof weeks[0] = []

    for (const date of allDays) {
      const wd = getWeekDay(date)
      if (wd === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push({ date, value: dataMap.get(date) ?? 0, weekDay: wd })
    }
    if (currentWeek.length > 0) weeks.push(currentWeek)

    return { grid: weeks, maxVal }
  }, [year, data])

  function getColor(value: number) {
    if (value === 0) return colors[0]
    const ratio = value / maxVal
    if (ratio < 0.25) return colors[1]
    if (ratio < 0.5) return colors[2]
    if (ratio < 0.75) return colors[3]
    return colors[4]
  }

  const cellSize = 12
  const monthLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <div className="flex gap-[2px] min-w-fit">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {Array.from({ length: 7 }, (_, dayIdx) => {
                const cell = week.find((c) => c.weekDay === dayIdx)
                if (!cell) return <div key={dayIdx} style={{ width: cellSize, height: cellSize }} />
                return (
                  <div
                    key={dayIdx}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: getColor(cell.value),
                      borderRadius: 2,
                    }}
                    className="cursor-pointer hover:ring-1 hover:ring-white/30 transition-all"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({ date: cell.date, value: cell.value, x: rect.left, y: rect.top - 30 })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mt-1" style={{ paddingLeft: 0 }}>
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="text-[9px] text-gray-600"
            style={{ width: `${100 / 12}%`, textAlign: 'center' }}
          >
            {m}월
          </span>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 bg-surface-light border border-surface-border rounded text-[10px] text-white pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.date}: {tooltip.value.toLocaleString()}줄
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[9px] text-gray-600">적음</span>
        {colors.map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, backgroundColor: c, borderRadius: 2 }} />
        ))}
        <span className="text-[9px] text-gray-600">많음</span>
      </div>
    </div>
  )
}

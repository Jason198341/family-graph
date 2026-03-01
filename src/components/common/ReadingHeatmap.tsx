import { useMemo } from 'react'
import { useReadingStore } from '@/stores/readingStore'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function getIntensity(lines: number): number {
  if (lines === 0) return 0
  if (lines < 100) return 1
  if (lines < 300) return 2
  if (lines < 600) return 3
  return 4
}

const COLORS = [
  'bg-stone-100',           // 0: no activity
  'bg-amber-200',           // 1: light
  'bg-amber-300',           // 2: medium
  'bg-amber-400',           // 3: high
  'bg-amber-600',           // 4: very high
]

export default function ReadingHeatmap() {
  const readingLogs = useReadingStore((s) => s.readingLogs)

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date()
    // Go back ~12 weeks (84 days)
    const start = new Date(today)
    start.setDate(start.getDate() - 83)
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay())

    // Build a map of date → total lines
    const linesByDate = new Map<string, number>()
    for (const log of readingLogs) {
      linesByDate.set(log.date, (linesByDate.get(log.date) ?? 0) + log.linesRead)
    }

    const weeks: { date: string; lines: number; intensity: number; day: number }[][] = []
    const monthLabels: { label: string; col: number }[] = []
    let lastMonth = -1

    const cursor = new Date(start)
    while (cursor <= today) {
      const week: typeof weeks[0] = []
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().slice(0, 10)
        const isFuture = cursor > today
        const lines = isFuture ? 0 : (linesByDate.get(dateStr) ?? 0)
        week.push({
          date: dateStr,
          lines,
          intensity: isFuture ? -1 : getIntensity(lines),
          day: cursor.getDay(),
        })

        // Track month labels
        if (cursor.getMonth() !== lastMonth && !isFuture) {
          lastMonth = cursor.getMonth()
          monthLabels.push({
            label: `${cursor.getMonth() + 1}월`,
            col: weeks.length,
          })
        }

        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(week)
    }

    return { weeks, monthLabels }
  }, [readingLogs])

  // Stats for the period
  const totalDays = useMemo(() => {
    const dates = new Set<string>()
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - 83)
    for (const log of readingLogs) {
      if (log.date >= start.toISOString().slice(0, 10) && log.date <= today.toISOString().slice(0, 10)) {
        dates.add(log.date)
      }
    }
    return dates.size
  }, [readingLogs])

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-stone-700">독서 달력</h2>
        <p className="text-[10px] text-stone-400">최근 12주 · {totalDays}일 독서</p>
      </div>

      <div
        className="overflow-x-auto"
        aria-label={`12주 독서 활동 히트맵 — 최근 ${totalDays}일 독서`}
        role="img"
      >
        <div className="inline-flex flex-col gap-0.5 min-w-0">
          {/* Month labels */}
          <div className="flex gap-0.5 ml-6 mb-1">
            {weeks.map((_, wi) => {
              const label = monthLabels.find((m) => m.col === wi)
              return (
                <div key={wi} className="w-3 text-center">
                  {label && (
                    <span className="text-[9px] text-stone-400 font-medium">{label.label}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Grid: rows = days of week, cols = weeks */}
          {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-0.5">
              <span className="w-5 text-[9px] text-stone-400 text-right pr-0.5 shrink-0">
                {dayIdx % 2 === 1 ? WEEKDAYS[dayIdx] : ''}
              </span>
              {weeks.map((week, wi) => {
                const cell = week[dayIdx]
                if (!cell || cell.intensity === -1) {
                  return <div key={wi} className="w-3 h-3 rounded-[2px]" />
                }
                return (
                  <div
                    key={wi}
                    className={`w-3 h-3 rounded-[2px] ${COLORS[cell.intensity]} transition-colors`}
                    title={`${cell.date}: ${cell.lines.toLocaleString()}줄`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-[9px] text-stone-400">적음</span>
        {COLORS.map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${c}`} />
        ))}
        <span className="text-[9px] text-stone-400">많음</span>
      </div>
    </div>
  )
}

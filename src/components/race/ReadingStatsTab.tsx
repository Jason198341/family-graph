import { useMemo } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import HeatmapCalendar from './HeatmapCalendar'

interface ReadingStatsTabProps {
  year: number
}

export default function ReadingStatsTab({ year }: ReadingStatsTabProps) {
  const persons = useGraphStore((s) => s.persons)
  const readingLogs = useGraphStore((s) => s.readingLogs)

  const yearPrefix = String(year)
  const yearLogs = readingLogs.filter((l) => l.date.startsWith(yearPrefix))

  // Monthly bar chart data
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0')
      const monthPrefix = `${year}-${m}`
      const total = yearLogs
        .filter((l) => l.date.startsWith(monthPrefix))
        .reduce((s, l) => s + l.linesRead, 0)
      return { month: `${i + 1}월`, total }
    })
    return months
  }, [yearLogs, year])

  const maxMonthly = Math.max(1, ...monthlyData.map((d) => d.total))

  // Heatmap data (aggregate by day across all persons)
  const heatmapData = useMemo(() => {
    const dayMap = new Map<string, number>()
    for (const log of yearLogs) {
      dayMap.set(log.date, (dayMap.get(log.date) ?? 0) + log.linesRead)
    }
    return Array.from(dayMap.entries()).map(([date, value]) => ({ date, value }))
  }, [yearLogs])

  // Top 5 reading days
  const topDays = useMemo(() => {
    const dayMap = new Map<string, number>()
    for (const log of yearLogs) {
      dayMap.set(log.date, (dayMap.get(log.date) ?? 0) + log.linesRead)
    }
    return Array.from(dayMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([date, lines]) => ({ date, lines }))
  }, [yearLogs])

  // Per-person reading summary
  const personStats = useMemo(() => {
    return persons.map((p) => {
      const pLogs = yearLogs.filter((l) => l.personId === p.id)
      const total = pLogs.reduce((s, l) => s + l.linesRead, 0)
      return { person: p, total, logCount: pLogs.length }
    }).sort((a, b) => b.total - a.total)
  }, [persons, yearLogs])

  return (
    <div className="space-y-6">
      {/* Monthly bar chart */}
      <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5">
        <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-4">월별 독서량</h3>
        <div className="flex items-end gap-1 h-32">
          {monthlyData.map((d, i) => {
            const height = d.total > 0 ? Math.max(4, (d.total / maxMonthly) * 100) : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative" style={{ height: '100px' }}>
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] rounded-t transition-all duration-500"
                    style={{
                      height: `${height}%`,
                      backgroundColor: d.total > 0 ? '#d97706' : 'transparent',
                      opacity: d.total > 0 ? 0.8 : 0,
                    }}
                  />
                </div>
                <span className="text-xs text-espresso-400">{d.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5">
        <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-4">일별 독서 히트맵</h3>
        <HeatmapCalendar year={year} data={heatmapData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top days */}
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5">
          <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-3">TOP 5 최다 독서일</h3>
          {topDays.length === 0 ? (
            <p className="text-sm text-espresso-400">기록이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {topDays.map((d, i) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-sm w-5 text-center text-espresso-400">{i + 1}</span>
                  <span className="text-xs text-cream-200 flex-1">{d.date}</span>
                  <span className="text-xs font-bold text-amber-600">{d.lines.toLocaleString()}줄</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-person summary */}
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5">
          <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-3">구성원별 독서량</h3>
          <div className="space-y-2">
            {personStats.map(({ person, total, logCount }) => (
              <div key={person.id} className="flex items-center gap-3">
                <span className="text-lg">{person.emoji}</span>
                <span className="text-xs text-cream-200 flex-1">{person.name}</span>
                <span className="text-xs text-espresso-400">{logCount}건</span>
                <span className="text-xs font-bold" style={{ color: person.color }}>
                  {total.toLocaleString()}줄
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

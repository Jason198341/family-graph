import { useMemo } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import PersonAvatar from '@/components/common/PersonAvatar'

interface RaceStatsProps {
  month: string
}

export default function RaceStats({ month }: RaceStatsProps) {
  const persons = useGraphStore((s) => s.persons)
  const readingLogs = useGraphStore((s) => s.readingLogs)
  const getRaceProgress = useGraphStore((s) => s.getRaceProgress)
  const getStreakDays = useGraphStore((s) => s.getStreakDays)

  const { stats, topReader, hasTopReader, maxLines } = useMemo(() => {
    const computed = persons.map((person) => {
      const progress = getRaceProgress(person.id, month)
      const monthLogs = readingLogs.filter(
        (l) => l.personId === person.id && l.date.startsWith(month),
      )
      const totalLines = monthLogs.reduce((s, l) => s + l.linesRead, 0)
      const streak = getStreakDays(person.id)
      return { person, progress, totalLines, logCount: monthLogs.length, streak }
    })
    const top = computed.length > 0
      ? [...computed].sort((a, b) => b.totalLines - a.totalLines)[0]
      : null
    return {
      stats: computed,
      topReader: top,
      hasTopReader: top !== null && top.totalLines > 0,
      maxLines: Math.max(1, ...computed.map((s) => s.totalLines)),
    }
  }, [persons, readingLogs, month, getRaceProgress, getStreakDays])

  return (
    <div className="space-y-4">
      {/* Member cards — flat list on mobile, grid on desktop */}
      <div className="divide-y divide-surface-border md:divide-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-3 stagger-fade">
        {stats.map(({ person, progress, totalLines, logCount, streak }) => {
          const isTop = hasTopReader && topReader?.person.id === person.id

          return (
            <div
              key={person.id}
              className={`py-2.5 px-1 md:bg-surface-light/80 md:backdrop-blur-md md:border md:rounded-2xl md:p-4 md:hover:border-surface-hover transition-colors ${isTop ? 'md:border-amber-500/40 md:ring-1 md:ring-amber-500/20' : 'md:border-surface-border'}`}
            >
              <div className="flex items-center gap-2">
                <PersonAvatar person={person} size={28} className="md:w-9 md:h-9" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs md:text-sm font-bold text-cream-100 truncate">{person.name}</p>
                    <span className="text-xs text-espresso-400">{person.role}</span>
                    {isTop && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-600 rounded-full font-bold shrink-0">
                        독서왕
                      </span>
                    )}
                    {streak > 0 && (
                      <span className="text-xs text-amber-600 shrink-0">🔥 {streak}일</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-espresso-400">{totalLines.toLocaleString()}줄</span>
                    <span className="text-xs text-espresso-400">{logCount}회</span>
                    <span className="text-xs font-bold" style={{ color: person.color }}>{progress}%</span>
                  </div>
                </div>
              </div>
              <div className="h-1 md:h-1.5 bg-surface rounded-full overflow-hidden mt-1.5 md:mt-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, backgroundColor: person.color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Member comparison bar chart — input order */}
      {stats.length > 1 && maxLines > 0 && (
        <div className="py-2 md:bg-surface-light/80 md:backdrop-blur-md md:border md:border-surface-border md:rounded-2xl md:p-5 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
          <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-2 md:mb-4">
            가족 구성원 현황
          </h3>
          <div className="space-y-3">
            {stats.map(({ person, totalLines }) => {
              const pct = maxLines > 0 ? (totalLines / maxLines) * 100 : 0
              return (
                <div key={person.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24 shrink-0">
                    <PersonAvatar person={person} size={22} />
                    <span className="text-xs text-cream-100 font-medium truncate">{person.name}</span>
                  </div>
                  <div className="flex-1 h-5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 flex items-center pl-2"
                      style={{
                        width: `${Math.max(pct, 4)}%`,
                        backgroundColor: person.color,
                      }}
                    >
                      {pct > 20 && (
                        <span className="text-xs font-bold text-white/90">
                          {totalLines.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {pct <= 20 && (
                    <span className="text-xs text-espresso-300 w-16 text-right tabular-nums">
                      {totalLines.toLocaleString()}줄
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

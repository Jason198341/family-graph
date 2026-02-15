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

  const stats = persons.map((person) => {
    const progress = getRaceProgress(person.id, month)
    const monthLogs = readingLogs.filter(
      (l) => l.personId === person.id && l.date.startsWith(month),
    )
    const totalLines = monthLogs.reduce((s, l) => s + l.linesRead, 0)
    const streak = getStreakDays(person.id)

    return { person, progress, totalLines, logCount: monthLogs.length, streak }
  })

  // Keep original order (no competitive sorting) - just find top reader
  const topReader = stats.length > 0
    ? [...stats].sort((a, b) => b.totalLines - a.totalLines)[0]
    : null
  const hasTopReader = topReader && topReader.totalLines > 0

  const maxLines = Math.max(1, ...stats.map((s) => s.totalLines))

  return (
    <div className="space-y-4">
      {/* Member cards — input order, no rank */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-fade">
        {stats.map(({ person, progress, totalLines, logCount, streak }) => {
          const isTop = hasTopReader && topReader.person.id === person.id

          return (
            <div
              key={person.id}
              className={`bg-surface-light/80 backdrop-blur-md border rounded-2xl p-4 hover:border-surface-hover transition-colors ${isTop ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-surface-border'}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <PersonAvatar person={person} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-cream-100 truncate">{person.name}</p>
                  <p className="text-xs text-espresso-400">{person.role}</p>
                </div>
                {isTop && (
                  <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-600 rounded-full font-bold shrink-0">
                    독서왕
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-espresso-400">이번 달 진행률</span>
                  <span className="text-xs font-bold" style={{ color: person.color }}>{progress}%</span>
                </div>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, backgroundColor: person.color }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <p className="text-xs text-espresso-400">독서량</p>
                    <p className="text-xs font-bold text-cream-100">{totalLines.toLocaleString()}<span className="text-xs text-espresso-400">줄</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-espresso-400">기록 횟수</p>
                    <p className="text-xs font-bold text-cream-100">{logCount}<span className="text-xs text-espresso-400">회</span></p>
                  </div>
                </div>

                {streak > 0 && (
                  <p className="text-xs text-amber-600">🔥 {streak}일 연속 독서</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Member comparison bar chart — input order */}
      {stats.length > 1 && maxLines > 0 && (
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
          <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-4">
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

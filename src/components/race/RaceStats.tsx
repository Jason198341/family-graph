import { useMemo } from 'react'
import { useReadingStore } from '@/stores/readingStore'
import PersonAvatar from '@/components/common/PersonAvatar'

interface RaceStatsProps {
  month: string
}

export default function RaceStats({ month }: RaceStatsProps) {
  const persons = useReadingStore((s) => s.persons)
  const readingLogs = useReadingStore((s) => s.readingLogs)
  const getRaceProgress = useReadingStore((s) => s.getRaceProgress)
  const getStreakDays = useReadingStore((s) => s.getStreakDays)

  const { stats, topReader, hasTopReader } = useMemo(() => {
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
    }
  }, [persons, readingLogs, month, getRaceProgress, getStreakDays])

  return (
    <div className="space-y-4">
      {/* Member cards — 2-column grid */}
      <div className="grid grid-cols-2 gap-2.5 stagger-fade">
        {stats.map(({ person, progress, totalLines, logCount, streak }) => {
          const isTop = hasTopReader && topReader?.person.id === person.id

          return (
            <div
              key={person.id}
              className={`bg-white rounded-2xl p-3.5 border shadow-sm transition-colors ${
                isTop ? 'border-amber-300 ring-1 ring-amber-200' : 'border-stone-200/60'
              }`}
            >
              {/* Avatar + name row */}
              <div className="flex items-center gap-2 mb-2">
                <PersonAvatar person={person} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800 truncate">{person.name}</p>
                  <p className="text-[10px] text-stone-400">{person.role}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1 mb-2">
                {isTop && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">
                    독서왕
                  </span>
                )}
                {streak > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-full">
                    🔥 {streak}일
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">{totalLines.toLocaleString()}줄</span>
                  <span className="text-xs font-bold" style={{ color: person.color }}>{progress}%</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, backgroundColor: person.color }}
                  />
                </div>
                <p className="text-[10px] text-stone-400 text-right">{logCount}회 기록</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useGraphStore } from '@/stores/graphStore'

interface RaceStatsProps {
  year: number
}

export default function RaceStats({ year }: RaceStatsProps) {
  const persons = useGraphStore((s) => s.persons)
  const readingLogs = useGraphStore((s) => s.readingLogs)
  const writingEntries = useGraphStore((s) => s.writingEntries)
  const getRaceProgress = useGraphStore((s) => s.getRaceProgress)
  const getStreakDays = useGraphStore((s) => s.getStreakDays)

  const yearPrefix = String(year)

  const stats = persons.map((person) => {
    const progress = getRaceProgress(person.id, year)
    const yearLogs = readingLogs.filter(
      (l) => l.personId === person.id && l.date.startsWith(yearPrefix),
    )
    const totalLines = yearLogs.reduce((s, l) => s + l.linesRead, 0)
    const yearWritings = writingEntries.filter(
      (e) => e.personId === person.id && e.date.startsWith(yearPrefix),
    )
    const streak = getStreakDays(person.id)

    return { person, progress, totalLines, writingCount: yearWritings.length, streak }
  })

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-fade">
      {stats.map(({ person, progress, totalLines, writingCount, streak }) => (
        <div
          key={person.id}
          className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-4 hover:border-surface-hover transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg border-2"
              style={{ borderColor: person.color, backgroundColor: `${person.color}15` }}
            >
              {person.emoji}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{person.name}</p>
              <p className="text-[10px] text-gray-500">{person.role}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">종합</span>
              <span className="text-xs font-bold" style={{ color: person.color }}>{progress.combinedPercent}%</span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress.combinedPercent}%`, backgroundColor: person.color }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p className="text-[9px] text-gray-600">독서</p>
                <p className="text-xs font-bold text-white">{totalLines.toLocaleString()}<span className="text-[9px] text-gray-500">줄</span></p>
              </div>
              <div>
                <p className="text-[9px] text-gray-600">글쓰기</p>
                <p className="text-xs font-bold text-white">{writingCount}<span className="text-[9px] text-gray-500">편</span></p>
              </div>
            </div>

            {streak > 0 && (
              <p className="text-[10px] text-warm-400">🔥 {streak}일 연속 독서</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

import { useGraphStore } from '@/stores/graphStore'

interface CombinedRankingTabProps {
  year: number
}

export default function CombinedRankingTab({ year }: CombinedRankingTabProps) {
  const persons = useGraphStore((s) => s.persons)
  const getRaceProgress = useGraphStore((s) => s.getRaceProgress)

  const rankings = persons
    .map((person) => {
      const progress = getRaceProgress(person.id, year)
      return { person, ...progress }
    })
    .sort((a, b) => b.combinedPercent - a.combinedPercent)

  const medals = ['🥇', '🥈', '🥉', '4️⃣']

  return (
    <div className="space-y-2">
      {rankings.map((r, idx) => (
        <div
          key={r.person.id}
          className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
            idx === 0
              ? 'bg-race-500/10 border-race-500/30'
              : 'bg-surface-light/80 border-surface-border hover:border-surface-hover'
          }`}
        >
          <span className="text-xl w-8 text-center">{medals[idx] ?? `${idx + 1}`}</span>

          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2"
            style={{ borderColor: r.person.color, backgroundColor: `${r.person.color}15` }}
          >
            {r.person.emoji}
          </div>

          <div className="flex-1">
            <p className="text-sm font-bold text-white">{r.person.name}</p>
            <p className="text-[10px] text-gray-500">{r.person.role}</p>
          </div>

          <div className="text-right space-y-0.5">
            <p className="text-lg font-bold tabular-nums" style={{ color: r.person.color }}>
              {r.combinedPercent}%
            </p>
            <div className="flex gap-3 text-[10px] text-gray-500">
              <span>📖 {r.readingPercent}%</span>
              <span>✍️ {r.writingPercent}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

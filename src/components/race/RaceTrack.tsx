import { useGraphStore } from '@/stores/graphStore'

interface Runner {
  personId: string
  name: string
  emoji: string
  color: string
  percent: number
}

interface RaceTrackProps {
  year: number
}

export default function RaceTrack({ year }: RaceTrackProps) {
  const persons = useGraphStore((s) => s.persons)
  const getRaceProgress = useGraphStore((s) => s.getRaceProgress)

  const runners: Runner[] = persons
    .map((p) => {
      const progress = getRaceProgress(p.id, year)
      return {
        personId: p.id,
        name: p.name,
        emoji: p.emoji,
        color: p.color,
        percent: progress.combinedPercent,
      }
    })
    .sort((a, b) => b.percent - a.percent)

  const markers = [25, 50, 75]

  return (
    <div className="space-y-3">
      {runners.map((runner, idx) => {
        const rank = idx + 1
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`
        const isFinished = runner.percent >= 100

        return (
          <div key={runner.personId} className="relative">
            {/* Track */}
            <div className="relative h-14 bg-surface-lighter rounded-xl border border-surface-border overflow-hidden">
              {/* Track gradient fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-xl transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(100, runner.percent)}%`,
                  background: `linear-gradient(90deg, ${runner.color}20, ${runner.color}40)`,
                }}
              />

              {/* Markers */}
              {markers.map((m) => (
                <div
                  key={m}
                  className="absolute top-0 bottom-0 w-px bg-surface-border"
                  style={{ left: `${m}%` }}
                >
                  <span className="absolute -top-0.5 left-1 text-[8px] text-gray-600">{m}%</span>
                </div>
              ))}

              {/* Start line */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-600" />

              {/* Finish line */}
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-race-500/60">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(245,158,11,0.3)_3px,rgba(245,158,11,0.3)_6px)]" />
              </div>

              {/* Runner */}
              <div
                className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1 transition-all duration-1000 ease-out"
                style={{ left: `${Math.min(95, Math.max(2, runner.percent - 3))}%` }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 bg-surface-light shadow-lg ${isFinished ? 'animate-finish-pulse' : 'animate-runner-bounce'}`}
                  style={{ borderColor: runner.color }}
                >
                  {runner.emoji}
                </div>
              </div>

              {/* Rank + Name label */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-sm">{medal}</span>
                <span className="text-xs font-bold text-white">{runner.name}</span>
              </div>

              {/* Percent label */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-sm font-bold tabular-nums" style={{ color: runner.color }}>
                  {runner.percent}%
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

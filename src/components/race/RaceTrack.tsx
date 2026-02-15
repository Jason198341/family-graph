import { useGraphStore } from '@/stores/graphStore'

interface Runner {
  personId: string
  name: string
  emoji: string
  color: string
  percent: number
  totalLines: number
}

interface RaceTrackProps {
  month: string
}

export default function RaceTrack({ month }: RaceTrackProps) {
  const persons = useGraphStore((s) => s.persons)
  const getRaceProgress = useGraphStore((s) => s.getRaceProgress)
  const getTotalLinesForMonth = useGraphStore((s) => s.getTotalLinesForMonth)

  // Keep input order (no competitive sorting)
  const runners: Runner[] = persons.map((p) => ({
    personId: p.id,
    name: p.name,
    emoji: p.emoji,
    color: p.color,
    percent: getRaceProgress(p.id, month),
    totalLines: getTotalLinesForMonth(p.id, month),
  }))

  const markers = [25, 50, 75]

  return (
    <div className="space-y-3">
      {runners.map((runner) => {
        const isFinished = runner.percent >= 100

        return (
          <div key={runner.personId} className="relative">
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
                  <span className="absolute -top-0.5 left-1 text-xs text-espresso-400">{m}%</span>
                </div>
              ))}

              {/* Start line */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso-400" />

              {/* Finish line */}
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-amber-500/60">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(251,191,36,0.3)_3px,rgba(251,191,36,0.3)_6px)]" />
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

              {/* Name label */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-xs font-bold text-cream-100">{runner.name}</span>
              </div>

              {/* Percent + Lines label */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-right">
                <span className="text-sm font-bold tabular-nums" style={{ color: runner.color }}>
                  {runner.percent}%
                </span>
                <span className="text-xs text-espresso-300 ml-1.5">
                  {runner.totalLines.toLocaleString()}줄
                </span>
              </div>
            </div>
          </div>
        )
      })}

      {runners.length === 0 && (
        <div className="text-center py-8 text-espresso-400 text-sm">
          가족 구성원을 추가하면 독서 여정이 시작됩니다
        </div>
      )}
    </div>
  )
}

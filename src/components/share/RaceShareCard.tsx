import { useGraphStore } from '@/stores/graphStore'
import { useFamilyStore } from '@/stores/familyStore'
import { useShareImage } from '@/hooks/useShareImage'
import ShareButton from './ShareButton'
import Watermark from './Watermark'

interface Props {
  month: string
}

export default function RaceShareCard({ month }: Props) {
  const { ref, download, share } = useShareImage()
  const persons = useGraphStore((s) => s.persons)
  const readingLogs = useGraphStore((s) => s.readingLogs)
  const getRaceProgress = useGraphStore((s) => s.getRaceProgress)
  const getStreakDays = useGraphStore((s) => s.getStreakDays)
  const family = useFamilyStore((s) => s.family)

  const [y, m] = month.split('-').map(Number)
  const displayMonth = `${y}년 ${m}월`
  const familyName = family?.name ?? '우리 가족'
  const familyEmoji = family?.emoji ?? '🏠'

  const runners = persons.map((p) => {
    const logs = readingLogs.filter((l) => l.personId === p.id && l.date.startsWith(month))
    const totalLines = logs.reduce((s, l) => s + l.linesRead, 0)
    const progress = getRaceProgress(p.id, month)
    const streak = getStreakDays(p.id)
    return { person: p, totalLines, progress, streak, logCount: logs.length }
  }).sort((a, b) => b.totalLines - a.totalLines)

  const familyTotal = runners.reduce((s, r) => s + r.totalLines, 0)
  const daysInMonth = new Date(y, m, 0).getDate()
  const today = new Date()
  const daysLeft = today.getFullYear() === y && today.getMonth() + 1 === m
    ? daysInMonth - today.getDate()
    : 0

  return (
    <div className="space-y-4">
      <div ref={ref} className="w-[540px] mx-auto rounded-3xl overflow-hidden border shadow-xl" style={{ background: 'linear-gradient(135deg, #eff6ff, #ffffff, #eef2ff)', borderColor: '#bfdbfe' }}>
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-xs text-blue-500 font-bold tracking-widest uppercase">🏃 독서 레이스</p>
            <h2 className="text-lg font-bold text-slate-800 mt-1" style={{ fontFamily: "'Gowun Batang', serif" }}>
              {familyEmoji} {familyName} · {displayMonth}
            </h2>
            {daysLeft > 0 && (
              <p className="text-xs text-slate-400 mt-1">D-{daysLeft}</p>
            )}
          </div>

          {/* Family total */}
          <div className="text-center mb-6 p-4 rounded-2xl border" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
            <p className="text-3xl font-black text-blue-600 tabular-nums">{familyTotal.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">가족 합산 (줄)</p>
          </div>

          {/* Race tracks */}
          <div className="space-y-3">
            {runners.map((runner, idx) => {
              const { person } = runner
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''
              const isFinished = runner.progress >= 100

              return (
                <div key={person.id} className="relative">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm w-5 text-center">{medal || `${idx + 1}`}</span>
                    <span className="text-lg">{person.emoji}</span>
                    <span className="text-sm font-bold text-slate-700 flex-1">{person.name}</span>
                    <span className="text-sm font-black tabular-nums" style={{ color: person.color }}>
                      {runner.totalLines.toLocaleString()}줄
                    </span>
                  </div>

                  {/* Track bar */}
                  <div className="ml-8 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(runner.progress, 2))}%`,
                        background: `linear-gradient(90deg, ${person.color}80, ${person.color})`,
                      }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      {runner.progress}%
                    </span>
                    {isFinished && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">🎉</span>
                    )}
                  </div>

                  {/* Mini stats */}
                  <div className="ml-8 flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400">{runner.logCount}회 기록</span>
                    {runner.streak > 0 && (
                      <span className="text-xs text-amber-500">🔥 {runner.streak}일 연속</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {runners.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">아직 독서 기록이 없습니다</p>
          )}
        </div>

        <Watermark />
      </div>

      <ShareButton
        onShare={() => share(`${displayMonth} 독서 레이스`)}
        onDownload={() => download(`race-${month}.png`)}
        className="justify-center"
      />
    </div>
  )
}

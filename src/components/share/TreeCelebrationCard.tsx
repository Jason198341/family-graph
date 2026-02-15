import { useGraphStore } from '@/stores/graphStore'
import { useFamilyStore } from '@/stores/familyStore'
import { useShareImage } from '@/hooks/useShareImage'
import ShareButton from './ShareButton'
import Watermark from './Watermark'

const STAGES = [
  { emoji: '🌰', name: '도토리', min: 0, max: 1000 },
  { emoji: '🌱', name: '새싹', min: 1000, max: 5000 },
  { emoji: '🌿', name: '풀잎', min: 5000, max: 10000 },
  { emoji: '🪴', name: '화분', min: 10000, max: 30000 },
  { emoji: '🌳', name: '큰 나무', min: 30000, max: 50000 },
  { emoji: '🌲', name: '거목', min: 50000, max: 100000 },
]

export default function TreeCelebrationCard() {
  const { ref, download, share } = useShareImage()
  const persons = useGraphStore((s) => s.persons)
  const readingLogs = useGraphStore((s) => s.readingLogs)
  const family = useFamilyStore((s) => s.family)

  const totalLines = readingLogs.reduce((s, l) => s + l.linesRead, 0)
  const stageIdx = totalLines >= 50000 ? 5 : totalLines >= 30000 ? 4 : totalLines >= 10000 ? 3 : totalLines >= 5000 ? 2 : totalLines >= 1000 ? 1 : 0
  const stage = STAGES[stageIdx]
  const nextStage = STAGES[Math.min(stageIdx + 1, STAGES.length - 1)]
  const progress = stageIdx >= 5 ? 100 : Math.round(((totalLines - stage.min) / (nextStage.min - stage.min)) * 100)

  // Per-person contribution
  const contributions = persons.map((p) => {
    const lines = readingLogs.filter((l) => l.personId === p.id).reduce((s, l) => s + l.linesRead, 0)
    return { person: p, lines, pct: totalLines > 0 ? Math.round((lines / totalLines) * 100) : 0 }
  }).sort((a, b) => b.lines - a.lines)

  const familyName = family?.name ?? '우리 가족'
  const familyEmoji = family?.emoji ?? '🏠'

  return (
    <div className="space-y-4">
      {/* Shareable card */}
      <div ref={ref} className="w-[540px] mx-auto rounded-3xl overflow-hidden border shadow-xl" style={{ background: 'linear-gradient(135deg, #ecfdf5, #ffffff, #fffbeb)', borderColor: '#a7f3d0' }}>
        <div className="p-8 text-center">
          {/* Header */}
          <p className="text-sm text-emerald-600 font-bold tracking-wider uppercase mb-2">🎉 축하합니다!</p>
          <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Gowun Batang', serif" }}>
            {familyEmoji} {familyName}의 나무가 성장했어요
          </h2>

          {/* Giant tree */}
          <div className="my-8 relative">
            <div className="text-8xl animate-tree-grow">{stage.emoji}</div>
            <p className="text-2xl font-black text-slate-800 mt-3">{stage.name}</p>
            <p className="text-sm text-slate-500 mt-1">
              총 <span className="font-bold text-emerald-600">{totalLines.toLocaleString()}</span>줄 달성
            </p>
          </div>

          {/* Progress to next */}
          {stageIdx < 5 && (
            <div className="mb-6 px-6">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{stage.emoji} {stage.name}</span>
                <span>{nextStage.emoji} {nextStage.name}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#d1fae5' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #34d399, #10b981)' }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">다음 단계까지 {(nextStage.min - totalLines).toLocaleString()}줄</p>
            </div>
          )}

          {/* Member contributions */}
          <div className="space-y-2 px-4">
            <p className="text-xs text-slate-500 font-semibold mb-2">가족 기여도</p>
            {contributions.map(({ person, lines, pct }) => (
              <div key={person.id} className="flex items-center gap-2">
                <span className="text-sm w-6 text-center">{person.emoji}</span>
                <span className="text-xs text-slate-700 w-14 text-left font-medium">{person.name}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: person.color }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-20 text-right tabular-nums">
                  {lines.toLocaleString()}줄 ({pct}%)
                </span>
              </div>
            ))}
          </div>

          {/* Stage roadmap */}
          <div className="flex items-center justify-center gap-1 mt-6 mb-2">
            {STAGES.map((s, i) => (
              <div key={i} className={`flex items-center ${i <= stageIdx ? 'opacity-100' : 'opacity-30'}`}>
                <span className={`text-lg ${i === stageIdx ? 'text-2xl' : ''}`}>{s.emoji}</span>
                {i < STAGES.length - 1 && (
                  <div className={`w-4 h-0.5 mx-0.5 ${i < stageIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Watermark />
      </div>

      <ShareButton
        onShare={() => share('가족 나무 성장 축하!')}
        onDownload={() => download(`tree-${familyName}.png`)}
        className="justify-center"
      />
    </div>
  )
}

import { useState } from 'react'
import { readingTips, CATEGORIES, type ReadingTip } from '@/data/readingTips'

const DIFFICULTY_LABEL: Record<number, string> = { 1: '쉬움', 2: '보통', 3: '고급' }
const DIFFICULTY_COLOR: Record<number, string> = {
  1: 'bg-olive-500/20 text-olive-300',
  2: 'bg-amber-500/20 text-amber-300',
  3: 'bg-rose-500/20 text-rose-300',
}

export default function TipsPage() {
  const [category, setCategory] = useState('전체')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = category === '전체'
    ? readingTips
    : readingTips.filter((t) => t.category === category)

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-cream-100 flex items-center gap-2">
          <span>📚</span> 독서법 가이드
        </h1>
        <p className="text-sm text-espresso-300 mt-1">
          다양한 독서법을 익히고 가족과 함께 실천해보세요
        </p>
      </div>

      {/* Category filter */}
      <div
        className="flex flex-wrap gap-2 animate-fade-in-up"
        style={{ animationDelay: '80ms' }}
      >
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              category === c.key
                ? 'bg-amber-500 text-white'
                : 'bg-surface-light/80 text-espresso-300 hover:text-cream-100 border border-surface-border'
            }`}
          >
            <span>{c.emoji}</span> {c.key}
          </button>
        ))}
      </div>

      {/* Tips grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-fade">
        {filtered.map((tip) => (
          <TipCard
            key={tip.id}
            tip={tip}
            expanded={expandedId === tip.id}
            onToggle={() => setExpandedId(expandedId === tip.id ? null : tip.id)}
          />
        ))}
      </div>
    </div>
  )
}

function TipCard({
  tip,
  expanded,
  onToggle,
}: {
  tip: ReadingTip
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`bg-surface-light/80 backdrop-blur-md border rounded-2xl p-5 transition-all cursor-pointer ${
        expanded ? 'border-amber-500/40' : 'border-surface-border hover:border-surface-hover'
      }`}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-3xl">{tip.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-cream-100">{tip.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[tip.difficulty]}`}>
              {DIFFICULTY_LABEL[tip.difficulty]}
            </span>
            <span className="text-[10px] text-espresso-400">{tip.category}</span>
          </div>
        </div>
        <span className={`text-espresso-400 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </div>

      {/* Summary */}
      <p className="mt-3 text-sm text-cream-200 leading-relaxed">{tip.summary}</p>

      {/* Steps (expanded) */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-surface-border space-y-2 animate-fade-in-up">
          <p className="text-[10px] text-espresso-400 uppercase tracking-wider font-semibold">
            실천 단계
          </p>
          {tip.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-cream-200">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

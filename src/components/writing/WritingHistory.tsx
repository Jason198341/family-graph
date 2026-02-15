import { useState, useMemo } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import ScoreCard from './ScoreCard'

const GRADE_COLORS: Record<string, string> = {
  S: '#fbbf24',
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f97316',
  D: '#ef4444',
}

export default function WritingHistory() {
  const persons = useGraphStore((s) => s.persons)
  const writingEntries = useGraphStore((s) => s.writingEntries)
  const [filterPerson, setFilterPerson] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const entries = filterPerson === 'all'
      ? writingEntries
      : writingEntries.filter((e) => e.personId === filterPerson)
    return [...entries].sort((a, b) => b.date.localeCompare(a.date))
  }, [writingEntries, filterPerson])

  return (
    <div className="space-y-4">
      {/* Person filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterPerson('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterPerson === 'all'
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          전체
        </button>
        {persons.map((p) => (
          <button
            key={p.id}
            onClick={() => setFilterPerson(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterPerson === p.id
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-8">글쓰기 기록이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const person = persons.find((p) => p.id === entry.personId)
            const isExpanded = expandedId === entry.id

            return (
              <div key={entry.id} className="space-y-2">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full flex items-center gap-3 p-3 bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-xl hover:border-surface-hover transition-colors text-left"
                >
                  <span className="text-lg">{person?.emoji ?? '?'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{entry.title}</p>
                    <p className="text-[10px] text-gray-500">{entry.date} · {entry.charCount}자</p>
                  </div>
                  <span
                    className="text-sm font-black"
                    style={{ color: GRADE_COLORS[entry.grade] }}
                  >
                    {entry.grade}
                  </span>
                  <span className="text-xs font-bold text-gray-300 tabular-nums">{entry.totalScore}점</span>
                  <span className="text-xs text-gray-600">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="space-y-3 pl-4">
                    {/* Full content */}
                    <div className="bg-surface/60 rounded-xl p-4 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                      {entry.content}
                    </div>

                    {/* Score card */}
                    <ScoreCard
                      totalScore={entry.totalScore}
                      grade={entry.grade}
                      scores={entry.scores}
                      feedback={entry.feedback}
                      badges={entry.badges}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useGraphStore } from '@/stores/graphStore'

interface HighlightTimelineProps {
  month: string
}

export default function HighlightTimeline({ month }: HighlightTimelineProps) {
  const highlights = useGraphStore((s) => s.highlights)
  const persons = useGraphStore((s) => s.persons)
  const books = useGraphStore((s) => s.books)
  const addHighlight = useGraphStore((s) => s.addHighlight)
  const removeHighlight = useGraphStore((s) => s.removeHighlight)

  const [showForm, setShowForm] = useState(false)
  const [personId, setPersonId] = useState('')
  const [bookId, setBookId] = useState('')
  const [content, setContent] = useState('')

  const monthHighlights = [...highlights]
    .filter((h) => h.date.startsWith(month))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const handleSubmit = () => {
    if (!personId || !bookId || !content.trim()) return
    addHighlight({
      personId,
      bookId,
      content: content.trim(),
      date: new Date().toISOString().slice(0, 10),
    })
    setContent('')
    setShowForm(false)
  }

  // 이 달의 명문장: most recent highlight from each person, longest content
  const bestHighlight = monthHighlights.length > 0
    ? [...monthHighlights].sort((a, b) => b.content.length - a.content.length)[0]
    : null

  return (
    <div className="py-2 md:bg-surface-light/80 md:backdrop-blur-md md:border md:border-surface-border md:rounded-2xl md:p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <h2 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold">
          오늘의 한 줄
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs px-3 py-1.5 bg-amber-500/15 text-amber-600 rounded-lg hover:bg-amber-500/25 transition-colors cursor-pointer font-medium"
        >
          + 한 줄 남기기
        </button>
      </div>

      {/* Best highlight banner */}
      {bestHighlight && (
        <div className="mb-2 md:mb-4 p-2 md:p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-600/70 mb-1">이 달의 명문장</p>
          <p className="text-sm text-cream-100 italic leading-relaxed">
            &ldquo;{bestHighlight.content}&rdquo;
          </p>
          <p className="text-xs text-espresso-400 mt-1">
            — {persons.find((p) => p.id === bestHighlight.personId)?.emoji}{' '}
            {persons.find((p) => p.id === bestHighlight.personId)?.name}
          </p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-4 p-4 bg-surface-lighter rounded-xl border border-surface-border space-y-3 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-3">
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="text-xs p-2 bg-surface rounded-lg border border-surface-border text-cream-100"
            >
              <option value="">누가?</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              className="text-xs p-2 bg-surface rounded-lg border border-surface-border text-cream-100"
            >
              <option value="">어떤 책?</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.emoji} {b.title}</option>
              ))}
            </select>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="인상 깊은 문장을 적어주세요..."
            rows={2}
            className="w-full text-sm p-3 bg-surface rounded-lg border border-surface-border text-cream-100 placeholder:text-espresso-400 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="text-xs px-3 py-1.5 text-espresso-300 hover:text-cream-100 cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!personId || !bookId || !content.trim()}
              className="text-xs px-4 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {monthHighlights.length === 0 ? (
        <div className="text-center py-6 text-espresso-400">
          <p className="text-2xl mb-2">📖</p>
          <p className="text-xs">아직 이번 달 한 줄이 없어요</p>
          <p className="text-xs mt-1">읽다가 마음에 드는 문장을 기록해보세요!</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-border md:divide-y-0 md:space-y-3 md:max-h-64 md:overflow-y-auto">
          {monthHighlights.slice(0, 3).map((hl) => {
            const person = persons.find((p) => p.id === hl.personId)
            const book = books.find((b) => b.id === hl.bookId)
            return (
              <div
                key={hl.id}
                className="flex gap-2 md:gap-3 py-2 px-1 md:p-3 md:bg-surface-lighter/60 md:rounded-xl md:border md:border-surface-border group"
              >
                <span className="text-lg shrink-0 mt-0.5">{person?.emoji ?? '👤'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cream-200 italic leading-relaxed">
                    &ldquo;{hl.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-espresso-400">{person?.name}</span>
                    <span className="text-xs text-espresso-400">·</span>
                    <span className="text-xs text-espresso-400">{book?.emoji} {book?.title}</span>
                    <span className="text-xs text-espresso-400">·</span>
                    <span className="text-xs text-espresso-400">{hl.date.slice(5)}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeHighlight(hl.id)}
                  className="text-xs text-espresso-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-rose-400"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

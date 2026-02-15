import { useGraphStore } from '@/stores/graphStore'
import type { ReadingLetter } from '@/types'

interface LetterCardProps {
  letter: ReadingLetter
}

export default function LetterCard({ letter }: LetterCardProps) {
  const persons = useGraphStore((s) => s.persons)
  const books = useGraphStore((s) => s.books)
  const removeLetter = useGraphStore((s) => s.removeLetter)

  const from = persons.find((p) => p.id === letter.fromPersonId)
  const to = persons.find((p) => p.id === letter.toPersonId)
  const book = letter.bookId ? books.find((b) => b.id === letter.bookId) : null

  const dateStr = new Date(letter.createdAt).toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric',
  })

  return (
    <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 group hover:border-amber-500/30 transition-colors">
      {/* Letter header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1">
          <span className="text-lg">{from?.emoji ?? '👤'}</span>
          <span className="text-xs font-semibold text-cream-100">{from?.name ?? '?'}</span>
        </div>
        <span className="text-amber-400">→</span>
        <div className="flex items-center gap-1">
          <span className="text-lg">{to?.emoji ?? '👤'}</span>
          <span className="text-xs font-semibold text-cream-100">{to?.name ?? '?'}</span>
        </div>
        <span className="text-xs text-espresso-400 ml-auto">{dateStr}</span>
      </div>

      {/* Book reference */}
      {book && (
        <div className="flex items-center gap-1.5 mb-3 px-2 py-1 bg-surface-lighter rounded-lg w-fit">
          <span className="text-sm">{book.emoji}</span>
          <span className="text-xs text-espresso-300">
            {book.title}
          </span>
        </div>
      )}

      {/* Letter content */}
      <div className="pl-3 border-l-2 border-amber-500/30">
        <p className="text-sm text-cream-200 leading-relaxed whitespace-pre-wrap">
          {letter.content}
        </p>
      </div>

      {/* Delete */}
      <div className="flex justify-end mt-3">
        <button
          onClick={() => removeLetter(letter.id)}
          className="text-xs text-espresso-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-400 cursor-pointer"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

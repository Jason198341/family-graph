import { useGraphStore } from '@/stores/graphStore'
import type { BookReview } from '@/types'

interface ReviewCardProps {
  review: BookReview
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const persons = useGraphStore((s) => s.persons)
  const books = useGraphStore((s) => s.books)
  const toggleLike = useGraphStore((s) => s.toggleLike)

  const person = persons.find((p) => p.id === review.personId)
  const book = books.find((b) => b.id === review.bookId)
  const likeCount = review.likes.length

  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating)

  return (
    <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 hover:border-surface-hover transition-colors">
      {/* Author + Book */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2"
          style={{ borderColor: person?.color ?? '#d97706', backgroundColor: `${person?.color ?? '#d97706'}15` }}
        >
          {person?.emoji ?? '👤'}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-cream-100">{person?.name ?? '알 수 없음'}</p>
          <p className="text-xs text-espresso-400">
            {book?.emoji} {book?.title ?? '알 수 없는 책'} · {book?.author}
          </p>
        </div>
        <span className="text-xs text-espresso-400">
          {new Date(review.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>

      {/* Star rating */}
      <div className="flex items-center gap-0.5 mb-3">
        {stars.map((filled, i) => (
          <span key={i} className={`text-base ${filled ? 'text-amber-600' : 'text-surface-border'}`}>
            ★
          </span>
        ))}
      </div>

      {/* Content */}
      <p className="text-sm text-cream-200 leading-relaxed whitespace-pre-wrap">{review.content}</p>

      {/* Like button */}
      <div className="mt-4 pt-3 border-t border-surface-border flex items-center gap-3">
        {persons.map((p) => {
          const liked = review.likes.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => toggleLike(review.id, p.id)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all cursor-pointer ${
                liked
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-surface-lighter text-espresso-400 border-surface-border hover:text-cream-200'
              }`}
            >
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{p.emoji}</span>
            </button>
          )
        })}
        {likeCount > 0 && (
          <span className="text-xs text-espresso-400 ml-auto">
            {likeCount}명이 좋아합니다
          </span>
        )}
      </div>
    </div>
  )
}

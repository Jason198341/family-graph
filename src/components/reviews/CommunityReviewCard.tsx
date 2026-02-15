import type { CommunityReview } from '@/types'
import { useFamilyStore } from '@/stores/familyStore'

interface CommunityReviewCardProps {
  review: CommunityReview
  onBookClick?: (bookTitle: string) => void
}

export default function CommunityReviewCard({ review, onBookClick }: CommunityReviewCardProps) {
  const family = useFamilyStore((s) => s.family)
  const isOurFamily = family?.name === review.familyName

  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating)

  return (
    <div className={`bg-surface-light/80 backdrop-blur-md border rounded-2xl p-5 hover:border-surface-hover transition-colors ${isOurFamily ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-surface-border'}`}>
      {/* Family badge + author */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-lighter rounded-lg border border-surface-border shrink-0">
          <span className="text-sm">{review.familyEmoji}</span>
          <span className="text-xs font-semibold text-espresso-300">{review.familyName}</span>
          {isOurFamily && (
            <span className="text-xs px-1 py-0.5 bg-amber-500/20 text-amber-600 rounded font-bold">
              우리
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{review.personEmoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-cream-100 truncate">{review.personName}</p>
            <button
              onClick={() => onBookClick?.(review.bookTitle)}
              className="text-xs text-espresso-400 hover:text-amber-600 transition-colors cursor-pointer truncate block"
            >
              {review.bookEmoji} {review.bookTitle} · {review.bookAuthor}
            </button>
          </div>
        </div>

        <span className="text-xs text-espresso-400 shrink-0">
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

      {/* Likes count */}
      {review.likes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-surface-border">
          <span className="text-xs text-espresso-400">
            ❤️ {review.likes.length}명이 좋아합니다
          </span>
        </div>
      )}
    </div>
  )
}

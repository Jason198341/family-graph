import { useState } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import ReviewCard from './ReviewCard'
import ReviewForm from './ReviewForm'
import RecommendCard from './RecommendCard'
import RecommendForm from './RecommendForm'

type SubTab = 'reviews' | 'recommends'

export default function ReviewsPage() {
  const [subTab, setSubTab] = useState<SubTab>('reviews')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showRecommendForm, setShowRecommendForm] = useState(false)
  const reviews = useGraphStore((s) => s.reviews)
  const recommendations = useGraphStore((s) => s.recommendations)

  const sortedReviews = [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const sortedRecs = [...recommendations].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-cream-100 flex items-center gap-2">
          <span>💬</span> 독서 나눔
        </h1>
        <p className="text-sm text-espresso-300 mt-1">가족과 함께 독서 후기와 추천을 나눠요</p>
      </div>

      {/* Sub-tab toggle */}
      <div className="flex items-center gap-1 bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-xl p-1 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <button
          onClick={() => setSubTab('reviews')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            subTab === 'reviews' ? 'bg-surface-lighter text-cream-100' : 'text-espresso-400 hover:text-espresso-200'
          }`}
        >
          <span>📝</span> 후기 ({reviews.length})
        </button>
        <button
          onClick={() => setSubTab('recommends')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            subTab === 'recommends' ? 'bg-surface-lighter text-cream-100' : 'text-espresso-400 hover:text-espresso-200'
          }`}
        >
          <span>👍</span> 추천 ({recommendations.length})
        </button>
      </div>

      {/* Reviews tab */}
      {subTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-xs px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              + 후기 작성
            </button>
          </div>

          {showReviewForm && (
            <ReviewForm onClose={() => setShowReviewForm(false)} />
          )}

          {sortedReviews.length === 0 ? (
            <div className="text-center py-12 text-espresso-400">
              <span className="text-4xl block mb-3">📝</span>
              <p>아직 후기가 없습니다</p>
              <p className="text-xs mt-1">책을 읽고 첫 후기를 남겨보세요!</p>
            </div>
          ) : (
            <div className="space-y-4 stagger-fade">
              {sortedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommends tab */}
      {subTab === 'recommends' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowRecommendForm(!showRecommendForm)}
              className="text-xs px-4 py-2 bg-olive-500 hover:bg-olive-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              + 책 추천
            </button>
          </div>

          {showRecommendForm && (
            <RecommendForm onClose={() => setShowRecommendForm(false)} />
          )}

          {sortedRecs.length === 0 ? (
            <div className="text-center py-12 text-espresso-400">
              <span className="text-4xl block mb-3">👍</span>
              <p>아직 추천이 없습니다</p>
              <p className="text-xs mt-1">가족에게 좋은 책을 추천해보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-fade">
              {sortedRecs.map((rec) => (
                <RecommendCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

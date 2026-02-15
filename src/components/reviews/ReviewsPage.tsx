import { useState, useEffect } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import ReviewCard from './ReviewCard'
import ReviewForm from './ReviewForm'
import RecommendCard from './RecommendCard'
import RecommendForm from './RecommendForm'
import CommunityReviewCard from './CommunityReviewCard'
import BookDetailModal from './BookDetailModal'
import LetterCard from './LetterCard'
import LetterForm from './LetterForm'

type SubTab = 'reviews' | 'recommends' | 'letters' | 'community'

export default function ReviewsPage() {
  const [subTab, setSubTab] = useState<SubTab>('reviews')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showRecommendForm, setShowRecommendForm] = useState(false)
  const [showLetterForm, setShowLetterForm] = useState(false)
  const [selectedBook, setSelectedBook] = useState<string | null>(null)

  const reviews = useGraphStore((s) => s.reviews)
  const recommendations = useGraphStore((s) => s.recommendations)
  const letters = useGraphStore((s) => s.letters)
  const communityReviews = useGraphStore((s) => s.communityReviews)
  const loadCommunityReviews = useGraphStore((s) => s.loadCommunityReviews)

  useEffect(() => {
    if (subTab === 'community') {
      loadCommunityReviews()
    }
  }, [subTab, loadCommunityReviews])

  const sortedReviews = [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const sortedRecs = [...recommendations].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const sortedLetters = [...letters].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-cream-100 flex items-center gap-2">
          <span>💬</span> 독서 나눔
        </h1>
        <p className="text-sm text-espresso-300 mt-1">가족과 함께 독서 후기와 추천을 나눠요</p>
      </div>

      {/* Sub-tab toggle — 4 tabs */}
      <div className="flex items-center gap-1 bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-xl p-1 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        {([
          { key: 'reviews' as const, label: `우리 후기 (${reviews.length})`, icon: '📝' },
          { key: 'recommends' as const, label: `우리 추천 (${recommendations.length})`, icon: '👍' },
          { key: 'letters' as const, label: `독서 편지 (${letters.length})`, icon: '💌' },
          { key: 'community' as const, label: '전체 게시판', icon: '🌐' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              subTab === tab.key ? 'bg-surface-lighter text-cream-100' : 'text-espresso-400 hover:text-espresso-200'
            }`}
          >
            <span>{tab.icon}</span> <span className="hidden md:inline">{tab.label}</span>
            <span className="md:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
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

      {/* Letters tab */}
      {subTab === 'letters' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowLetterForm(!showLetterForm)}
              className="text-xs px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              + 편지 쓰기
            </button>
          </div>

          {showLetterForm && (
            <LetterForm onClose={() => setShowLetterForm(false)} />
          )}

          <div className="bg-surface-light/60 border border-surface-border rounded-xl p-4 animate-fade-in-up">
            <p className="text-xs text-espresso-300">
              💌 가족에게 읽은 책에 대한 감상, 응원, 감사의 마음을 전해보세요. 편지는 가족만 볼 수 있어요.
            </p>
          </div>

          {sortedLetters.length === 0 ? (
            <div className="text-center py-12 text-espresso-400">
              <span className="text-4xl block mb-3">💌</span>
              <p>아직 편지가 없습니다</p>
              <p className="text-xs mt-1">가족에게 첫 독서 편지를 보내보세요!</p>
            </div>
          ) : (
            <div className="space-y-4 stagger-fade">
              {sortedLetters.map((letter) => (
                <LetterCard key={letter.id} letter={letter} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Community tab */}
      {subTab === 'community' && (
        <div className="space-y-4">
          <div className="bg-surface-light/60 border border-surface-border rounded-xl p-4 animate-fade-in-up">
            <p className="text-xs text-espresso-300">
              🌐 모든 가족의 독서 후기를 볼 수 있습니다. 책 제목을 클릭하면 다른 독자 정보를 확인할 수 있어요!
            </p>
          </div>

          {communityReviews.length === 0 ? (
            <div className="text-center py-12 text-espresso-400">
              <span className="text-4xl block mb-3">🌐</span>
              <p>아직 전체 후기가 없습니다</p>
              <p className="text-xs mt-1">첫 후기를 작성하면 모든 가족이 볼 수 있어요!</p>
            </div>
          ) : (
            <div className="space-y-4 stagger-fade">
              {communityReviews.map((review) => (
                <CommunityReviewCard
                  key={review.reviewId}
                  review={review}
                  onBookClick={(title) => setSelectedBook(title)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Book detail modal */}
      {selectedBook && (
        <BookDetailModal
          bookTitle={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  )
}

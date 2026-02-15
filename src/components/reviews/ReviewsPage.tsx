import { useState, useEffect } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import UnifiedPostCard from './UnifiedPostCard'
import ReviewForm from './ReviewForm'
import RecommendForm from './RecommendForm'
import LetterCard from './LetterCard'
import LetterForm from './LetterForm'
import BookDetailModal from './BookDetailModal'

type SubTab = 'feed' | 'letters'

export default function ReviewsPage() {
  const [subTab, setSubTab] = useState<SubTab>('feed')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showRecommendForm, setShowRecommendForm] = useState(false)
  const [showLetterForm, setShowLetterForm] = useState(false)
  const [selectedBook, setSelectedBook] = useState<string | null>(null)

  const communityFeed = useGraphStore((s) => s.communityFeed)
  const letters = useGraphStore((s) => s.letters)
  const reviewCount = useGraphStore((s) => s.reviews.length)
  const recCount = useGraphStore((s) => s.recommendations.length)
  const loadCommunityFeed = useGraphStore((s) => s.loadCommunityFeed)

  // Reload feed on mount and when reviews/recommendations change
  useEffect(() => {
    loadCommunityFeed()
  }, [loadCommunityFeed, reviewCount, recCount])

  const sortedLetters = [...letters].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="flex-1 overflow-y-auto px-3 pt-2 pb-8 md:p-8 space-y-2 md:space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-cream-100 flex items-center gap-2">
          <span>💬</span> 독서 나눔
        </h1>
        <p className="text-sm text-espresso-300 mt-1">모든 가족과 독서 후기와 추천을 나눠요</p>
      </div>

      {/* Sub-tab toggle — 2 tabs */}
      <div className="flex items-center gap-1 bg-surface-light/80 border border-surface-border rounded-xl p-1 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <button
          onClick={() => setSubTab('feed')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 md:py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            subTab === 'feed' ? 'bg-surface-lighter text-cream-100' : 'text-espresso-400 hover:text-espresso-200'
          }`}
        >
          <span>📬</span> 게시판 ({communityFeed.length})
        </button>
        <button
          onClick={() => setSubTab('letters')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 md:py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            subTab === 'letters' ? 'bg-surface-lighter text-cream-100' : 'text-espresso-400 hover:text-espresso-200'
          }`}
        >
          <span>💌</span> 편지 ({letters.length})
        </button>
      </div>

      {/* Feed tab */}
      {subTab === 'feed' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowRecommendForm(!showRecommendForm); setShowReviewForm(false) }}
              className="text-xs px-4 py-2 bg-olive-500 hover:bg-olive-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              + 책 추천
            </button>
            <button
              onClick={() => { setShowReviewForm(!showReviewForm); setShowRecommendForm(false) }}
              className="text-xs px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              + 후기 작성
            </button>
          </div>

          {showReviewForm && (
            <ReviewForm onClose={() => setShowReviewForm(false)} />
          )}
          {showRecommendForm && (
            <RecommendForm onClose={() => setShowRecommendForm(false)} />
          )}

          {communityFeed.length === 0 ? (
            <div className="text-center py-12 text-espresso-400">
              <span className="text-4xl block mb-3">📬</span>
              <p>아직 게시글이 없습니다</p>
              <p className="text-xs mt-1">첫 후기나 추천을 작성해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4 stagger-fade">
              {communityFeed.map((post) => (
                <UnifiedPostCard
                  key={post.postId}
                  post={post}
                  onBookClick={(title) => setSelectedBook(title)}
                />
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

          <div className="bg-surface-light/60 border border-surface-border rounded-xl p-2 md:p-4 animate-fade-in-up">
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

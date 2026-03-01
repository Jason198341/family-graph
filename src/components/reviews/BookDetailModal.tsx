import { useState, useEffect } from 'react'
import { useReadingStore } from '@/stores/readingStore'
import type { BookReaderInfo } from '@/types'

interface BookDetailModalProps {
  bookTitle: string
  onClose: () => void
}

export default function BookDetailModal({ bookTitle, onClose }: BookDetailModalProps) {
  const [readers, setReaders] = useState<BookReaderInfo[]>([])
  const [loading, setLoading] = useState(true)
  const getBookReaders = useReadingStore((s) => s.getBookReaders)
  const communityFeed = useReadingStore((s) => s.communityFeed)

  const bookReviews = communityFeed.filter(
    (r) => r.bookTitle.toLowerCase() === bookTitle.toLowerCase() && r.postType === 'review',
  )

  useEffect(() => {
    setLoading(true)
    getBookReaders(bookTitle).then((data) => {
      setReaders(data)
      setLoading(false)
    })
  }, [bookTitle, getBookReaders])

  const completedCount = readers.filter((r) => r.completed).length
  const readingCount = readers.filter((r) => !r.completed).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${bookTitle} 상세 정보`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-surface-light border border-surface-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-cream-100">📖 {bookTitle}</h2>
          <button
            onClick={onClose}
            aria-label="모달 닫기"
            className="w-8 h-8 rounded-lg bg-surface-lighter border border-surface-border flex items-center justify-center text-espresso-300 hover:text-cream-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-surface-lighter rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-cream-100">{readers.length}</p>
                <p className="text-xs text-espresso-400">총 독자</p>
              </div>
              <div className="bg-surface-lighter rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-success-400">{completedCount}</p>
                <p className="text-xs text-espresso-400">완독</p>
              </div>
              <div className="bg-surface-lighter rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-amber-600">{readingCount}</p>
                <p className="text-xs text-espresso-400">읽는 중</p>
              </div>
            </div>

            {/* Reader list */}
            {readers.length > 0 ? (
              <div className="mb-5">
                <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-3">
                  이 책을 읽은 사람들
                </h3>
                <div className="space-y-2">
                  {readers.map((reader, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-surface-lighter/60 rounded-xl border border-surface-border"
                    >
                      <span className="text-lg">{reader.personEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-cream-100">{reader.personName}</p>
                        <p className="text-xs text-espresso-400">
                          {reader.familyEmoji} {reader.familyName}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {reader.completed ? (
                          <span className="text-xs px-2 py-0.5 bg-success-500/15 text-success-400 rounded-full font-semibold">
                            완독
                          </span>
                        ) : (
                          <span className="text-xs text-espresso-400">
                            {reader.currentPage}/{reader.totalPages}p
                          </span>
                        )}
                        {reader.reviewCount > 0 && (
                          <p className="text-xs text-espresso-400 mt-0.5">
                            후기 {reader.reviewCount}개
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 mb-5">
                <p className="text-sm text-espresso-400">아직 독자 정보가 없습니다</p>
              </div>
            )}

            {/* Related reviews */}
            {bookReviews.length > 0 && (
              <div>
                <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-3">
                  관련 후기
                </h3>
                <div className="space-y-3">
                  {bookReviews.map((review) => (
                    <div
                      key={review.postId}
                      className="p-3 bg-surface-lighter/60 rounded-xl border border-surface-border"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{review.personEmoji}</span>
                        <span className="text-xs font-semibold text-cream-100">{review.personName}</span>
                        <span className="text-xs text-espresso-400">
                          {review.familyEmoji} {review.familyName}
                        </span>
                        <div
                          className="flex gap-0.5 ml-auto"
                          aria-label={`별점 ${review.rating}점`}
                          role="img"
                        >
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} aria-hidden="true" className={`text-xs ${i < review.rating ? 'text-amber-600' : 'text-surface-border'}`}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-cream-200 leading-relaxed whitespace-pre-wrap">{review.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

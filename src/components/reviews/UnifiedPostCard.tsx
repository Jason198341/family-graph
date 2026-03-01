import { useState, useEffect } from 'react'
import { useReadingStore } from '@/stores/readingStore'
import { useFamilyStore } from '@/stores/familyStore'
import type { CommunityFeedPost } from '@/types'

interface Props {
  post: CommunityFeedPost
  onBookClick: (title: string) => void
}

export default function UnifiedPostCard({ post, onBookClick }: Props) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [readerStats, setReaderStats] = useState<{
    familyCount: number; readerCount: number; completedCount: number
  } | null>(null)

  const feedComments = useReadingStore((s) => s.feedComments)
  const toggleFeedLike = useReadingStore((s) => s.toggleFeedLike)
  const loadPostComments = useReadingStore((s) => s.loadPostComments)
  const addPostComment = useReadingStore((s) => s.addPostComment)
  const getBookReaderStats = useReadingStore((s) => s.getBookReaderStats)

  const family = useFamilyStore((s) => s.family)
  const familyId = family?.id ?? 'local'
  const isOurFamily = familyId === post.familyId
  const isLiked = post.likes.includes(familyId)
  const comments = feedComments[post.postId] ?? []

  useEffect(() => {
    getBookReaderStats(post.bookTitle).then(setReaderStats)
  }, [post.bookTitle, getBookReaderStats])

  useEffect(() => {
    if (showComments) {
      loadPostComments(post.postId, post.postType)
    }
  }, [showComments, post.postId, post.postType, loadPostComments])

  const handleComment = () => {
    if (!commentText.trim()) return
    addPostComment(post.postId, post.postType, commentText.trim())
    setCommentText('')
  }

  return (
    <div className={`bg-surface-light/80 backdrop-blur-md border rounded-2xl p-5 transition-colors ${
      isOurFamily ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-surface-border hover:border-surface-hover'
    }`}>
      {/* Type badge + family badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
          post.postType === 'review'
            ? 'bg-amber-500/20 text-amber-600'
            : 'bg-olive-500/20 text-olive-300'
        }`}>
          {post.postType === 'review' ? '후기' : '추천'}
        </span>

        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-lighter rounded-lg border border-surface-border">
          <span className="text-xs">{post.familyEmoji}</span>
          <span className="text-xs text-espresso-300">{post.familyName}</span>
          {isOurFamily && (
            <span className="text-xs px-1 py-0.5 bg-amber-500/20 text-amber-600 rounded font-bold">
              우리
            </span>
          )}
        </div>

        <span className="text-xs text-espresso-400 ml-auto shrink-0">
          {new Date(post.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>

      {/* Author + book */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{post.personEmoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-cream-100">{post.personName}</p>
          <button
            onClick={() => onBookClick(post.bookTitle)}
            className="text-xs text-espresso-400 hover:text-amber-600 transition-colors cursor-pointer truncate block"
          >
            {post.bookEmoji} {post.bookTitle} · {post.bookAuthor}
          </button>
        </div>
      </div>

      {/* Rating (reviews only) */}
      {post.postType === 'review' && post.rating > 0 && (
        <div
          className="flex items-center gap-0.5 mb-3"
          role="img"
          aria-label={`별점 ${post.rating}점`}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} aria-hidden="true" className={`text-base ${i <= post.rating ? 'text-amber-600' : 'text-surface-border'}`}>
              ★
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <p className="text-sm text-cream-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Reader stats */}
      {readerStats && readerStats.readerCount > 0 && (
        <button
          onClick={() => onBookClick(post.bookTitle)}
          className="mt-3 flex items-center gap-1.5 text-xs text-espresso-400 hover:text-amber-600 transition-colors cursor-pointer"
        >
          <span>📖</span>
          <span>
            {readerStats.familyCount}가족 · {readerStats.readerCount}명 읽는 중
            {readerStats.completedCount > 0 && ` · ${readerStats.completedCount}명 완독`}
          </span>
        </button>
      )}

      {/* Footer: like + comments */}
      <div className="mt-4 pt-3 border-t border-surface-border">
        <div className="flex items-center gap-3">
          {/* Single family-level like button */}
          <button
            onClick={() => toggleFeedLike(post.postId, post.postType)}
            aria-label={isLiked ? `좋아요 취소 (${post.likes.length}개)` : `좋아요 (${post.likes.length}개)`}
            aria-pressed={isLiked}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer min-h-[44px] ${
              isLiked
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : 'bg-surface-lighter text-espresso-400 border-surface-border hover:text-cream-200'
            }`}
          >
            <span aria-hidden="true">{isLiked ? '❤️' : '🤍'}</span>
            <span>좋아요{post.likes.length > 0 ? ` ${post.likes.length}` : ''}</span>
          </button>

          {/* Comment toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            aria-label={`댓글 ${showComments ? '닫기' : '보기'}${post.commentCount > 0 ? ` (${post.commentCount}개)` : ''}`}
            aria-expanded={showComments}
            className="flex items-center gap-1.5 text-xs text-espresso-400 hover:text-cream-200 transition-colors cursor-pointer min-h-[44px]"
          >
            <span aria-hidden="true">💬</span>
            <span>댓글{post.commentCount > 0 ? ` ${post.commentCount}` : ''}</span>
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 space-y-3 animate-fade-in-up">
            {comments.length > 0 && (
              <div className="space-y-2">
                {comments.map((c) => (
                  <div key={c.commentId} className="flex gap-2 items-start">
                    <span className="text-sm mt-0.5">{c.familyEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-cream-100">{c.familyName}</span>
                        <span className="text-xs text-espresso-400 ml-auto shrink-0">
                          {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-xs text-cream-200 mt-0.5 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {comments.length === 0 && (
              <p className="text-xs text-espresso-400 text-center py-2">아직 댓글이 없습니다</p>
            )}

            {/* Comment input — post as family, no person selector */}
            <div className="flex gap-2 pt-2 border-t border-surface-border">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                placeholder="댓글 입력..."
                aria-label="댓글 입력"
                className="flex-1 text-xs p-2 bg-surface border border-surface-border rounded-lg text-cream-100 placeholder:text-espresso-400 outline-none focus:border-amber-500"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                aria-label="댓글 전송"
                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                전송
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

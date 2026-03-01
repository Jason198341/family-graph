import { useState } from 'react'
import { useReadingStore } from '@/stores/readingStore'

interface ReviewFormProps {
  onClose: () => void
}

export default function ReviewForm({ onClose }: ReviewFormProps) {
  const persons = useReadingStore((s) => s.persons)
  const books = useReadingStore((s) => s.books)
  const addReview = useReadingStore((s) => s.addReview)
  const addToast = useReadingStore((s) => s.addToast)

  const [personId, setPersonId] = useState(persons[0]?.id ?? '')
  const [bookId, setBookId] = useState(books[0]?.id ?? '')
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [hoverRating, setHoverRating] = useState(0)

  const handleSubmit = () => {
    if (!personId || !bookId || rating === 0 || !content.trim()) {
      addToast('모든 항목을 입력해주세요', 'error')
      return
    }
    addReview({ personId, bookId, rating, content: content.trim() })
    addToast('후기가 등록되었습니다!', 'success')
    onClose()
  }

  return (
    <div className="bg-surface-light/80 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 space-y-4 animate-fade-in-up">
      <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold">후기 작성</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="review-person" className="text-xs text-espresso-400 block mb-1">작성자</label>
          <select
            id="review-person"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-amber-500 cursor-pointer"
          >
            {persons.map((p) => (
              <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="review-book" className="text-xs text-espresso-400 block mb-1">책</label>
          <select
            id="review-book"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-amber-500 cursor-pointer"
          >
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.emoji} {b.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Star rating selector */}
      <div>
        <p className="text-xs text-espresso-400 block mb-1" id="review-rating-label">별점</p>
        <div className="flex items-center gap-1" role="group" aria-labelledby="review-rating-label">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`별점 ${star}점`}
              aria-pressed={rating === star}
              className="text-2xl cursor-pointer transition-transform hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <span aria-hidden="true" className={star <= (hoverRating || rating) ? 'text-amber-600' : 'text-surface-border'}>
                ★
              </span>
            </button>
          ))}
          {rating > 0 && (
            <span className="text-xs text-espresso-400 ml-2" aria-live="polite">{rating}점</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div>
        <label htmlFor="review-content" className="text-xs text-espresso-400 block mb-1">후기</label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이 책을 읽고 느낀 점을 자유롭게 적어주세요..."
          rows={4}
          className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-amber-500 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs text-espresso-300 hover:text-cream-100 transition-colors cursor-pointer"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
        >
          등록
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useReadingStore } from '@/stores/readingStore'

interface RecommendFormProps {
  onClose: () => void
}

export default function RecommendForm({ onClose }: RecommendFormProps) {
  const persons = useReadingStore((s) => s.persons)
  const books = useReadingStore((s) => s.books)
  const addRecommendation = useReadingStore((s) => s.addRecommendation)
  const addToast = useReadingStore((s) => s.addToast)

  const [personId, setPersonId] = useState(persons[0]?.id ?? '')
  const [bookId, setBookId] = useState(books[0]?.id ?? '')
  const [reason, setReason] = useState('')

  const selectedBook = books.find((b) => b.id === bookId)

  const handleSubmit = () => {
    if (!personId || !bookId || !reason.trim()) {
      addToast('필수 항목을 입력해주세요', 'error')
      return
    }
    addRecommendation({
      personId,
      bookTitle: selectedBook?.title ?? '',
      author: selectedBook?.author ?? '',
      reason: reason.trim(),
      emoji: selectedBook?.emoji ?? '📖',
    })
    addToast('추천이 등록되었습니다!', 'success')
    onClose()
  }

  return (
    <div className="bg-surface-light/80 backdrop-blur-md border border-olive-500/30 rounded-2xl p-5 space-y-4 animate-fade-in-up">
      <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold">책 추천</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="recommend-person" className="text-xs text-espresso-400 block mb-1">추천인</label>
          <select
            id="recommend-person"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-olive-500 cursor-pointer"
          >
            {persons.map((p) => (
              <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="recommend-book" className="text-xs text-espresso-400 block mb-1">책</label>
          <select
            id="recommend-book"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-olive-500 cursor-pointer"
          >
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.emoji} {b.title}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedBook && (
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-lighter/60 rounded-lg border border-surface-border text-xs text-espresso-300">
          <span className="text-lg">{selectedBook.emoji}</span>
          <div>
            <p className="text-cream-100 font-medium">{selectedBook.title}</p>
            <p>{selectedBook.author}</p>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="recommend-reason" className="text-xs text-espresso-400 block mb-1">추천 이유 *</label>
        <textarea
          id="recommend-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="이 책을 왜 추천하나요?"
          rows={3}
          className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-olive-500 resize-none"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs text-espresso-300 hover:text-cream-100 transition-colors cursor-pointer"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-olive-500 hover:bg-olive-600 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
        >
          추천하기
        </button>
      </div>
    </div>
  )
}

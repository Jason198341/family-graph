import { useState } from 'react'
import { useGraphStore } from '@/stores/graphStore'

interface LetterFormProps {
  onClose: () => void
}

export default function LetterForm({ onClose }: LetterFormProps) {
  const persons = useGraphStore((s) => s.persons)
  const books = useGraphStore((s) => s.books)
  const addLetter = useGraphStore((s) => s.addLetter)
  const addToast = useGraphStore((s) => s.addToast)

  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [bookId, setBookId] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = () => {
    if (!fromId || !toId || !content.trim()) return
    if (fromId === toId) {
      addToast('보내는 사람과 받는 사람이 같아요!', 'error')
      return
    }
    addLetter({
      fromPersonId: fromId,
      toPersonId: toId,
      bookId: bookId || undefined,
      content: content.trim(),
    })
    addToast('독서 편지가 전달되었어요 💌', 'success')
    onClose()
  }

  return (
    <div className="bg-surface-light/80 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 animate-fade-in-up">
      <h3 className="text-sm font-bold text-cream-100 mb-4">💌 독서 편지 쓰기</h3>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-espresso-400 mb-1 block">보내는 사람</label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full text-xs p-2 bg-surface rounded-lg border border-surface-border text-cream-100"
            >
              <option value="">선택</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-espresso-400 mb-1 block">받는 사람</label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full text-xs p-2 bg-surface rounded-lg border border-surface-border text-cream-100"
            >
              <option value="">선택</option>
              {persons.filter((p) => p.id !== fromId).map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-espresso-400 mb-1 block">관련 책 (선택)</label>
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="w-full text-xs p-2 bg-surface rounded-lg border border-surface-border text-cream-100"
          >
            <option value="">없음</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.emoji} {b.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-espresso-400 mb-1 block">편지 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="읽은 책에 대한 감상, 응원, 감사의 마음을 전해보세요..."
            rows={4}
            className="w-full text-sm p-3 bg-surface rounded-lg border border-surface-border text-cream-100 placeholder:text-espresso-400 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 text-espresso-300 hover:text-cream-100 cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!fromId || !toId || !content.trim()}
            className="text-xs px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-medium"
          >
            💌 편지 보내기
          </button>
        </div>
      </div>
    </div>
  )
}

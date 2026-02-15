import { useState } from 'react'
import { useGraphStore } from '@/stores/graphStore'

interface RecommendFormProps {
  onClose: () => void
}

const EMOJI_OPTIONS = ['📖', '📚', '📕', '📗', '📘', '📙', '🔥', '💎', '🌟', '🎯', '🧠', '💡']

export default function RecommendForm({ onClose }: RecommendFormProps) {
  const persons = useGraphStore((s) => s.persons)
  const addRecommendation = useGraphStore((s) => s.addRecommendation)
  const addToast = useGraphStore((s) => s.addToast)

  const [personId, setPersonId] = useState(persons[0]?.id ?? '')
  const [bookTitle, setBookTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [reason, setReason] = useState('')
  const [emoji, setEmoji] = useState('📖')

  const handleSubmit = () => {
    if (!personId || !bookTitle.trim() || !reason.trim()) {
      addToast('필수 항목을 입력해주세요', 'error')
      return
    }
    addRecommendation({
      personId,
      bookTitle: bookTitle.trim(),
      author: author.trim() || '미입력',
      reason: reason.trim(),
      emoji,
    })
    addToast('추천이 등록되었습니다!', 'success')
    onClose()
  }

  return (
    <div className="bg-surface-light/80 backdrop-blur-md border border-olive-500/30 rounded-2xl p-5 space-y-4 animate-fade-in-up">
      <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold">책 추천</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-espresso-400 block mb-1">추천인</label>
          <select
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
          <label className="text-xs text-espresso-400 block mb-1">이모지</label>
          <div className="flex flex-wrap gap-1">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-7 h-7 rounded text-base flex items-center justify-center cursor-pointer transition-all ${
                  emoji === e ? 'bg-olive-500/30 ring-1 ring-olive-400' : 'hover:bg-surface-lighter'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-espresso-400 block mb-1">책 제목 *</label>
          <input
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="추천할 책 제목"
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-olive-500"
          />
        </div>
        <div>
          <label className="text-xs text-espresso-400 block mb-1">저자</label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="저자"
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-olive-500"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-espresso-400 block mb-1">추천 이유 *</label>
        <textarea
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

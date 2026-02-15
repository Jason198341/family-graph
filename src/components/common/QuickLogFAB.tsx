import { useState, useRef, useEffect } from 'react'
import { useReadingStore } from '@/stores/readingStore'

const today = () => new Date().toISOString().slice(0, 10)

export default function QuickLogFAB() {
  const [open, setOpen] = useState(false)
  const persons = useReadingStore((s) => s.persons)
  const books = useReadingStore((s) => s.books)
  const addReadingLog = useReadingStore((s) => s.addReadingLog)
  const lastReaderId = useReadingStore((s) => s.lastReaderId)
  const lastBookId = useReadingStore((s) => s.lastBookId)

  const [personId, setPersonId] = useState('')
  const [bookId, setBookId] = useState('')
  const [lines, setLines] = useState('')
  const linesRef = useRef<HTMLInputElement>(null)

  // Pre-fill smart defaults when opening
  useEffect(() => {
    if (open) {
      setPersonId(lastReaderId && persons.some((p) => p.id === lastReaderId) ? lastReaderId : persons[0]?.id ?? '')
      setBookId(lastBookId && books.some((b) => b.id === lastBookId) ? lastBookId : books[0]?.id ?? '')
      setLines('')
      // Focus the lines input after a tick (let the sheet animate in)
      setTimeout(() => linesRef.current?.focus(), 300)
    }
  }, [open, lastReaderId, lastBookId, persons, books])

  const handleSubmit = () => {
    const n = parseInt(lines, 10)
    if (!personId || !bookId || !n || n <= 0) return
    addReadingLog({ personId, bookId, date: today(), linesRead: n })
    setOpen(false)
  }

  const selectedPerson = persons.find((p) => p.id === personId)
  const selectedBook = books.find((b) => b.id === bookId)

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-20 md:bottom-6 z-40 w-14 h-14 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all cursor-pointer"
        aria-label="독서 기록 추가"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Bottom sheet overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-stone-300" />
            </div>

            <div className="px-5 pb-6 pt-2">
              <h3 className="text-base font-bold text-stone-800 mb-4">
                오늘의 독서 기록
              </h3>

              {/* Person selector */}
              <div className="mb-3">
                <label className="text-xs font-medium text-stone-500 mb-1.5 block">누가 읽었나요?</label>
                <div className="flex gap-2 flex-wrap">
                  {persons.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPersonId(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer ${
                        personId === p.id
                          ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <span>{p.emoji}</span>
                      <span className="font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Book selector */}
              <div className="mb-4">
                <label className="text-xs font-medium text-stone-500 mb-1.5 block">어떤 책을 읽었나요?</label>
                <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto">
                  {books.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBookId(b.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer ${
                        bookId === b.id
                          ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <span>{b.emoji}</span>
                      <span className="font-medium truncate max-w-[120px]">{b.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lines input + submit */}
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-stone-500 mb-1.5 block">몇 줄 읽었나요?</label>
                  <input
                    ref={linesRef}
                    type="number"
                    inputMode="numeric"
                    value={lines}
                    onChange={(e) => setLines(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-lg font-bold text-stone-800 text-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!personId || !bookId || !lines || parseInt(lines) <= 0}
                  className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                >
                  기록
                </button>
              </div>

              {/* Smart default hint */}
              {selectedPerson && selectedBook && (
                <p className="text-xs text-stone-400 mt-3 text-center">
                  {selectedPerson.emoji} {selectedPerson.name}이(가) &laquo;{selectedBook.title}&raquo; 읽는 중
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

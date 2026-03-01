import { useState, useRef, useEffect } from 'react'
import { useReadingStore } from '@/stores/readingStore'

const today = () => new Date().toISOString().slice(0, 10)

export default function QuickLogFAB() {
  const [open, setOpen] = useState(false)
  const persons = useReadingStore((s) => s.persons)
  const books = useReadingStore((s) => s.books)
  const addReadingLog = useReadingStore((s) => s.addReadingLog)
  const updateBookProgress = useReadingStore((s) => s.updateBookProgress)
  const getBookProgress = useReadingStore((s) => s.getBookProgress)
  const addToast = useReadingStore((s) => s.addToast)
  const lastReaderId = useReadingStore((s) => s.lastReaderId)
  const lastBookId = useReadingStore((s) => s.lastBookId)

  const [personId, setPersonId] = useState('')
  const [bookId, setBookId] = useState('')
  const [currentPage, setCurrentPage] = useState('')
  const pageRef = useRef<HTMLInputElement>(null)

  // Pre-fill smart defaults when opening
  useEffect(() => {
    if (open) {
      setPersonId(lastReaderId && persons.some((p) => p.id === lastReaderId) ? lastReaderId : persons[0]?.id ?? '')
      setBookId(lastBookId && books.some((b) => b.id === lastBookId) ? lastBookId : books[0]?.id ?? '')
      setCurrentPage('')
      setTimeout(() => pageRef.current?.focus(), 300)
    }
  }, [open, lastReaderId, lastBookId, persons, books])

  const selectedBook = books.find((b) => b.id === bookId)
  const prevPage = (personId && bookId) ? (getBookProgress(personId, bookId)?.currentPage ?? 0) : 0
  const linesPerPage = selectedBook?.linesPerPage ?? 25
  const pageVal = parseInt(currentPage, 10) || 0
  const pagesRead = Math.max(0, pageVal - prevPage)
  const calculatedLines = pagesRead * linesPerPage

  const handleSubmit = () => {
    if (!personId || !bookId || pageVal <= 0 || pageVal <= prevPage) {
      if (pageVal > 0 && pageVal <= prevPage) {
        addToast(`현재 페이지(${pageVal})가 이전 기록(${prevPage})보다 작거나 같습니다`, 'error')
      }
      return
    }
    updateBookProgress(personId, bookId, pageVal)
    addReadingLog({ personId, bookId, date: today(), linesRead: calculatedLines })
    addToast(`${pagesRead}p × ${linesPerPage}줄 = ${calculatedLines.toLocaleString()}줄 기록!`, 'success')
    setOpen(false)
  }

  const selectedPerson = persons.find((p) => p.id === personId)

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
            role="dialog"
            aria-modal="true"
            aria-label="오늘의 독서 기록"
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

              {/* Current page input + submit */}
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-stone-500 mb-1.5 block">현재 페이지</label>
                  <input
                    ref={pageRef}
                    type="number"
                    inputMode="numeric"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder={`${prevPage + 1}`}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-lg font-bold text-stone-800 text-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!personId || !bookId || pageVal <= prevPage}
                  className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                >
                  기록
                </button>
              </div>

              {/* Progress info */}
              {selectedPerson && selectedBook && (
                <div className="mt-3 text-center space-y-0.5">
                  <p className="text-xs text-stone-400">
                    {selectedPerson.emoji} {selectedPerson.name} · {selectedBook.emoji} {selectedBook.title}
                  </p>
                  <p className="text-xs text-stone-400">
                    이전: {prevPage}p / {selectedBook.totalPages}p
                    {calculatedLines > 0 && (
                      <span className="text-amber-600 font-medium"> → +{pagesRead}p = {calculatedLines.toLocaleString()}줄</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import { useState, useMemo } from 'react'
import { useGraphStore } from '@/stores/graphStore'

function formatMonth(month: string) {
  const [y, m] = month.split('-')
  return `${y}년 ${parseInt(m, 10)}월`
}

function prevMonth(month: string) {
  const d = new Date(month + '-01')
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 7)
}

function nextMonth(month: string) {
  const d = new Date(month + '-01')
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 7)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function ReadingTracker() {
  const persons = useGraphStore((s) => s.persons)
  const books = useGraphStore((s) => s.books)
  const readingLogs = useGraphStore((s) => s.readingLogs)
  const readingGoals = useGraphStore((s) => s.readingGoals)
  const addReadingLog = useGraphStore((s) => s.addReadingLog)
  const addBook = useGraphStore((s) => s.addBook)
  const addRelation = useGraphStore((s) => s.addRelation)
  const addToast = useGraphStore((s) => s.addToast)

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [formPersonId, setFormPersonId] = useState(persons[0]?.id ?? '')
  const [formBookId, setFormBookId] = useState(books[0]?.id ?? '')
  const [formLines, setFormLines] = useState('')
  const [formDate, setFormDate] = useState(todayStr)
  const [showAddBook, setShowAddBook] = useState(false)
  const [newBook, setNewBook] = useState({ title: '', author: '', totalPages: '', linesPerPage: '', emoji: '📚', color: '#a855f7' })

  // ── Computed data ──
  const familyStats = useMemo(() => {
    return persons.map((person) => {
      const monthLogs = readingLogs.filter(
        (l) => l.personId === person.id && l.date.startsWith(selectedMonth),
      )
      const totalLines = monthLogs.reduce((sum, l) => sum + l.linesRead, 0)
      const goal = readingGoals.find(
        (g) => g.personId === person.id && g.month === selectedMonth,
      )
      const targetLines = goal?.targetLines ?? 0
      const progress = targetLines > 0 ? Math.min(100, Math.round((totalLines / targetLines) * 100)) : 0

      // Current book: most recent log
      const lastLog = [...monthLogs].sort((a, b) => b.date.localeCompare(a.date))[0]
      const currentBook = lastLog ? books.find((b) => b.id === lastLog.bookId) : null

      // Read today?
      const today = todayStr()
      const readToday = monthLogs.some((l) => l.date === today)

      // Streak
      const allLogs = readingLogs.filter((l) => l.personId === person.id)
      const uniqueDates = [...new Set(allLogs.map((l) => l.date))].sort().reverse()
      let streak = 0
      const now = new Date()
      for (let i = 0; i < uniqueDates.length; i++) {
        const checkDate = new Date(now)
        checkDate.setDate(checkDate.getDate() - i)
        if (uniqueDates.includes(checkDate.toISOString().slice(0, 10))) {
          streak++
        } else break
      }

      return { person, totalLines, targetLines, progress, currentBook, readToday, streak, logCount: monthLogs.length }
    })
  }, [persons, readingLogs, readingGoals, books, selectedMonth])

  const familyTotalLines = familyStats.reduce((s, f) => s + f.totalLines, 0)
  const familyTotalTarget = familyStats.reduce((s, f) => s + f.targetLines, 0)
  const familyProgress = familyTotalTarget > 0 ? Math.min(100, Math.round((familyTotalLines / familyTotalTarget) * 100)) : 0

  // ── Handlers ──
  const handleAddLog = () => {
    const lines = parseInt(formLines, 10)
    if (!formPersonId || !formBookId || isNaN(lines) || lines <= 0) {
      addToast('사람, 책, 줄 수를 확인하세요', 'error')
      return
    }
    addReadingLog({ personId: formPersonId, bookId: formBookId, date: formDate, linesRead: lines })
    addToast(`${lines}줄 기록 완료!`, 'success')
    setFormLines('')
  }

  const handleAddBook = () => {
    if (!newBook.title || !newBook.author) {
      addToast('제목과 저자를 입력하세요', 'error')
      return
    }
    const book = addBook({
      title: newBook.title,
      author: newBook.author,
      totalPages: parseInt(newBook.totalPages, 10) || 200,
      linesPerPage: parseInt(newBook.linesPerPage, 10) || 25,
      emoji: newBook.emoji,
      color: newBook.color,
    })
    // Auto-create reads relation for first person
    if (formPersonId) {
      addRelation({
        sourceId: formPersonId,
        targetId: book.id,
        sourceType: 'person',
        targetType: 'book',
        relationType: 'reads',
        label: '읽는 중',
        strength: 5,
      })
    }
    addToast(`"${book.title}" 추가 완료!`, 'success')
    setNewBook({ title: '', author: '', totalPages: '', linesPerPage: '', emoji: '📚', color: '#a855f7' })
    setShowAddBook(false)
    setFormBookId(book.id)
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📚</span> 독서 프로젝트
        </h1>
        <p className="text-sm text-gray-500 mt-1">가족이 함께 읽고 성장하는 독서 트래커</p>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <button
          onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
          className="w-8 h-8 rounded-lg bg-surface-lighter border border-surface-border flex items-center justify-center text-gray-400 hover:text-white hover:border-primary-500/50 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="text-lg font-bold text-white min-w-[120px] text-center">{formatMonth(selectedMonth)}</span>
        <button
          onClick={() => setSelectedMonth(nextMonth(selectedMonth))}
          className="w-8 h-8 rounded-lg bg-surface-lighter border border-surface-border flex items-center justify-center text-gray-400 hover:text-white hover:border-primary-500/50 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Family overview stats */}
      <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">가족 전체</p>
          <p className="text-2xl font-bold text-white">{familyTotalLines.toLocaleString()}<span className="text-xs text-gray-500 ml-1">줄</span></p>
          <div className="mt-2 h-1.5 bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-700" style={{ width: `${familyProgress}%` }} />
          </div>
          <p className="text-[10px] text-gray-500 mt-1">{familyProgress}% 달성 (목표 {familyTotalTarget.toLocaleString()}줄)</p>
        </div>
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">등록 도서</p>
          <p className="text-2xl font-bold text-white">{books.length}<span className="text-xs text-gray-500 ml-1">권</span></p>
        </div>
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">이번 달 기록</p>
          <p className="text-2xl font-bold text-white">{readingLogs.filter((l) => l.date.startsWith(selectedMonth)).length}<span className="text-xs text-gray-500 ml-1">건</span></p>
        </div>
      </div>

      {/* Family member cards */}
      <div className="space-y-3">
        <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">구성원별 진행</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {familyStats.map(({ person, totalLines, targetLines, progress, currentBook, readToday, streak }, idx) => (
            <div
              key={person.id}
              className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 animate-fade-in-up hover:border-surface-hover transition-colors"
              style={{ animationDelay: `${150 + idx * 60}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
                  style={{ borderColor: person.color, backgroundColor: `${person.color}15` }}
                >
                  {person.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{person.name}</p>
                    <span className="text-[10px] text-gray-500">{person.role}</span>
                    {readToday && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-growth-500/15 text-growth-400 border border-growth-500/30 rounded-full">오늘 완료</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {totalLines.toLocaleString()} / {targetLines.toLocaleString()}줄
                    {streak > 0 && <span className="ml-2 text-warm-400">🔥 {streak}일 연속</span>}
                  </p>
                </div>
                <span className="text-lg font-bold" style={{ color: person.color }}>{progress}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, backgroundColor: person.color, boxShadow: `0 0 8px ${person.color}40` }}
                />
              </div>

              {/* Current book */}
              {currentBook && (
                <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500">
                  <span>{currentBook.emoji}</span>
                  <span>현재: {currentBook.title}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Log entry form */}
      <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 space-y-4 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
        <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">독서 기록 입력</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Person */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">누가</label>
            <select
              value={formPersonId}
              onChange={(e) => setFormPersonId(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-500 cursor-pointer"
            >
              {persons.map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>

          {/* Book */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">어떤 책</label>
            <select
              value={formBookId}
              onChange={(e) => setFormBookId(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-500 cursor-pointer"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.emoji} {b.title}</option>
              ))}
            </select>
          </div>

          {/* Lines */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">줄 수</label>
            <input
              type="number"
              min={1}
              value={formLines}
              onChange={(e) => setFormLines(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
              placeholder="500"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">날짜</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-end">
            <button
              onClick={handleAddLog}
              className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              기록하기
            </button>
          </div>
        </div>
      </div>

      {/* Bookshelf */}
      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">책장</h2>
          <button
            onClick={() => setShowAddBook(!showAddBook)}
            className="text-[10px] px-3 py-1 bg-surface-lighter border border-surface-border rounded-lg text-gray-400 hover:text-white hover:border-primary-500/50 transition-all cursor-pointer"
          >
            + 새 책 추가
          </button>
        </div>

        {/* Add book form */}
        {showAddBook && (
          <div className="bg-surface-light/80 backdrop-blur-md border border-primary-500/30 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">제목</label>
                <input
                  value={newBook.title}
                  onChange={(e) => setNewBook((p) => ({ ...p, title: e.target.value }))}
                  placeholder="책 제목"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">저자</label>
                <input
                  value={newBook.author}
                  onChange={(e) => setNewBook((p) => ({ ...p, author: e.target.value }))}
                  placeholder="저자"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">전체 페이지</label>
                <input
                  type="number"
                  value={newBook.totalPages}
                  onChange={(e) => setNewBook((p) => ({ ...p, totalPages: e.target.value }))}
                  placeholder="300"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">페이지당 줄 수</label>
                <input
                  type="number"
                  value={newBook.linesPerPage}
                  onChange={(e) => setNewBook((p) => ({ ...p, linesPerPage: e.target.value }))}
                  placeholder="25"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddBook}
                  className="w-full px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  추가
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-600">💡 아이들 책은 페이지당 3~5줄, 일반 도서는 15~25줄 정도입니다</p>
          </div>
        )}

        {/* Book list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {books.map((book) => {
            const totalBookLines = book.totalPages * book.linesPerPage
            const readLines = readingLogs
              .filter((l) => l.bookId === book.id)
              .reduce((s, l) => s + l.linesRead, 0)
            const bookProgress = Math.min(100, Math.round((readLines / totalBookLines) * 100))
            const readers = [...new Set(readingLogs.filter((l) => l.bookId === book.id).map((l) => l.personId))]
              .map((pid) => persons.find((p) => p.id === pid))
              .filter(Boolean)

            return (
              <div
                key={book.id}
                className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-4 hover:border-surface-hover transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{book.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{book.title}</p>
                    <p className="text-[10px] text-gray-500">{book.author} · {book.totalPages}p</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${bookProgress}%`, backgroundColor: book.color }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">{readLines.toLocaleString()} / {totalBookLines.toLocaleString()}줄 ({bookProgress}%)</span>
                  <div className="flex -space-x-1">
                    {readers.map((p) => (
                      <span key={p!.id} className="text-xs" title={p!.name}>{p!.emoji}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent logs */}
      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
        <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">최근 기록</h2>
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl divide-y divide-surface-border overflow-hidden">
          {[...readingLogs]
            .filter((l) => l.date.startsWith(selectedMonth))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 10)
            .map((log) => {
              const person = persons.find((p) => p.id === log.personId)
              const book = books.find((b) => b.id === log.bookId)
              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-base">{person?.emoji ?? '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200">
                      <span className="font-medium">{person?.name}</span>
                      <span className="text-gray-500"> · </span>
                      <span>{book?.emoji} {book?.title}</span>
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary-400">{log.linesRead.toLocaleString()}줄</span>
                  <span className="text-[10px] text-gray-600">{log.date}</span>
                </div>
              )
            })}
          {readingLogs.filter((l) => l.date.startsWith(selectedMonth)).length === 0 && (
            <div className="py-8 text-center text-gray-600 text-sm">이번 달 기록이 없습니다</div>
          )}
        </div>
      </div>
    </div>
  )
}

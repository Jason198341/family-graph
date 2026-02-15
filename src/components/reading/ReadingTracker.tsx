import { useState, useMemo } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import PersonAvatar from '@/components/common/PersonAvatar'
import type { BookProgress } from '@/types'

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
  const removeReadingLog = useGraphStore((s) => s.removeReadingLog)
  const updateReadingLog = useGraphStore((s) => s.updateReadingLog)
  const addReadingGoal = useGraphStore((s) => s.addReadingGoal)
  const updateReadingGoal = useGraphStore((s) => s.updateReadingGoal)
  const addBook = useGraphStore((s) => s.addBook)
  const addToast = useGraphStore((s) => s.addToast)
  const updateBookProgress = useGraphStore((s) => s.updateBookProgress)
  const getBookProgress = useGraphStore((s) => s.getBookProgress)
  const bookProgressList = useGraphStore((s) => s.bookProgress)

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [formPersonId, setFormPersonId] = useState(persons[0]?.id ?? '')
  const [formBookId, setFormBookId] = useState(books[0]?.id ?? '')
  const [formPages, setFormPages] = useState('')
  const [formDate, setFormDate] = useState(todayStr)
  const [pageMode, setPageMode] = useState<'delta' | 'absolute'>('delta')
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  const [showAddBook, setShowAddBook] = useState(false)

  // Edit log state
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editLogLines, setEditLogLines] = useState('')
  const [editLogDate, setEditLogDate] = useState('')
  const [newBook, setNewBook] = useState({ title: '', author: '', totalPages: '', linesPerPage: '', emoji: '📚', color: '#d97706' })

  // ── Computed data ──
  const familyStats = useMemo(() => {
    return persons.map((person) => {
      const monthLogs = readingLogs.filter(
        (l) => l.personId === person.id && l.date.startsWith(selectedMonth),
      )
      const totalLines = monthLogs.reduce((sum, l) => sum + l.linesRead, 0)
      const goal = readingGoals.find((g) => g.personId === person.id && g.month === selectedMonth)
      const targetLines = goal?.targetLines ?? 0
      const progress = targetLines > 0 ? Math.min(100, Math.round((totalLines / targetLines) * 100)) : 0

      const lastLog = [...monthLogs].sort((a, b) => b.date.localeCompare(a.date))[0]
      const currentBook = lastLog ? books.find((b) => b.id === lastLog.bookId) : null

      const today = todayStr()
      const readToday = monthLogs.some((l) => l.date === today)

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

  const selectedBook = books.find((b) => b.id === formBookId)
  const linesPerPage = selectedBook?.linesPerPage ?? 25
  const selectedProgress = getBookProgress(formPersonId, formBookId)

  const calculatedLines = useMemo(() => {
    const val = parseInt(formPages, 10) || 0
    if (pageMode === 'absolute' && selectedBook) {
      const prevPage = selectedProgress?.currentPage ?? 0
      const delta = Math.max(0, val - prevPage)
      return Math.round(delta * linesPerPage)
    }
    return Math.round(val * linesPerPage)
  }, [formPages, pageMode, selectedBook, selectedProgress, linesPerPage])

  const handleAddLog = () => {
    const val = parseInt(formPages, 10)
    if (!formPersonId || !formBookId || isNaN(val) || val <= 0) {
      addToast('사람, 책, 페이지 수를 확인하세요', 'error')
      return
    }

    let pages: number
    const prevPage = selectedProgress?.currentPage ?? 0
    if (pageMode === 'absolute' && selectedBook) {
      pages = Math.max(0, val - prevPage)
      if (pages <= 0) {
        addToast('현재 페이지가 이전 기록보다 작습니다', 'error')
        return
      }
      updateBookProgress(formPersonId, formBookId, val)
    } else {
      pages = val
      if (selectedBook) {
        updateBookProgress(formPersonId, formBookId, prevPage + pages)
      }
    }

    const lines = Math.round(pages * linesPerPage)
    addReadingLog({ personId: formPersonId, bookId: formBookId, date: formDate, linesRead: lines })
    addToast(`${pages}p × ${linesPerPage}줄 = ${lines.toLocaleString()}줄 기록!`, 'success')
    setFormPages('')
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
    addToast(`"${book.title}" 추가 완료!`, 'success')
    setNewBook({ title: '', author: '', totalPages: '', linesPerPage: '', emoji: '📚', color: '#d97706' })
    setShowAddBook(false)
    setFormBookId(book.id)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-cream-100 flex items-center gap-2">
          <span>📖</span> 독서 입력
        </h1>
        <p className="text-sm text-espresso-300 mt-1">가족이 함께 읽고 성장하는 독서 트래커</p>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <button
          onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
          className="w-8 h-8 rounded-lg bg-surface-lighter border border-surface-border flex items-center justify-center text-espresso-300 hover:text-cream-100 hover:border-amber-500/50 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="text-lg font-bold text-cream-100 min-w-[120px] text-center">{formatMonth(selectedMonth)}</span>
        <button
          onClick={() => setSelectedMonth(nextMonth(selectedMonth))}
          className="w-8 h-8 rounded-lg bg-surface-lighter border border-surface-border flex items-center justify-center text-espresso-300 hover:text-cream-100 hover:border-amber-500/50 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button
          onClick={() => setShowGoalEditor(!showGoalEditor)}
          className="ml-auto text-xs px-3 py-1.5 bg-surface-lighter border border-surface-border rounded-lg text-espresso-300 hover:text-cream-100 hover:border-amber-500/50 transition-all cursor-pointer"
        >
          🎯 목표 설정
        </button>
      </div>

      {/* Goal editor (manual only) */}
      {showGoalEditor && (
        <div className="bg-surface-light/80 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 space-y-3 animate-fade-in-up">
          <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold">
            {formatMonth(selectedMonth)} 개인별 독서 목표
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {persons.map((person) => {
              const goal = readingGoals.find(
                (g) => g.personId === person.id && g.month === selectedMonth,
              )
              return (
                <div key={person.id} className="flex items-center gap-3">
                  <span className="text-lg">{person.emoji}</span>
                  <span className="text-xs font-medium text-cream-200 w-16">{person.name}</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    defaultValue={goal?.targetLines ?? ''}
                    placeholder="목표 줄 수"
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (isNaN(val) || val < 0) return
                      if (goal) {
                        updateReadingGoal(goal.id, val)
                        addToast(`${person.name} 목표: ${val.toLocaleString()}줄`, 'success')
                      } else {
                        addReadingGoal({ personId: person.id, month: selectedMonth, targetLines: val })
                        addToast(`${person.name} 목표 생성: ${val.toLocaleString()}줄`, 'success')
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    }}
                    className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-sm text-cream-100 outline-none focus:border-amber-500 tabular-nums"
                  />
                  <span className="text-xs text-espresso-400">줄</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-espresso-400">
            각 구성원의 월별 독서 목표를 수동으로 입력하세요
          </p>
        </div>
      )}

      {/* Family overview stats */}
      <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-4">
          <p className="text-xs text-espresso-400 uppercase tracking-wider mb-1">가족 전체</p>
          <p className="text-2xl font-bold text-cream-100">{familyTotalLines.toLocaleString()}<span className="text-xs text-espresso-400 ml-1">줄</span></p>
          <div className="mt-2 h-1.5 bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700" style={{ width: `${familyProgress}%` }} />
          </div>
          <p className="text-xs text-espresso-400 mt-1">{familyProgress}% 달성 {familyTotalTarget > 0 ? `(목표 ${familyTotalTarget.toLocaleString()}줄)` : ''}</p>
        </div>
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-4">
          <p className="text-xs text-espresso-400 uppercase tracking-wider mb-1">등록 도서</p>
          <p className="text-2xl font-bold text-cream-100">{books.length}<span className="text-xs text-espresso-400 ml-1">권</span></p>
        </div>
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-4">
          <p className="text-xs text-espresso-400 uppercase tracking-wider mb-1">이번 달 기록</p>
          <p className="text-2xl font-bold text-cream-100">{readingLogs.filter((l) => l.date.startsWith(selectedMonth)).length}<span className="text-xs text-espresso-400 ml-1">건</span></p>
        </div>
      </div>

      {/* Family member cards */}
      <div className="space-y-3">
        <h2 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold">구성원별 진행</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {familyStats.map(({ person, totalLines, targetLines, progress, currentBook, readToday, streak }, idx) => (
            <div
              key={person.id}
              className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 animate-fade-in-up hover:border-surface-hover transition-colors"
              style={{ animationDelay: `${150 + idx * 60}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <PersonAvatar person={person} size={40} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-cream-100">{person.name}</p>
                    <span className="text-xs text-espresso-400">{person.role}</span>
                    {readToday && (
                      <span className="text-xs px-1.5 py-0.5 bg-success-500/15 text-success-400 border border-success-500/30 rounded-full">오늘 완료</span>
                    )}
                  </div>
                  <p className="text-xs text-espresso-400">
                    {totalLines.toLocaleString()} / {targetLines > 0 ? `${targetLines.toLocaleString()}줄` : '목표 미설정'}
                    {streak > 0 && <span className="ml-2 text-amber-600">🔥 {streak}일 연속</span>}
                  </p>
                </div>
                <span className="text-lg font-bold" style={{ color: person.color }}>{progress}%</span>
              </div>

              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, backgroundColor: person.color, boxShadow: `0 0 8px ${person.color}40` }}
                />
              </div>

              {currentBook && (
                <div className="mt-3 flex items-center gap-2 text-xs text-espresso-400">
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
        <h2 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold">독서 기록 입력</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-espresso-400 block mb-1">누가</label>
            <select
              value={formPersonId}
              onChange={(e) => setFormPersonId(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-amber-500 cursor-pointer"
            >
              {persons.map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-espresso-400 block mb-1">어떤 책</label>
            <select
              value={formBookId}
              onChange={(e) => setFormBookId(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-amber-500 cursor-pointer"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.emoji} {b.title}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-espresso-400">
                {pageMode === 'absolute' ? '현재 페이지 번호' : '읽은 페이지 수'}
              </label>
              <button
                onClick={() => setPageMode(pageMode === 'delta' ? 'absolute' : 'delta')}
                className="text-xs text-amber-600 hover:text-amber-300 transition-colors cursor-pointer"
              >
                {pageMode === 'delta' ? '→ 페이지 번호 입력' : '→ 읽은 수 입력'}
              </button>
            </div>
            <input
              type="number"
              min={1}
              value={formPages}
              onChange={(e) => setFormPages(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
              placeholder={pageMode === 'absolute' ? `${(selectedProgress?.currentPage ?? 0) + 1}` : '20'}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-amber-500"
            />
            {calculatedLines > 0 && (
              <p className="text-xs text-amber-600 mt-0.5">= {calculatedLines.toLocaleString()}줄 ({linesPerPage}줄/p)</p>
            )}
            {selectedBook && (
              <p className="text-xs text-espresso-400 mt-0.5">
                진행: {selectedProgress?.currentPage ?? 0}/{selectedBook.totalPages}p
                {selectedProgress?.completed && ' ✅ 완독'}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-espresso-400 block mb-1">날짜</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddLog}
              className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              기록하기
            </button>
          </div>
        </div>
      </div>

      {/* Bookshelf */}
      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold">책장</h2>
          <button
            onClick={() => setShowAddBook(!showAddBook)}
            className="text-xs px-3 py-1 bg-surface-lighter border border-surface-border rounded-lg text-espresso-300 hover:text-cream-100 hover:border-amber-500/50 transition-all cursor-pointer"
          >
            + 새 책 추가
          </button>
        </div>

        {showAddBook && (
          <div className="bg-surface-light/80 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-espresso-400 block mb-1">제목</label>
                <input
                  value={newBook.title}
                  onChange={(e) => setNewBook((p) => ({ ...p, title: e.target.value }))}
                  placeholder="책 제목"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-espresso-400 block mb-1">저자</label>
                <input
                  value={newBook.author}
                  onChange={(e) => setNewBook((p) => ({ ...p, author: e.target.value }))}
                  placeholder="저자"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-espresso-400 block mb-1">전체 페이지</label>
                <input
                  type="number"
                  value={newBook.totalPages}
                  onChange={(e) => setNewBook((p) => ({ ...p, totalPages: e.target.value }))}
                  placeholder="300"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-espresso-400 block mb-1">페이지당 줄 수</label>
                <input
                  type="number"
                  value={newBook.linesPerPage}
                  onChange={(e) => setNewBook((p) => ({ ...p, linesPerPage: e.target.value }))}
                  placeholder="25"
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-cream-100 outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddBook}
                  className="w-full px-4 py-2 bg-espresso-500 hover:bg-espresso-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  추가
                </button>
              </div>
            </div>
            <p className="text-xs text-espresso-400">아이들 책은 페이지당 3~5줄, 일반 도서는 15~25줄 정도입니다</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {books.map((book) => {
            // Per-person progress for this book
            const bookProgresses = bookProgressList.filter((bp) => bp.bookId === book.id)
            const readers = [...new Set(readingLogs.filter((l) => l.bookId === book.id).map((l) => l.personId))]
              .map((pid) => {
                const person = persons.find((p) => p.id === pid)
                const progress = bookProgresses.find((bp) => bp.personId === pid)
                return person ? { person, progress } : null
              })
              .filter(Boolean) as { person: typeof persons[0]; progress: BookProgress | undefined }[]

            const anyCompleted = bookProgresses.some((bp) => bp.completed)

            return (
              <div
                key={book.id}
                className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-4 hover:border-surface-hover transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{book.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-cream-100 truncate">{book.title}</p>
                    <p className="text-xs text-espresso-400">{book.author} · {book.totalPages}p</p>
                  </div>
                  {anyCompleted && <span className="text-xs text-success-400 shrink-0">✅</span>}
                </div>
                {/* Per-person progress bars */}
                <div className="mt-3 space-y-1.5">
                  {readers.map(({ person, progress }) => {
                    const cp = progress?.currentPage ?? 0
                    const pct = book.totalPages > 0 ? Math.min(100, Math.round((cp / book.totalPages) * 100)) : 0
                    return (
                      <div key={person.id}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs">{person.emoji}</span>
                          <span className="text-xs text-espresso-400 flex-1">{person.name}</span>
                          <span className="text-xs text-espresso-400">{cp}/{book.totalPages}p</span>
                          {progress?.completed && <span className="text-xs text-success-400">완독</span>}
                        </div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: person.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {readers.length === 0 && (
                    <p className="text-xs text-espresso-400">아직 읽은 사람이 없습니다</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent logs */}
      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
        <h2 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold">최근 기록</h2>
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl divide-y divide-surface-border overflow-hidden">
          {[...readingLogs]
            .filter((l) => l.date.startsWith(selectedMonth))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 15)
            .map((log) => {
              const person = persons.find((p) => p.id === log.personId)
              const book = books.find((b) => b.id === log.bookId)
              const isEditing = editingLogId === log.id

              if (isEditing) {
                return (
                  <div key={log.id} className="px-4 py-3 bg-amber-50/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{person?.emoji ?? '👤'}</span>
                      <span className="text-xs text-cream-200 font-medium">{person?.name}</span>
                      <span className="text-xs text-espresso-400">{book?.emoji} {book?.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-espresso-400 block mb-0.5">줄 수</label>
                        <input
                          type="number"
                          value={editLogLines}
                          onChange={(e) => setEditLogLines(e.target.value)}
                          className="w-full bg-surface border border-surface-border rounded-lg px-2 py-1.5 text-sm text-cream-100 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-espresso-400 block mb-0.5">날짜</label>
                        <input
                          type="date"
                          value={editLogDate}
                          onChange={(e) => setEditLogDate(e.target.value)}
                          className="w-full bg-surface border border-surface-border rounded-lg px-2 py-1.5 text-sm text-cream-100 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingLogId(null)}
                        className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700 cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => {
                          const lines = parseInt(editLogLines, 10)
                          if (isNaN(lines) || lines < 0 || !editLogDate) return
                          updateReadingLog(log.id, { linesRead: lines, date: editLogDate })
                          addToast('기록 수정 완료', 'success')
                          setEditingLogId(null)
                        }}
                        className="text-xs px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 cursor-pointer"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3 group">
                  <span className="text-base">{person?.emoji ?? '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cream-200">
                      <span className="font-medium">{person?.name}</span>
                      <span className="text-espresso-400"> · </span>
                      <span>{book?.emoji} {book?.title}</span>
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-600">{log.linesRead.toLocaleString()}줄</span>
                  <span className="text-xs text-espresso-400">{log.date}</span>

                  {/* Edit/Delete buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => {
                        setEditingLogId(log.id)
                        setEditLogLines(String(log.linesRead))
                        setEditLogDate(log.date)
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="수정"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={() => {
                        removeReadingLog(log.id)
                        addToast('기록 삭제됨', 'info')
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="삭제"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          {readingLogs.filter((l) => l.date.startsWith(selectedMonth)).length === 0 && (
            <div className="py-8 text-center text-espresso-400 text-sm">이번 달 기록이 없습니다</div>
          )}
        </div>
      </div>
    </div>
  )
}

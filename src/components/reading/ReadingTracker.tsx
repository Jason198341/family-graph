import { useState, useMemo } from 'react'
import { useReadingStore } from '@/stores/readingStore'
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
  const persons = useReadingStore((s) => s.persons)
  const books = useReadingStore((s) => s.books)
  const readingLogs = useReadingStore((s) => s.readingLogs)
  const readingGoals = useReadingStore((s) => s.readingGoals)
  const addReadingLog = useReadingStore((s) => s.addReadingLog)
  const removeReadingLog = useReadingStore((s) => s.removeReadingLog)
  const updateReadingLog = useReadingStore((s) => s.updateReadingLog)
  const addReadingGoal = useReadingStore((s) => s.addReadingGoal)
  const updateReadingGoal = useReadingStore((s) => s.updateReadingGoal)
  const addBook = useReadingStore((s) => s.addBook)
  const addToast = useReadingStore((s) => s.addToast)
  const updateBookProgress = useReadingStore((s) => s.updateBookProgress)
  const getBookProgress = useReadingStore((s) => s.getBookProgress)
  const bookProgressList = useReadingStore((s) => s.bookProgress)

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [formPersonId, setFormPersonId] = useState(persons[0]?.id ?? '')
  const [formBookId, setFormBookId] = useState(books[0]?.id ?? '')
  const [formCurrentPage, setFormCurrentPage] = useState('')
  const [formDate, setFormDate] = useState(todayStr)
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
  const prevPage = selectedProgress?.currentPage ?? 0

  const pageVal = parseInt(formCurrentPage, 10) || 0
  const pagesRead = Math.max(0, pageVal - prevPage)
  const calculatedLines = pagesRead * linesPerPage

  const handleAddLog = () => {
    if (!formPersonId || !formBookId || pageVal <= 0) {
      addToast('사람, 책, 현재 페이지를 확인하세요', 'error')
      return
    }
    if (pageVal <= prevPage) {
      addToast(`현재 페이지(${pageVal})가 이전 기록(${prevPage})보다 작거나 같습니다`, 'error')
      return
    }

    updateBookProgress(formPersonId, formBookId, pageVal)
    addReadingLog({ personId: formPersonId, bookId: formBookId, date: formDate, linesRead: calculatedLines })
    addToast(`${pagesRead}p × ${linesPerPage}줄 = ${calculatedLines.toLocaleString()}줄 기록!`, 'success')
    setFormCurrentPage('')
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
    <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-24 md:p-6 md:pb-8 space-y-4 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-xl font-bold text-stone-800" style={{ fontFamily: "'Gowun Batang', serif" }}>
          📖 서재
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">독서 기록과 책장을 관리해요</p>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
            className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-sm font-bold text-stone-600 min-w-[80px] text-center">{formatMonth(selectedMonth)}</span>
          <button
            onClick={() => setSelectedMonth(nextMonth(selectedMonth))}
            className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <button
          onClick={() => setShowGoalEditor(!showGoalEditor)}
          className="text-xs px-3 py-1.5 bg-stone-100 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-all cursor-pointer"
        >
          🎯 목표 설정
        </button>
      </div>

      {/* Goal editor */}
      {showGoalEditor && (
        <div className="bg-white rounded-2xl p-4 border border-stone-200/60 shadow-sm space-y-3 animate-fade-in-up">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            {formatMonth(selectedMonth)} 개인별 목표
          </h3>
          <div className="space-y-2">
            {persons.map((person) => {
              const goal = readingGoals.find(
                (g) => g.personId === person.id && g.month === selectedMonth,
              )
              return (
                <div key={person.id} className="flex items-center gap-3">
                  <PersonAvatar person={person} size={24} />
                  <span className="text-xs font-medium text-stone-600 w-14">{person.name}</span>
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
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 tabular-nums"
                  />
                  <span className="text-xs text-stone-400">줄</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Family overview — compact stats */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/60 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-bold text-stone-800">{familyTotalLines.toLocaleString()}<span className="text-xs font-normal text-stone-400 ml-1">줄</span></p>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span>{books.length}권</span>
            <span>{readingLogs.filter((l) => l.date.startsWith(selectedMonth)).length}건</span>
            {familyTotalTarget > 0 && <span>{familyProgress}%</span>}
          </div>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700" style={{ width: `${familyProgress}%` }} />
        </div>

        {/* Per-member rows */}
        <div className="space-y-2">
          {familyStats.map(({ person, totalLines, targetLines, progress, readToday, streak }) => (
            <div key={person.id} className="flex items-center gap-2.5">
              <PersonAvatar person={person} size={26} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-medium text-stone-700">{person.name}</span>
                  {readToday && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full">완료</span>}
                  {streak > 0 && <span className="text-[10px] text-amber-600">🔥{streak}</span>}
                </div>
                <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: person.color }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold tabular-nums" style={{ color: person.color }}>{totalLines.toLocaleString()}</p>
                {targetLines > 0 && <p className="text-[10px] text-stone-400">/{targetLines.toLocaleString()}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log entry form */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/60 shadow-sm space-y-3 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        <h2 className="text-sm font-bold text-stone-700">독서 기록 입력</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-stone-500 block mb-1">누가</label>
            <select
              value={formPersonId}
              onChange={(e) => setFormPersonId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-400 cursor-pointer"
            >
              {persons.map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">어떤 책</label>
            <select
              value={formBookId}
              onChange={(e) => setFormBookId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-400 cursor-pointer"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.emoji} {b.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">현재 페이지</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={formCurrentPage}
              onChange={(e) => setFormCurrentPage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
              placeholder={`${prevPage + 1}`}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-400"
            />
            <p className="text-[10px] text-stone-400 mt-0.5">
              이전: {prevPage}p{selectedBook ? ` / ${selectedBook.totalPages}p` : ''}
              {calculatedLines > 0 && (
                <span className="text-amber-600 font-medium"> → +{pagesRead}p = {calculatedLines.toLocaleString()}줄</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">날짜</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-400"
            />
          </div>
        </div>
        <button
          onClick={handleAddLog}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          기록하기
        </button>
      </div>

      {/* Bookshelf */}
      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-700">책장</h2>
          <button
            onClick={() => setShowAddBook(!showAddBook)}
            className="text-xs px-3 py-1.5 bg-stone-100 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-all cursor-pointer"
          >
            + 새 책
          </button>
        </div>

        {showAddBook && (
          <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-stone-500 block mb-1">제목</label>
                <input
                  value={newBook.title}
                  onChange={(e) => setNewBook((p) => ({ ...p, title: e.target.value }))}
                  placeholder="책 제목"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">저자</label>
                <input
                  value={newBook.author}
                  onChange={(e) => setNewBook((p) => ({ ...p, author: e.target.value }))}
                  placeholder="저자"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">전체 페이지</label>
                <input
                  type="number"
                  value={newBook.totalPages}
                  onChange={(e) => setNewBook((p) => ({ ...p, totalPages: e.target.value }))}
                  placeholder="300"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">줄/페이지</label>
                <input
                  type="number"
                  value={newBook.linesPerPage}
                  onChange={(e) => setNewBook((p) => ({ ...p, linesPerPage: e.target.value }))}
                  placeholder="25"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <p className="text-[10px] text-stone-400">아이들 책: 3~5줄/p, 일반 도서: 15~25줄/p</p>
            <button
              onClick={handleAddBook}
              className="w-full py-2 bg-stone-700 hover:bg-stone-800 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              추가
            </button>
          </div>
        )}

        <div className="space-y-2">
          {books.map((book) => {
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
              <div key={book.id} className="bg-white rounded-xl p-3 border border-stone-200/60 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{book.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 truncate">{book.title}</p>
                    <p className="text-xs text-stone-400">{book.author} · {book.totalPages}p</p>
                  </div>
                  {anyCompleted && <span className="text-xs text-green-500 shrink-0">✅</span>}
                </div>
                {readers.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    {readers.map(({ person, progress }) => {
                      const cp = progress?.currentPage ?? 0
                      const pct = book.totalPages > 0 ? Math.min(100, Math.round((cp / book.totalPages) * 100)) : 0
                      return (
                        <div key={person.id}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs">{person.emoji}</span>
                            <span className="text-xs text-stone-500 flex-1">{person.name}</span>
                            <span className="text-[10px] text-stone-400 tabular-nums">{cp}/{book.totalPages}p</span>
                            {progress?.completed && <span className="text-[10px] text-green-500">완독</span>}
                          </div>
                          <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: person.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {readers.length === 0 && (
                  <p className="text-[10px] text-stone-400 mt-2">아직 읽은 사람이 없습니다</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent logs */}
      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
        <h2 className="text-sm font-bold text-stone-700">최근 기록</h2>
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm divide-y divide-stone-100 overflow-hidden">
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
                      <span className="text-xs text-stone-700 font-medium">{person?.name}</span>
                      <span className="text-xs text-stone-400">{book?.emoji} {book?.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-stone-400 block mb-0.5">줄 수</label>
                        <input
                          type="number"
                          value={editLogLines}
                          onChange={(e) => setEditLogLines(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-800 outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-stone-400 block mb-0.5">날짜</label>
                        <input
                          type="date"
                          value={editLogDate}
                          onChange={(e) => setEditLogDate(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-800 outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingLogId(null)} className="text-xs px-3 py-1 text-stone-400 hover:text-stone-600 cursor-pointer">취소</button>
                      <button
                        onClick={() => {
                          const lines = parseInt(editLogLines, 10)
                          if (isNaN(lines) || lines < 0 || !editLogDate) return
                          updateReadingLog(log.id, { linesRead: lines, date: editLogDate })
                          addToast('기록 수정 완료', 'success')
                          setEditingLogId(null)
                        }}
                        className="text-xs px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 cursor-pointer"
                      >저장</button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={log.id} className="flex items-center gap-2.5 px-4 py-2.5 group">
                  <span className="text-base">{person?.emoji ?? '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-600 truncate">
                      <span className="font-medium">{person?.name}</span>
                      <span className="text-stone-300"> · </span>
                      <span>{book?.emoji} {book?.title}</span>
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-600 tabular-nums">{log.linesRead.toLocaleString()}줄</span>
                  <span className="text-[10px] text-stone-400">{log.date.slice(5)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => { setEditingLogId(log.id); setEditLogLines(String(log.linesRead)); setEditLogDate(log.date) }}
                      className="w-6 h-6 rounded flex items-center justify-center text-stone-300 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="수정"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={() => { removeReadingLog(log.id); addToast('기록 삭제됨', 'info') }}
                      className="w-6 h-6 rounded flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="삭제"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          {readingLogs.filter((l) => l.date.startsWith(selectedMonth)).length === 0 && (
            <div className="py-8 text-center text-stone-400 text-sm">이번 달 기록이 없습니다</div>
          )}
        </div>
      </div>
    </div>
  )
}

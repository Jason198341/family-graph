import { useState, useMemo } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { useFamilyStore } from '@/stores/familyStore'
import { useShareImage } from '@/hooks/useShareImage'
import ShareButton from './ShareButton'
import Watermark from './Watermark'

// Slide content types
interface SlideData {
  bg: string  // CSS gradient value (inline style)
  render: () => React.ReactNode
}

export default function ReadingWrappedCard() {
  const { ref, download, share } = useShareImage()
  const [slideIdx, setSlideIdx] = useState(0)

  const persons = useGraphStore((s) => s.persons)
  const books = useGraphStore((s) => s.books)
  const readingLogs = useGraphStore((s) => s.readingLogs)
  const reviews = useGraphStore((s) => s.reviews)
  const bookProgress = useGraphStore((s) => s.bookProgress)
  const getRadarData = useGraphStore((s) => s.getRadarData)
  const getStreakDays = useGraphStore((s) => s.getStreakDays)
  const family = useFamilyStore((s) => s.family)

  const year = new Date().getFullYear()
  const familyName = family?.name ?? '우리 가족'
  const familyEmoji = family?.emoji ?? '🏠'

  // === Compute annual stats (memoized) ===
  const { totalLines, totalDays, completedBooks, totalReviews, personStats, topReader, topBook, bookLineMap, topBookId, getPersonality } = useMemo(() => {
    const yLogs = readingLogs.filter((l) => l.date.startsWith(String(year)))
    const tLines = yLogs.reduce((s, l) => s + l.linesRead, 0)
    const tDays = new Set(yLogs.map((l) => l.date)).size
    const cBooks = bookProgress.filter((p) => p.completed && p.completedDate?.startsWith(String(year))).length
    const tReviews = reviews.filter((r) => r.createdAt.startsWith(String(year))).length

    const pStats = persons.map((p) => {
      const logs = yLogs.filter((l) => l.personId === p.id)
      const lines = logs.reduce((s, l) => s + l.linesRead, 0)
      const days = new Set(logs.map((l) => l.date)).size
      const streak = getStreakDays(p.id)
      return { person: p, lines, days, streak }
    }).sort((a, b) => b.lines - a.lines)

    const bLineMap = new Map<string, number>()
    yLogs.forEach((l) => bLineMap.set(l.bookId, (bLineMap.get(l.bookId) ?? 0) + l.linesRead))
    const tBookId = [...bLineMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

    const month = `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const personalityCache = new Map<string, { title: string; emoji: string; desc: string }>()
    const getPers = (personId: string) => {
      if (personalityCache.has(personId)) return personalityCache.get(personId)!
      const radar = getRadarData(personId, month)
      const top = [...radar].sort((a, b) => b.value - a.value)[0]
      let result: { title: string; emoji: string; desc: string }
      switch (top?.label) {
        case '양': result = { title: '다독가', emoji: '📚', desc: '양으로 승부하는 독서가' }; break
        case '질': result = { title: '깊이파', emoji: '🔬', desc: '깊이 있는 독서를 추구' }; break
        case '나눔': result = { title: '나눔이', emoji: '💬', desc: '읽은 책을 나누는 것을 좋아해요' }; break
        case '다양성': result = { title: '탐험가', emoji: '🌍', desc: '다양한 장르를 넘나드는' }; break
        default: result = { title: '독서인', emoji: '📖', desc: '꾸준히 읽어가는 중' }
      }
      personalityCache.set(personId, result)
      return result
    }

    return {
      totalLines: tLines, totalDays: tDays, completedBooks: cBooks, totalReviews: tReviews,
      personStats: pStats, topReader: pStats[0],
      topBook: books.find((b) => b.id === tBookId),
      bookLineMap: bLineMap, topBookId: tBookId,
      getPersonality: getPers,
    }
  }, [readingLogs, bookProgress, reviews, persons, books, year, getStreakDays, getRadarData])

  // === Slides ===
  const slides: SlideData[] = [
    // Slide 1: Cover
    {
      bg: 'linear-gradient(135deg, #4f46e5, #9333ea, #ec4899)',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-4 md:px-8">
          <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase opacity-70 mb-3 md:mb-4">Reading DNA</p>
          <h1 className="text-2xl md:text-4xl font-black mb-2" style={{ fontFamily: "'Gowun Batang', serif" }}>
            {familyEmoji} {familyName}
          </h1>
          <p className="text-base md:text-lg opacity-80">{year}년 독서 리포트</p>
          <div className="mt-6 md:mt-8 flex items-center gap-4 md:gap-6">
            {persons.slice(0, 5).map((p) => (
              <div key={p.id} className="text-center">
                <span className="text-2xl md:text-3xl">{p.emoji}</span>
                <p className="text-xs mt-1 opacity-70">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // Slide 2: Big numbers
    {
      bg: 'linear-gradient(135deg, #10b981, #14b8a6, #06b6d4)',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-4 md:px-8">
          <p className="text-xs md:text-sm font-bold tracking-widest uppercase opacity-70 mb-4 md:mb-6">올해의 숫자</p>
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            {[
              { label: '총 독서량', value: `${totalLines.toLocaleString()}줄`, emoji: '📖' },
              { label: '독서한 날', value: `${totalDays}일`, emoji: '📅' },
              { label: '완독한 책', value: `${completedBooks}권`, emoji: '✅' },
              { label: '작성한 후기', value: `${totalReviews}편`, emoji: '✏️' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[rgba(255,255,255,0.15)] backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4">
                <span className="text-xl md:text-2xl">{stat.emoji}</span>
                <p className="text-xl md:text-2xl font-black mt-1">{stat.value}</p>
                <p className="text-xs opacity-70 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // Slide 3: MVP + Personalities
    {
      bg: 'linear-gradient(135deg, #f59e0b, #f97316, #ef4444)',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-4 md:px-8">
          <p className="text-xs md:text-sm font-bold tracking-widest uppercase opacity-70 mb-3 md:mb-4">🏆 올해의 독서왕</p>
          {topReader && (
            <>
              <span className="text-4xl md:text-5xl mb-2">{topReader.person.emoji}</span>
              <h2 className="text-xl md:text-2xl font-black">{topReader.person.name}</h2>
              <p className="text-sm opacity-80 mt-1">{topReader.lines.toLocaleString()}줄 · {topReader.days}일</p>
            </>
          )}

          <div className="mt-6 w-full max-w-xs space-y-2">
            <p className="text-xs font-bold tracking-widest uppercase opacity-60 mb-2">독서 성격</p>
            {persons.map((p) => {
              const personality = getPersonality(p.id)
              return (
                <div key={p.id} className="flex items-center gap-3 bg-[rgba(255,255,255,0.15)] rounded-xl px-3 py-2">
                  <span className="text-lg">{p.emoji}</span>
                  <div className="text-left flex-1">
                    <p className="text-xs font-bold">{p.name}</p>
                    <p className="text-xs opacity-70">{personality.emoji} {personality.title}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ),
    },
    // Slide 4: Top book + radar
    {
      bg: 'linear-gradient(135deg, #7c3aed, #9333ea, #d946ef)',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-4 md:px-8">
          <p className="text-xs md:text-sm font-bold tracking-widest uppercase opacity-70 mb-3 md:mb-4">📕 가장 많이 읽은 책</p>
          {topBook ? (
            <>
              <span className="text-4xl md:text-5xl mb-2 md:mb-3">{topBook.emoji}</span>
              <h2 className="text-xl font-black">{topBook.title}</h2>
              <p className="text-sm opacity-70 mt-1">{topBook.author}</p>
              <p className="text-xs mt-2 bg-[rgba(255,255,255,0.2)] px-3 py-1 rounded-full">
                {bookLineMap.get(topBookId!)?.toLocaleString()}줄 읽음
              </p>
            </>
          ) : (
            <p className="opacity-70">아직 데이터가 없습니다</p>
          )}

          {/* Mini radar for each person */}
          <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-xs">
            {personStats.slice(0, 4).map(({ person, lines }) => (
              <div key={person.id} className="bg-[rgba(255,255,255,0.15)] rounded-xl p-3 text-center">
                <span className="text-xl">{person.emoji}</span>
                <p className="text-xs font-bold mt-1">{person.name}</p>
                <p className="text-xs opacity-70">{lines.toLocaleString()}줄</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // Slide 5: CTA
    {
      bg: 'linear-gradient(135deg, #1e293b, #0f172a, #000000)',
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-4 md:px-8">
          <span className="text-5xl md:text-6xl mb-3 md:mb-4">📚</span>
          <h2 className="text-xl md:text-2xl font-black" style={{ fontFamily: "'Gowun Batang', serif" }}>
            {familyName}의<br />{year}년 독서 여정
          </h2>
          <div className="mt-4 md:mt-6 flex items-center gap-2">
            {persons.map((p) => (
              <span key={p.id} className="text-xl md:text-2xl">{p.emoji}</span>
            ))}
          </div>
          <p className="text-sm opacity-50 mt-6">가족과 함께 읽고, 함께 성장하세요</p>
          <p className="text-xs opacity-30 mt-2">family-graph.vercel.app</p>
        </div>
      ),
    },
  ]

  const currentSlide = slides[slideIdx]

  return (
    <div className="space-y-4">
      {/* Card */}
      <div ref={ref} className="w-full max-w-[540px] aspect-[540/680] mx-auto rounded-xl md:rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0" style={{ background: currentSlide.bg }} />
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex-1 flex flex-col">
            {currentSlide.render()}
          </div>
          <Watermark dark />
        </div>
      </div>

      {/* Slide navigation */}
      <div className="flex items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlideIdx(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
              i === slideIdx ? 'bg-amber-500 scale-125' : 'bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>

      {/* Slide counter + nav */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setSlideIdx(Math.max(0, slideIdx - 1))}
          disabled={slideIdx === 0}
          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
        >
          ← 이전
        </button>
        <span className="text-xs text-slate-400 tabular-nums">{slideIdx + 1} / {slides.length}</span>
        <button
          onClick={() => setSlideIdx(Math.min(slides.length - 1, slideIdx + 1))}
          disabled={slideIdx === slides.length - 1}
          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
        >
          다음 →
        </button>
      </div>

      <ShareButton
        onShare={() => share(`${familyName} ${year}년 독서 DNA`)}
        onDownload={() => download(`wrapped-${year}-slide${slideIdx + 1}.png`)}
        className="justify-center"
      />
    </div>
  )
}

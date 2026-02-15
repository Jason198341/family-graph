import { useState, useEffect, useMemo } from 'react'
import { useReadingStore } from '@/stores/readingStore'
import { useFamilyStore } from '@/stores/familyStore'
import RaceTrack from './RaceTrack'
import RaceStats from './RaceStats'
import FamilyLeaderboard from './FamilyLeaderboard'
import HighlightTimeline from '@/components/highlights/HighlightTimeline'
import AchievementBadges from '@/components/achievements/AchievementBadges'
import PersonAvatar from '@/components/common/PersonAvatar'
import ReadingHeatmap from '@/components/common/ReadingHeatmap'
import ShareCard from '@/components/common/ShareCard'

function getMonthStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return '좋은 새벽이에요'
  if (h < 12) return '좋은 아침이에요'
  if (h < 18) return '좋은 오후예요'
  return '좋은 저녁이에요'
}

/** Reading temperature: 36.5 base + bonus from this month's reading activity */
function calcTemperature(familyTotalLines: number, streakDays: number, memberCount: number): number {
  const base = 36.5
  // Lines contribution: up to +2.0 degrees (at 10,000 family lines)
  const linesBonus = Math.min(2.0, (familyTotalLines / 10000) * 2.0)
  // Streak contribution: up to +1.0 degrees (at 14-day streak)
  const streakBonus = Math.min(1.0, (streakDays / 14) * 1.0)
  // Participation bonus: +0.5 if everyone is reading
  const participationBonus = memberCount > 0 ? 0.5 : 0
  return Math.round((base + linesBonus + streakBonus + participationBonus) * 10) / 10
}

function tempColor(temp: number): string {
  if (temp >= 39.0) return 'text-red-500'
  if (temp >= 38.0) return 'text-amber-500'
  if (temp >= 37.0) return 'text-amber-600'
  return 'text-stone-400'
}

function tempEmoji(temp: number): string {
  if (temp >= 39.0) return '🔥'
  if (temp >= 38.0) return '📖'
  if (temp >= 37.0) return '🌱'
  return '💤'
}

export default function RaceDashboard() {
  const [month, setMonth] = useState(() => getMonthStr(new Date()))
  const [showShare, setShowShare] = useState(false)

  const loadFamilyRank = useReadingStore((s) => s.loadFamilyRank)
  const persons = useReadingStore((s) => s.persons)
  const readingLogs = useReadingStore((s) => s.readingLogs)
  const getFamilyStreak = useReadingStore((s) => s.getFamilyStreak)
  const getTotalLinesForMonth = useReadingStore((s) => s.getTotalLinesForMonth)
  const family = useFamilyStore((s) => s.family)

  const [y, m] = month.split('-').map(Number)
  const displayMonth = `${y}년 ${m}월`

  useEffect(() => {
    loadFamilyRank(month)
  }, [month, loadFamilyRank])

  const prevMonth = () => setMonth(getMonthStr(new Date(y, m - 2, 1)))
  const nextMonth = () => setMonth(getMonthStr(new Date(y, m, 1)))

  // Family-wide stats
  const familyStreak = getFamilyStreak()
  const familyTotalLines = useMemo(
    () => persons.reduce((sum, p) => sum + getTotalLinesForMonth(p.id, month), 0),
    [persons, month, getTotalLinesForMonth],
  )

  // Count how many members read this month
  const activeMembers = useMemo(() => {
    const active = new Set(
      readingLogs.filter((l) => l.date.startsWith(month)).map((l) => l.personId),
    )
    return active.size
  }, [readingLogs, month])

  const temperature = calcTemperature(familyTotalLines, familyStreak, activeMembers)

  // Recent activity (latest 5 logs)
  const recentLogs = useMemo(() => {
    const sorted = [...readingLogs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    return sorted.slice(0, 5)
  }, [readingLogs])

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-24 md:p-6 md:pb-8 max-w-2xl mx-auto w-full">

      {/* ── Welcome header ── */}
      <div className="mb-4 animate-fade-in-up">
        <p className="text-sm text-stone-500">{getGreeting()}</p>
        <h1 className="text-xl font-bold text-stone-800 mt-0.5" style={{ fontFamily: "'Gowun Batang', serif" }}>
          {family?.emoji ?? '📚'} {family?.name ?? '가족 독서'}
        </h1>
      </div>

      {/* ── Temperature + Streak row ── */}
      <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        {/* Reading Temperature */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/60 shadow-sm">
          <p className="text-xs font-medium text-stone-400 mb-2">독서 온도</p>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold ${tempColor(temperature)}`}>
              {temperature}°
            </span>
            <span className="text-lg">{tempEmoji(temperature)}</span>
          </div>
          <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, ((temperature - 36.5) / 4) * 100)}%` }}
            />
          </div>
        </div>

        {/* Family Streak */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/60 shadow-sm">
          <p className="text-xs font-medium text-stone-400 mb-2">연속 독서</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-600">{familyStreak}</span>
            <span className="text-sm text-stone-500">일째</span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            {familyStreak === 0 ? '오늘 첫 기록을 남겨보세요!' :
             familyStreak >= 7 ? '대단해요! 꾸준히 읽고 있어요' :
             '좋은 시작이에요!'}
          </p>
        </div>
      </div>

      {/* ── Month selector ── */}
      <div className="flex items-center justify-between mb-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h2 className="text-sm font-bold text-stone-700">이번 달 현황</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowShare(true)}
            className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
            title="공유"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-xs font-bold text-stone-600 min-w-[72px] text-center">{displayMonth}</span>
          <button
            onClick={nextMonth}
            className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* ── Monthly summary card ── */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/60 shadow-sm mb-4 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-stone-800">{familyTotalLines.toLocaleString()}<span className="text-sm font-normal text-stone-400 ml-1">줄</span></p>
            <p className="text-xs text-stone-400">{activeMembers}명 참여 중</p>
          </div>
          <div className="flex -space-x-2">
            {persons.slice(0, 4).map((p) => (
              <div key={p.id} className="ring-2 ring-white rounded-full">
                <PersonAvatar person={p} size={32} />
              </div>
            ))}
          </div>
        </div>

        {/* Per-person mini bars */}
        <div className="space-y-2">
          {persons.map((p) => {
            const lines = getTotalLinesForMonth(p.id, month)
            const pct = familyTotalLines > 0 ? Math.round((lines / familyTotalLines) * 100) : 0
            return (
              <div key={p.id} className="flex items-center gap-2.5">
                <PersonAvatar person={p} size={22} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-stone-600 truncate">{p.name}</span>
                    <span className="text-xs text-stone-400 tabular-nums">{lines.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: p.color || '#f59e0b' }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Reading heatmap ── */}
      <div className="mb-4 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        <ReadingHeatmap />
      </div>

      {/* ── Recent activity ── */}
      {recentLogs.length > 0 && (
        <div className="mb-4 animate-fade-in-up" style={{ animationDelay: '180ms' }}>
          <h2 className="text-sm font-bold text-stone-700 mb-2">최근 활동</h2>
          <div className="space-y-1.5">
            {recentLogs.map((log) => {
              const person = persons.find((p) => p.id === log.personId)
              const book = useReadingStore.getState().books.find((b) => b.id === log.bookId)
              if (!person || !book) return null
              return (
                <div key={log.id} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 border border-stone-100">
                  <PersonAvatar person={person} size={24} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-600 truncate">
                      <span className="font-medium">{person.name}</span>
                      <span className="text-stone-400"> · </span>
                      <span>{book.emoji} {book.title}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-amber-600">{log.linesRead}줄</p>
                    <p className="text-[10px] text-stone-400">{log.date.slice(5)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Family leaderboard (compact) ── */}
      <FamilyLeaderboard month={month} />

      {/* ── Individual race track ── */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/60 shadow-sm mb-4 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
        <h2 className="text-sm font-bold text-stone-700 mb-3">개인 독서 여정</h2>
        <RaceTrack month={month} />
      </div>

      {/* ── Member stats ── */}
      <RaceStats month={month} />

      {/* ── Today's highlights ── */}
      <HighlightTimeline month={month} />

      {/* ── Achievements ── */}
      <AchievementBadges month={month} />

      {/* ── Share modal ── */}
      {showShare && <ShareCard month={month} onClose={() => setShowShare(false)} />}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import RaceTrack from './RaceTrack'
import RaceStats from './RaceStats'
import FamilyLeaderboard from './FamilyLeaderboard'
import HighlightTimeline from '@/components/highlights/HighlightTimeline'
import AchievementBadges from '@/components/achievements/AchievementBadges'
import RadarChart from '@/components/charts/RadarChart'

function getMonthStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function RaceDashboard() {
  const [month, setMonth] = useState(() => getMonthStr(new Date()))

  const loadFamilyRank = useGraphStore((s) => s.loadFamilyRank)
  const persons = useGraphStore((s) => s.persons)
  const getRadarData = useGraphStore((s) => s.getRadarData)

  const [y, m] = month.split('-').map(Number)
  const displayMonth = `${y}년 ${m}월`

  useEffect(() => {
    loadFamilyRank(month)
  }, [month, loadFamilyRank])

  const prevMonth = () => {
    const d = new Date(y, m - 2, 1)
    setMonth(getMonthStr(d))
  }
  const nextMonth = () => {
    const d = new Date(y, m, 1)
    setMonth(getMonthStr(d))
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-cream-100">
            가족 독서 여정
          </h1>
          <p className="text-xs text-espresso-300 mt-1">
            함께 읽고, 함께 성장하는 가족 독서 기록
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg bg-surface-lighter border border-surface-border flex items-center justify-center text-espresso-300 hover:text-cream-100 hover:border-amber-500/50 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-sm font-bold text-cream-100 min-w-[100px] text-center">{displayMonth}</span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg bg-surface-lighter border border-surface-border flex items-center justify-center text-espresso-300 hover:text-cream-100 hover:border-amber-500/50 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* ── 1. 전체 가족 현황 ── */}
      <FamilyLeaderboard month={month} />

      {/* ── 2. 개인 독서 진행률 ── */}
      <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <h2 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-4">
          개인 독서 여정
        </h2>
        <RaceTrack month={month} />
      </div>

      {/* ── 3. 독서 역량 레이더 차트 ── */}
      {persons.length > 0 && (
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <h2 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-4">
            독서 역량 분석
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {persons.map((person) => {
              const data = getRadarData(person.id, month)
              return (
                <div key={person.id} className="flex flex-col items-center">
                  <RadarChart data={data} color={person.color} size={130} />
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-base">{person.emoji}</span>
                    <span className="text-xs font-semibold text-cream-100">{person.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1 justify-center">
                    {data.map((d) => (
                      <span key={d.label} className="text-xs text-espresso-400">
                        {d.label} {d.value}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 4. 가족 구성원 현황 ── */}
      <RaceStats month={month} />

      {/* ── 5. 오늘의 한 줄 ── */}
      <HighlightTimeline month={month} />

      {/* ── 6. 도전 과제 ── */}
      <AchievementBadges month={month} />
    </div>
  )
}

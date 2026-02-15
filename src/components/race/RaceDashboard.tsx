import { useState } from 'react'
import RaceTrack from './RaceTrack'
import RaceStats from './RaceStats'
import FamilyLeaderboard from './FamilyLeaderboard'
import ReadingStatsTab from './ReadingStatsTab'

type StatsTab = 'race' | 'leaderboard' | 'stats'

const TABS: { key: StatsTab; label: string; icon: string }[] = [
  { key: 'race', label: '가족 레이스', icon: '🏃' },
  { key: 'leaderboard', label: '전체 순위', icon: '🏆' },
  { key: 'stats', label: '독서 통계', icon: '📊' },
]

function getMonthStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function RaceDashboard() {
  const [month, setMonth] = useState(() => getMonthStr(new Date()))
  const [activeTab, setActiveTab] = useState<StatsTab>('race')

  const [y, m] = month.split('-').map(Number)
  const displayMonth = `${y}년 ${m}월`

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
            가족 독서 레이스
          </h1>
          <p className="text-xs text-espresso-300 mt-1">
            함께 읽고, 함께 성장하는 가족 독서 경쟁
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

      {/* Race Track */}
      <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <h2 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-4">
          레이스 트랙
        </h2>
        <RaceTrack month={month} />
      </div>

      {/* Stats Cards */}
      <RaceStats month={month} />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-surface-lighter text-cream-100 shadow-sm'
                : 'text-espresso-400 hover:text-espresso-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'race' && (
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5">
          <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-4">이번 달 가족 레이스 현황</h3>
          <RaceTrack month={month} />
        </div>
      )}
      {activeTab === 'leaderboard' && <FamilyLeaderboard month={month} />}
      {activeTab === 'stats' && <ReadingStatsTab year={y} />}
    </div>
  )
}

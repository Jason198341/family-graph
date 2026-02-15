import { useState } from 'react'
import RaceTrack from './RaceTrack'
import RaceStats from './RaceStats'
import CombinedRankingTab from './CombinedRankingTab'
import ReadingStatsTab from './ReadingStatsTab'
import WritingStatsTab from './WritingStatsTab'

type StatsTab = 'ranking' | 'reading' | 'writing'

const TABS: { key: StatsTab; label: string; icon: string }[] = [
  { key: 'ranking', label: '종합 랭킹', icon: '🏆' },
  { key: 'reading', label: '독서 통계', icon: '📖' },
  { key: 'writing', label: '글쓰기 통계', icon: '✍️' },
]

export default function RaceDashboard() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [activeTab, setActiveTab] = useState<StatsTab>('ranking')

  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            🏃 가족 독서&글쓰기 레이스
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            독서 50% + 글쓰기 50% = 종합 진행률
          </p>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-1 bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-xl p-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                year === y
                  ? 'bg-race-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Race Track */}
      <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5">
        <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">
          레이스 트랙
        </h2>
        <RaceTrack year={year} />
      </div>

      {/* Stats Cards */}
      <RaceStats year={year} />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-surface-lighter text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'ranking' && <CombinedRankingTab year={year} />}
      {activeTab === 'reading' && <ReadingStatsTab year={year} />}
      {activeTab === 'writing' && <WritingStatsTab year={year} />}
    </div>
  )
}

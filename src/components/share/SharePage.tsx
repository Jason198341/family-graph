import { useState } from 'react'
import TreeCelebrationCard from './TreeCelebrationCard'
import RaceShareCard from './RaceShareCard'
import BookShelfCard from './BookShelfCard'
import ReadingWrappedCard from './ReadingWrappedCard'

type ShareTab = 'tree' | 'race' | 'shelf' | 'wrapped'

const tabs: { id: ShareTab; label: string; emoji: string; desc: string }[] = [
  { id: 'tree', label: '나무 성장', emoji: '🌳', desc: '가족 독서 나무 레벨' },
  { id: 'race', label: '레이스', emoji: '🏃', desc: '이번 달 독서 경주' },
  { id: 'shelf', label: '책장', emoji: '📚', desc: '우리 가족 서재' },
  { id: 'wrapped', label: 'DNA', emoji: '🧬', desc: '연간 독서 리포트' },
]

function getMonthStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function SharePage() {
  const [activeTab, setActiveTab] = useState<ShareTab>('tree')

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-cream-100 flex items-center gap-2">
          <span>📸</span> SNS 공유 카드
        </h1>
        <p className="text-sm text-espresso-300 mt-1">
          독서 기록을 아름다운 카드로 만들어 SNS에 공유하세요
        </p>
      </div>

      {/* Tab selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 p-2.5 md:p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-50 border-amber-300 shadow-sm'
                : 'bg-surface-light border-surface-border hover:border-surface-hover'
            }`}
          >
            <span className="text-xl md:text-2xl">{tab.emoji}</span>
            <span className={`text-xs font-bold ${activeTab === tab.id ? 'text-amber-700' : 'text-cream-100'}`}>
              {tab.label}
            </span>
            <span className="text-xs text-espresso-400 hidden md:block">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Card content */}
      <div className="animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        {activeTab === 'tree' && <TreeCelebrationCard />}
        {activeTab === 'race' && <RaceShareCard month={getMonthStr()} />}
        {activeTab === 'shelf' && <BookShelfCard />}
        {activeTab === 'wrapped' && <ReadingWrappedCard />}
      </div>

      {/* Tips */}
      <div className="bg-surface-light border border-surface-border rounded-xl p-4 text-xs text-espresso-300 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
        <p className="font-semibold text-cream-100 mb-1">💡 공유 팁</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li><strong>이미지 저장</strong>: 카드를 PNG로 다운로드합니다</li>
          <li><strong>공유하기</strong>: 모바일에서 카카오톡, 인스타그램 등으로 바로 공유됩니다</li>
          <li><strong>DNA 리포트</strong>: 좌우 화살표로 슬라이드를 넘기며 각각 저장할 수 있습니다</li>
        </ul>
      </div>
    </div>
  )
}

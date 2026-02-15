import { useState } from 'react'
import type { WritingScores, WritingFeedback, WritingGrade } from '@/types'

interface ScoreCardProps {
  totalScore: number
  grade: WritingGrade
  scores: WritingScores
  feedback: WritingFeedback
  badges: string[]
}

const GRADE_COLORS: Record<string, string> = {
  S: '#fbbf24',
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f97316',
  D: '#ef4444',
}

const SCORE_LABELS: { key: keyof WritingScores; label: string }[] = [
  { key: 'content', label: '내용 충실도' },
  { key: 'logic', label: '논리적 구성' },
  { key: 'depth', label: '사고의 깊이' },
  { key: 'specificity', label: '구체적 표현' },
  { key: 'clarity', label: '문장 명확성' },
]

export default function ScoreCard({ totalScore, grade, scores, feedback, badges }: ScoreCardProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const color = GRADE_COLORS[grade] ?? '#3b82f6'

  return (
    <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 space-y-4">
      {/* Grade + Total */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black animate-grade-glow"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {grade}
        </div>
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {totalScore}<span className="text-sm text-gray-500">/100</span>
          </p>
          {badges.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {badges.map((b) => (
                <span
                  key={b}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-race-500/20 text-race-400 font-semibold"
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-2">
        {SCORE_LABELS.map(({ key, label }) => {
          const val = scores[key]
          const pct = (val / 20) * 100
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 w-20 shrink-0">{label}</span>
              <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
                />
              </div>
              <span className="text-[10px] font-bold text-gray-300 w-8 text-right tabular-nums">
                {val}/20
              </span>
            </div>
          )
        })}
      </div>

      {/* Feedback toggle */}
      <button
        onClick={() => setShowFeedback(!showFeedback)}
        className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
      >
        {showFeedback ? '피드백 접기 ▲' : '피드백 보기 ▼'}
      </button>

      {showFeedback && (
        <div className="space-y-2 text-xs text-gray-400">
          {SCORE_LABELS.map(({ key, label }) => (
            <div key={key}>
              <span className="font-semibold text-gray-300">{label}: </span>
              {feedback[key]}
            </div>
          ))}
          <div className="pt-2 border-t border-surface-border">
            <span className="font-semibold text-white">종합: </span>
            {feedback.overall}
          </div>
        </div>
      )}
    </div>
  )
}

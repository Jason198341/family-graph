import { useMemo } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import RadarChart from './RadarChart'

interface WritingStatsTabProps {
  year: number
}

const GRADE_COLORS: Record<string, string> = {
  S: '#fbbf24',
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f97316',
  D: '#ef4444',
}

export default function WritingStatsTab({ year }: WritingStatsTabProps) {
  const persons = useGraphStore((s) => s.persons)
  const writingEntries = useGraphStore((s) => s.writingEntries)

  const yearPrefix = String(year)
  const yearEntries = writingEntries.filter((e) => e.date.startsWith(yearPrefix))

  // Score trend (last 10 entries)
  const recentEntries = useMemo(() => {
    return [...yearEntries].sort((a, b) => a.date.localeCompare(b.date)).slice(-10)
  }, [yearEntries])

  const maxScore = 100

  // Average radar scores across all entries
  const avgScores = useMemo(() => {
    if (yearEntries.length === 0) return { content: 0, logic: 0, depth: 0, specificity: 0, clarity: 0 }
    const sum = { content: 0, logic: 0, depth: 0, specificity: 0, clarity: 0 }
    for (const e of yearEntries) {
      sum.content += e.scores.content
      sum.logic += e.scores.logic
      sum.depth += e.scores.depth
      sum.specificity += e.scores.specificity
      sum.clarity += e.scores.clarity
    }
    const n = yearEntries.length
    return {
      content: Math.round(sum.content / n),
      logic: Math.round(sum.logic / n),
      depth: Math.round(sum.depth / n),
      specificity: Math.round(sum.specificity / n),
      clarity: Math.round(sum.clarity / n),
    }
  }, [yearEntries])

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 }
    for (const e of yearEntries) dist[e.grade] = (dist[e.grade] ?? 0) + 1
    const total = yearEntries.length || 1
    return Object.entries(dist).map(([grade, count]) => ({
      grade,
      count,
      percent: Math.round((count / total) * 100),
    }))
  }, [yearEntries])

  // Per-person stats
  const personStats = useMemo(() => {
    return persons.map((p) => {
      const pEntries = yearEntries.filter((e) => e.personId === p.id)
      const avg = pEntries.length > 0
        ? Math.round(pEntries.reduce((s, e) => s + e.totalScore, 0) / pEntries.length)
        : 0
      return { person: p, count: pEntries.length, avg }
    })
  }, [persons, yearEntries])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score trend */}
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">점수 추이 (최근 10편)</h3>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-gray-600 py-8 text-center">글쓰기 기록이 없습니다</p>
          ) : (
            <div className="flex items-end gap-1 h-28">
              {recentEntries.map((e, i) => {
                const height = (e.totalScore / maxScore) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[8px] text-gray-500">{e.totalScore}</span>
                    <div className="w-full relative" style={{ height: '80px' }}>
                      <div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] rounded-t transition-all duration-500"
                        style={{
                          height: `${height}%`,
                          backgroundColor: GRADE_COLORS[e.grade] ?? '#3b82f6',
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: GRADE_COLORS[e.grade] }}
                    >
                      {e.grade}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Radar chart */}
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 flex flex-col items-center">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2 self-start">항목별 평균</h3>
          <RadarChart
            labels={['내용', '논리', '깊이', '구체성', '명확성']}
            values={[avgScores.content, avgScores.logic, avgScores.depth, avgScores.specificity, avgScores.clarity]}
            size={180}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Grade distribution */}
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">등급 분포</h3>
          <div className="space-y-2">
            {gradeDistribution.map(({ grade, count, percent }) => (
              <div key={grade} className="flex items-center gap-3">
                <span
                  className="text-sm font-bold w-6 text-center"
                  style={{ color: GRADE_COLORS[grade] }}
                >
                  {grade}
                </span>
                <div className="flex-1 h-4 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: GRADE_COLORS[grade],
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 w-12 text-right">{count}편 ({percent}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-person writing summary */}
        <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">구성원별 글쓰기</h3>
          <div className="space-y-3">
            {personStats.map(({ person, count, avg }) => (
              <div key={person.id} className="flex items-center gap-3">
                <span className="text-lg">{person.emoji}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">{person.name}</p>
                  <p className="text-[10px] text-gray-500">{count}편 작성</p>
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ color: person.color }}>
                  {avg > 0 ? `${avg}점` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

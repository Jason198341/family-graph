import { useMemo } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useState, useEffect } from 'react'

interface FamilyRanking {
  familyName: string
  familyEmoji: string
  totalLines: number
  memberCount: number
  avgPerMember: number
}

interface FamilyLeaderboardProps {
  month: string
}

export default function FamilyLeaderboard({ month }: FamilyLeaderboardProps) {
  const [rankings, setRankings] = useState<FamilyRanking[]>([])
  const [loading, setLoading] = useState(false)

  // Local fallback: show our family's stats
  const persons = useGraphStore((s) => s.persons)
  const readingLogs = useGraphStore((s) => s.readingLogs)

  const localRanking = useMemo((): FamilyRanking => {
    const monthLogs = readingLogs.filter((l) => l.date.startsWith(month))
    const totalLines = monthLogs.reduce((s, l) => s + l.linesRead, 0)
    return {
      familyName: '우리 가족',
      familyEmoji: '🏠',
      totalLines,
      memberCount: persons.length,
      avgPerMember: persons.length > 0 ? Math.round(totalLines / persons.length) : 0,
    }
  }, [persons, readingLogs, month])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    async function fetchRankings() {
      setLoading(true)
      try {
        const { data, error } = await supabase.rpc('get_monthly_family_rankings', { target_month: month })
        if (!error && data) {
          setRankings(data.map((r: Record<string, unknown>) => ({
            familyName: r.family_name as string,
            familyEmoji: r.family_emoji as string,
            totalLines: r.total_lines as number,
            memberCount: r.member_count as number,
            avgPerMember: r.avg_per_member as number,
          })))
        }
      } catch {
        // Use local fallback
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [month])

  const displayRankings = rankings.length > 0 ? rankings : [localRanking]

  const medalStyles = [
    { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-400', icon: '🏆' },
    { bg: 'bg-gray-400/10', border: 'border-gray-400/40', text: 'text-gray-300', icon: '🥈' },
    { bg: 'bg-orange-600/10', border: 'border-orange-600/40', text: 'text-orange-400', icon: '🥉' },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5">
        <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-4">
          전체 가족 순위표
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {displayRankings.map((family, idx) => {
              const rank = idx + 1
              const style = medalStyles[idx] ?? { bg: 'bg-surface-lighter', border: 'border-surface-border', text: 'text-espresso-300', icon: `${rank}` }

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${style.bg} ${style.border} ${rank <= 3 ? 'animate-medal-shine' : ''}`}
                >
                  <div className="text-2xl w-10 text-center">
                    {style.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{family.familyEmoji}</span>
                      <span className={`text-sm font-bold ${style.text}`}>{family.familyName}</span>
                    </div>
                    <p className="text-[10px] text-espresso-400">
                      {family.memberCount}명 · 1인당 평균 {family.avgPerMember.toLocaleString()}줄
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold tabular-nums ${style.text}`}>
                      {family.totalLines.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-espresso-400">줄</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

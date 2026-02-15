import { useMemo, useState, useEffect } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { useFamilyStore } from '@/stores/familyStore'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface FamilyRanking {
  familyId: string
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
  const [rpcDone, setRpcDone] = useState(false)

  const persons = useGraphStore((s) => s.persons)
  const readingLogs = useGraphStore((s) => s.readingLogs)
  const activeFamilyId = useFamilyStore((s) => s.activeFamilyId)

  const localRanking = useMemo((): FamilyRanking => {
    const monthLogs = readingLogs.filter((l) => l.date.startsWith(month))
    const totalLines = monthLogs.reduce((s, l) => s + l.linesRead, 0)
    return {
      familyId: activeFamilyId ?? 'local',
      familyName: '우리 가족',
      familyEmoji: '🏠',
      totalLines,
      memberCount: persons.length,
      avgPerMember: persons.length > 0 ? Math.round(totalLines / persons.length) : 0,
    }
  }, [persons, readingLogs, month, activeFamilyId])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    async function fetchRankings() {
      try {
        const { data, error } = await supabase.rpc('get_monthly_family_rankings', { target_month: month })
        if (error) {
          console.error('[FamilyLeaderboard] RPC error:', error)
        }
        if (!error && data) {
          setRankings(data.map((r: Record<string, unknown>) => ({
            familyId: String(r.family_id ?? ''),
            familyName: String(r.family_name ?? ''),
            familyEmoji: String(r.family_emoji ?? '👨‍👩‍👧‍👦'),
            totalLines: Number(r.total_lines ?? 0),
            memberCount: Number(r.member_count ?? 0),
            avgPerMember: Number(r.avg_lines_per_member ?? 0),
          })))
        }
      } catch (err) {
        console.error('[FamilyLeaderboard] fetch error:', err)
      } finally {
        setRpcDone(true)
      }
    }

    fetchRankings()
  }, [month])

  const displayRankings = rankings.length > 0 ? rankings : [localRanking]

  // Find our family's rank
  const ourRankIdx = displayRankings.findIndex((r) => r.familyId === activeFamilyId)
  const ourRank = ourRankIdx >= 0 ? ourRankIdx + 1 : null

  const medalStyles = [
    { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-600', icon: '🏆' },
    { bg: 'bg-gray-400/10', border: 'border-gray-400/40', text: 'text-gray-300', icon: '🥈' },
    { bg: 'bg-orange-600/10', border: 'border-orange-600/40', text: 'text-orange-400', icon: '🥉' },
  ]

  return (
    <div className="space-y-4">
      {/* Rank banner */}
      {ourRank && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 md:px-5 md:py-3 flex items-center gap-2 md:gap-3 animate-fade-in-up">
          <span className="text-lg md:text-2xl">🏠</span>
          <p className="text-xs md:text-sm font-bold text-amber-700 flex-1 min-w-0">
            우리 가족은 {displayRankings.length}가족과 함께 읽고 있어요!
          </p>
          {ourRankIdx >= 0 && (
            <span className="text-xs text-amber-600/70 shrink-0">
              {(displayRankings[ourRankIdx]?.totalLines ?? 0).toLocaleString()}줄
            </span>
          )}
        </div>
      )}

      <div className="md:bg-surface-light/80 md:backdrop-blur-md md:border md:border-surface-border md:rounded-2xl md:p-5">
        <h3 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-2 md:mb-4">
          전체 가족 현황
        </h3>

        <div className="divide-y divide-surface-border md:divide-y-0 md:space-y-3">
          {displayRankings.map((family, idx) => {
            const rank = idx + 1
            const style = medalStyles[idx] ?? { bg: 'bg-surface-lighter', border: 'border-surface-border', text: 'text-espresso-300', icon: `${rank}` }
            const isOurFamily = family.familyId === activeFamilyId

            return (
              <div
                key={family.familyId}
                className={`flex items-center gap-2 md:gap-4 px-2 py-2.5 md:p-4 md:rounded-xl md:border ${style.bg} md:${style.border} ${rank <= 3 ? 'animate-medal-shine' : ''} ${isOurFamily ? 'md:ring-2 md:ring-amber-500/40' : ''}`}
              >
                <div className="text-lg md:text-2xl w-7 md:w-10 text-center shrink-0">
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="text-base md:text-lg">{family.familyEmoji}</span>
                    <span className={`text-xs md:text-sm font-bold ${style.text} truncate`}>{family.familyName}</span>
                    {isOurFamily && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-600 rounded-full font-semibold shrink-0">
                        우리
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-espresso-400">
                    {family.memberCount}명 · 평균 {(family.avgPerMember ?? 0).toLocaleString()}줄
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm md:text-lg font-bold tabular-nums ${style.text}`}>
                    {(family.totalLines ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-espresso-400">줄</p>
                </div>
              </div>
            )
          })}
          {!rpcDone && isSupabaseConfigured && (
            <p className="text-xs text-espresso-400 text-center animate-pulse py-2">다른 가족 불러오는 중...</p>
          )}
        </div>
      </div>
    </div>
  )
}

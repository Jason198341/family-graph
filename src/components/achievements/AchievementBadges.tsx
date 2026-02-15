import { useGraphStore } from '@/stores/graphStore'

interface AchievementBadgesProps {
  month: string
}

export default function AchievementBadges({ month }: AchievementBadgesProps) {
  const getAchievements = useGraphStore((s) => s.getAchievements)
  const achievements = getAchievements(month)

  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)

  // Family tree: grows based on total family lines
  const readingLogs = useGraphStore((s) => s.readingLogs)
  const monthLogs = readingLogs.filter((l) => l.date.startsWith(month))
  const totalLines = monthLogs.reduce((s, l) => s + l.linesRead, 0)
  const treeStage = totalLines >= 50000 ? 5 : totalLines >= 30000 ? 4 : totalLines >= 10000 ? 3 : totalLines >= 5000 ? 2 : totalLines >= 1000 ? 1 : 0
  const treeEmojis = ['🌰', '🌱', '🌿', '🪴', '🌳', '🌲']

  return (
    <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 animate-fade-in-up">
      <h2 className="text-xs text-espresso-400 uppercase tracking-wider font-semibold mb-4">
        도전 과제
      </h2>

      {/* Family tree visualization */}
      <div className="flex items-center gap-4 mb-5 p-4 bg-surface-lighter/60 rounded-xl border border-surface-border">
        <div className="text-center">
          <span className="text-4xl block">{treeEmojis[treeStage]}</span>
          <p className="text-xs text-espresso-400 mt-1">가족 나무</p>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-cream-100">
            가족 합산 {totalLines.toLocaleString()}줄
          </p>
          <div className="h-2 bg-surface rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-olive-400 to-olive-300"
              style={{ width: `${Math.min(100, (totalLines / 50000) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-espresso-400">0</span>
            <span className="text-xs text-espresso-400">50,000줄</span>
          </div>
        </div>
      </div>

      {/* Unlocked badges */}
      {unlocked.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-olive-300 font-semibold mb-2">달성 ({unlocked.length})</p>
          <div className="flex flex-wrap gap-2">
            {unlocked.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-olive-500/15 border border-olive-500/30 rounded-full animate-medal-shine"
                title={a.description}
              >
                <span className="text-sm">{a.emoji}</span>
                <span className="text-xs text-olive-300 font-medium">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked badges with progress */}
      {locked.length > 0 && (
        <div>
          <p className="text-xs text-espresso-400 font-semibold mb-2">도전 중 ({locked.length})</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {locked.map((a) => (
              <div
                key={a.id}
                className="p-2.5 bg-surface-lighter/40 border border-surface-border rounded-xl opacity-70"
                title={a.description}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm grayscale">{a.emoji}</span>
                  <span className="text-xs text-espresso-300 font-medium">{a.label}</span>
                </div>
                <div className="h-1 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-espresso-400/50 transition-all"
                    style={{ width: `${a.progress ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-espresso-400 mt-1">{a.progress ?? 0}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

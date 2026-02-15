import { useGraphStore } from '@/stores/graphStore'
import type { BookRecommendation } from '@/types'

interface RecommendCardProps {
  recommendation: BookRecommendation
}

export default function RecommendCard({ recommendation }: RecommendCardProps) {
  const persons = useGraphStore((s) => s.persons)
  const person = persons.find((p) => p.id === recommendation.personId)

  return (
    <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 hover:border-olive-500/30 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{recommendation.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-cream-100">{recommendation.bookTitle}</p>
          <p className="text-xs text-espresso-400">{recommendation.author}</p>
        </div>
      </div>

      <p className="mt-3 text-sm text-cream-200 leading-relaxed">{recommendation.reason}</p>

      <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-sm border"
            style={{ borderColor: person?.color ?? '#d97706' }}
          >
            {person?.emoji ?? '👤'}
          </div>
          <span className="text-xs text-espresso-400">{person?.name ?? '알 수 없음'} 추천</span>
        </div>
        <span className="text-xs text-espresso-400">
          {new Date(recommendation.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>
    </div>
  )
}

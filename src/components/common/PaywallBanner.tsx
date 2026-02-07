import { useAiUsageStore } from '@/stores/aiUsageStore'

interface PaywallBannerProps {
  /** Shown as inline banner within the AI feature panel */
  variant?: 'inline' | 'modal'
  onClose?: () => void
}

export default function PaywallBanner({ variant = 'inline', onClose }: PaywallBannerProps) {
  const remaining = useAiUsageStore((s) => s.remaining)
  const limitReached = useAiUsageStore((s) => s.limitReached)

  if (!limitReached && variant === 'modal') return null

  // Remaining counter badge (shown when still has uses left)
  if (!limitReached && variant === 'inline') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-lighter/50 border border-surface-border text-xs text-gray-400">
        <svg className="w-3.5 h-3.5 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 2l1.09 3.26L16 6l-2.91.74L12 10l-1.09-3.26L8 6l2.91-.74L12 2z" />
        </svg>
        <span>
          오늘 <span className="text-primary-300 font-semibold">{remaining}</span>회 남음
        </span>
      </div>
    )
  }

  // Limit reached — paywall
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          className="bg-surface-light border border-surface-border rounded-2xl p-8 w-full max-w-sm text-center animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warm-500/20 to-accent-500/20 border border-warm-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">오늘의 무료 AI 사용량 소진</h3>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            무료 플랜은 하루 <span className="text-primary-300 font-semibold">3회</span>까지 AI 기능을 사용할 수 있습니다.
            내일 자정에 초기화됩니다.
          </p>
          <div className="space-y-3">
            <button
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm rounded-xl hover:from-primary-500 hover:to-accent-500 transition-all cursor-pointer"
              onClick={() => window.open('mailto:skypeople41@gmail.com?subject=Family Graph Pro 문의', '_blank')}
            >
              Pro 플랜 문의하기
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Inline limit reached
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-6 rounded-2xl bg-surface-lighter/50 border border-warm-500/20 text-center">
      <span className="text-2xl">🔒</span>
      <div>
        <p className="text-sm font-semibold text-warm-300">오늘의 무료 AI 사용량 소진</p>
        <p className="text-xs text-gray-500 mt-1">
          무료 플랜: 하루 3회 | 내일 자정에 초기화
        </p>
      </div>
      <button
        className="px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-medium text-xs rounded-lg hover:from-primary-500 hover:to-accent-500 transition-all cursor-pointer"
        onClick={() => window.open('mailto:skypeople41@gmail.com?subject=Family Graph Pro 문의', '_blank')}
      >
        Pro 플랜 문의하기
      </button>
    </div>
  )
}

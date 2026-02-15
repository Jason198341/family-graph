import { useReadingStore } from '@/stores/readingStore'
import type { AppView } from '@/types'

const navItems: { view: AppView; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    view: 'home',
    label: '홈',
    icon: (a) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    view: 'library',
    label: '서재',
    icon: (a) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    view: 'community',
    label: '나눔',
    icon: (a) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    view: 'more',
    label: '더보기',
    icon: (a) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const activeView = useReadingStore((s) => s.activeView)
  const setView = useReadingStore((s) => s.setView)

  return (
    <nav className="md:hidden bg-white/95 backdrop-blur-lg border-t border-surface-border safe-area-bottom shrink-0">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ view, label, icon }) => {
          const isActive = activeView === view
          return (
            <button
              key={view}
              onClick={() => setView(view)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors cursor-pointer ${
                isActive ? 'text-amber-600' : 'text-slate-400'
              }`}
            >
              {icon(isActive)}
              <span className={`text-[10px] font-medium ${isActive ? 'text-amber-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

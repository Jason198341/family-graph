import { useGraphStore } from '@/stores/graphStore'
import type { AppView } from '@/types'

const navItems: { view: AppView; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    view: 'dashboard',
    label: '홈',
    icon: (a) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    view: 'reading',
    label: '기록',
    icon: (a) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    view: 'reviews',
    label: '나눔',
    icon: (a) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    view: 'tips',
    label: '코치',
    icon: (a) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    view: 'share',
    label: '공유',
    icon: (a) => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const activeView = useGraphStore((s) => s.activeView)
  const setView = useGraphStore((s) => s.setView)

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

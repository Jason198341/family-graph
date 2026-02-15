import { useState, type ReactNode } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { useAuthStore } from '@/stores/authStore'
import { useFamilyStore } from '@/stores/familyStore'
import { signOut, supabase } from '@/lib/supabase'
import type { AppView } from '@/types'
import MemberManager from '@/components/family/MemberManager'

const navItems: { view: AppView; label: string; icon: ReactNode }[] = [
  {
    view: 'dashboard',
    label: '성장 기록',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    view: 'reading',
    label: '독서 입력',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="13" y2="11" />
      </svg>
    ),
  },
  {
    view: 'reviews',
    label: '독서 나눔',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="13" y2="13" />
      </svg>
    ),
  },
  {
    view: 'tips',
    label: '독서 코치',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const activeView = useGraphStore((s) => s.activeView)
  const setView = useGraphStore((s) => s.setView)
  const persons = useGraphStore((s) => s.persons)
  const profile = useAuthStore((s) => s.profile)
  const family = useFamilyStore((s) => s.family)
  const devMode = useAuthStore((s) => s.devMode)
  const [showSettings, setShowSettings] = useState(false)

  const handleLogout = async () => {
    await signOut()
    window.location.reload()
  }

  return (
    <>
      <div className="group/sidebar h-full w-16 hover:w-64 transition-all duration-300 ease-in-out bg-surface-light border-r border-surface-border flex flex-col shrink-0 overflow-hidden z-40">
        {/* Logo + Family name */}
        <div className="flex items-center gap-3 px-3 py-5 border-b border-surface-border min-h-[72px]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <span className="text-white font-bold text-sm tracking-tight">
              {family?.emoji ?? '📚'}
            </span>
          </div>
          <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
            <h1 className="text-sm font-bold text-cream-100">{family?.name ?? '가족 독서'}</h1>
            <p className="text-xs text-espresso-300">가족 독서 여정</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 flex flex-col gap-1 px-2">
          {navItems.map(({ view, label, icon }) => {
            const isActive = activeView === view
            return (
              <button
                key={view}
                onClick={() => setView(view)}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full cursor-pointer
                  ${isActive
                    ? 'bg-surface-lighter text-amber-600'
                    : 'text-espresso-300 hover:text-cream-200 hover:bg-surface-hover'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-amber-500 rounded-r-full" />
                )}
                <span className="shrink-0 w-5 flex items-center justify-center">{icon}</span>
                <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap overflow-hidden">
                  {label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="mx-3 border-t border-surface-border" />

        {/* Family member avatars */}
        <div className="py-4 px-2 flex flex-col gap-2">
          <span className="text-xs text-espresso-400 uppercase tracking-wider px-3 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            가족 구성원
          </span>
          {persons.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg w-full"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 border-2"
                style={{ borderColor: person.color, backgroundColor: `${person.color}15` }}
              >
                {person.emoji}
              </div>
              <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
                <p className="text-xs font-medium text-cream-200">{person.name}</p>
                <p className="text-xs text-espresso-400">{person.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-surface-border" />

        {/* Font size toggle */}
        <div className="py-2 px-2">
          <button
            onClick={() => {
              const sizes = ['normal', 'large', 'xlarge'] as const
              const current = useGraphStore.getState().fontSize
              const next = sizes[(sizes.indexOf(current) + 1) % sizes.length]
              useGraphStore.getState().setFontSize(next)
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors w-full cursor-pointer text-espresso-300 hover:text-cream-200"
            title="글자 크기 조절"
          >
            <span className="shrink-0 w-5 flex items-center justify-center text-sm font-bold">A</span>
            <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 text-xs font-medium whitespace-nowrap overflow-hidden">
              글자 크기
            </span>
          </button>
        </div>

        {/* User profile + Settings */}
        <div className="py-3 px-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors w-full cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-base shrink-0">
              {profile?.avatarEmoji ?? '👤'}
            </div>
            <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
              <p className="text-xs font-medium text-cream-200">{profile?.displayName ?? 'User'}</p>
              <p className="text-xs text-espresso-400">
                {devMode ? 'Dev Mode' : '설정'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div
            className="bg-surface-light border border-surface-border rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-cream-100">설정</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-espresso-300 hover:text-cream-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <MemberManager />

            <div className="mt-6 pt-4 border-t border-surface-border space-y-2">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-medium hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                로그아웃
              </button>
              <button
                onClick={async () => {
                  if (!confirm('정말 가족을 탈퇴하시겠습니까?\n가족 데이터가 모두 삭제됩니다.')) return
                  const fid = useFamilyStore.getState().activeFamilyId
                  if (fid) {
                    const tables = ['book_reviews','book_recommendations','reading_goals','reading_logs','books','persons','family_members']
                    for (const t of tables) {
                      await supabase.from(t).delete().eq('family_id', fid)
                    }
                    await supabase.from('families').delete().eq('id', fid)
                  }
                  window.location.reload()
                }}
                className="w-full py-2.5 bg-rose-500/5 text-rose-400/70 border border-rose-500/10 rounded-lg text-xs hover:bg-rose-500/15 hover:text-rose-400 transition-colors cursor-pointer"
              >
                가족 탈퇴 및 데이터 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

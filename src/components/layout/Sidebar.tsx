import { useState, type ReactNode } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { useAuthStore } from '@/stores/authStore'
import { useFamilyStore } from '@/stores/familyStore'
import { signOut } from '@/lib/supabase'
import type { AppView } from '@/types'
import MemberManager from '@/components/family/MemberManager'

const navItems: { view: AppView; label: string; icon: ReactNode }[] = [
  {
    view: 'dashboard',
    label: '대시보드',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    view: 'graph',
    label: '그래프',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="12" cy="18" r="3" />
        <line x1="8.5" y1="7.5" x2="10" y2="16" />
        <line x1="15.5" y1="7.5" x2="14" y2="16" />
        <line x1="9" y1="6" x2="15" y2="6" />
      </svg>
    ),
  },
  {
    view: 'chat',
    label: '성장 어드바이저',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="13" y2="13" />
      </svg>
    ),
  },
  {
    view: 'extract',
    label: 'AI 분석',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l1.09 3.26L16 6l-2.91.74L12 10l-1.09-3.26L8 6l2.91-.74L12 2z" />
        <path d="M5 14l.72 2.17L8 17l-2.28.83L5 20l-.72-2.17L2 17l2.28-.83L5 14z" />
        <path d="M19 14l.72 2.17L22 17l-2.28.83L19 20l-.72-2.17L16 17l2.28-.83L19 14z" />
      </svg>
    ),
  },
  {
    view: 'reading',
    label: '독서 프로젝트',
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
    view: 'timeline',
    label: '타임라인',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="9" y1="4" x2="9" y2="10" />
        <line x1="15" y1="4" x2="15" y2="10" />
        <line x1="7" y1="14" x2="7" y2="14.01" />
        <line x1="12" y1="14" x2="12" y2="14.01" />
        <line x1="17" y1="14" x2="17" y2="14.01" />
        <line x1="7" y1="18" x2="7" y2="18.01" />
        <line x1="12" y1="18" x2="12" y2="18.01" />
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20">
            <span className="text-white font-bold text-sm tracking-tight">
              {family?.emoji ?? 'FG'}
            </span>
          </div>
          <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
            <h1 className="text-sm font-bold text-white">{family?.name ?? 'Family Graph'}</h1>
            <p className="text-[10px] text-gray-400">가족 성장 지식그래프</p>
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
                    ? 'bg-surface-lighter text-primary-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-surface-hover'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary-500 rounded-r-full" />
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
          <span className="text-[10px] text-gray-500 uppercase tracking-wider px-3 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            가족 구성원
          </span>
          {persons.map((person) => (
            <button
              key={person.id}
              onClick={() => {
                setView('graph')
                useGraphStore.getState().selectNode(person.id)
              }}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors w-full cursor-pointer"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 border-2"
                style={{ borderColor: person.color, backgroundColor: `${person.color}15` }}
              >
                {person.emoji}
              </div>
              <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
                <p className="text-xs font-medium text-gray-200">{person.name}</p>
                <p className="text-[10px] text-gray-500">{person.role}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-surface-border" />

        {/* User profile + Settings */}
        <div className="py-3 px-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors w-full cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-base shrink-0">
              {profile?.avatarEmoji ?? '👤'}
            </div>
            <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
              <p className="text-xs font-medium text-gray-200">{profile?.displayName ?? 'User'}</p>
              <p className="text-[10px] text-gray-500">
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
              <h2 className="text-lg font-bold text-white">설정</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Member manager */}
            <MemberManager />

            {/* Logout */}
            <div className="mt-6 pt-4 border-t border-surface-border">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

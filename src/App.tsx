import { lazy, Suspense, useEffect } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { useAuthStore } from '@/stores/authStore'
import { useFamilyStore } from '@/stores/familyStore'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import Sidebar from '@/components/layout/Sidebar'
import NodeDetail from '@/components/layout/NodeDetail'
import RaceDashboard from '@/components/race/RaceDashboard'
import Toast from '@/components/common/Toast'
import LoginPage from '@/components/auth/LoginPage'
import FamilySetup from '@/components/family/FamilySetup'
import PendingApproval from '@/components/family/PendingApproval'

// Lazy-load heavy views for code-splitting
const KnowledgeGraph = lazy(() => import('@/components/graph/KnowledgeGraph'))
const GrowthChat = lazy(() => import('@/components/chat/GrowthChat'))
const ExtractPanel = lazy(() => import('@/components/chat/ExtractPanel'))
const ReadingTracker = lazy(() => import('@/components/reading/ReadingTracker'))
const WritingPage = lazy(() => import('@/components/writing/WritingPage'))

function ViewLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-xs text-gray-500">로딩 중...</p>
      </div>
    </div>
  )
}

function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-surface">
      <div className="flex flex-col items-center gap-3 animate-fade-in-up">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
          <span className="text-white font-bold text-lg">FG</span>
        </div>
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    </div>
  )
}

function TimelineView() {
  const events = useGraphStore((s) => s.events)
  const persons = useGraphStore((s) => s.persons)
  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const impactColors: Record<string, string> = {
    positive: '#22c55e',
    neutral: '#f59e0b',
    challenge: '#ef4444',
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📅</span> 타임라인
        </h1>
        <p className="text-sm text-gray-500 mt-1">가족의 중요한 순간들을 시간순으로 봅니다</p>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">🗓️</span>
          <p className="text-gray-500">기록된 이벤트가 없습니다</p>
          <p className="text-xs text-gray-600 mt-1">AI 분석에서 일상을 입력하면 자동으로 이벤트가 추가됩니다</p>
        </div>
      ) : (
        <div className="relative pl-10">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary-500/50 via-accent-500/30 to-transparent" />

          <div className="space-y-6">
            {sorted.map((event, idx) => {
              const relatedPersons = event.personIds
                .map((pid) => persons.find((p) => p.id === pid))
                .filter(Boolean)

              return (
                <div
                  key={event.id}
                  className="relative animate-fade-in-up"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div
                    className="absolute -left-6 top-4 w-4 h-4 rounded-full border-2 border-surface-light"
                    style={{ backgroundColor: impactColors[event.impact] ?? impactColors.neutral }}
                  />

                  <div className="bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl p-5 hover:border-surface-hover transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{event.emoji}</span>
                        <div>
                          <h3 className="font-semibold text-white">{event.title}</h3>
                          <p className="text-xs text-gray-500">{event.date}</p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2.5 py-0.5 rounded-full border font-medium"
                        style={{
                          borderColor: `${impactColors[event.impact]}40`,
                          color: impactColors[event.impact],
                          backgroundColor: `${impactColors[event.impact]}10`,
                        }}
                      >
                        {event.impact === 'positive' ? '긍정적' : event.impact === 'challenge' ? '도전' : '중립'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{event.description}</p>
                    {relatedPersons.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border">
                        <span className="text-[10px] text-gray-600">관련:</span>
                        {relatedPersons.map((p) => (
                          <span key={p!.id} className="text-xs text-gray-400 flex items-center gap-1">
                            {p!.emoji} {p!.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MainApp() {
  const activeView = useGraphStore((s) => s.activeView)
  const dataLoaded = useGraphStore((s) => s.dataLoaded)
  const loadFamilyData = useGraphStore((s) => s.loadFamilyData)
  const activeFamilyId = useFamilyStore((s) => s.activeFamilyId)

  // Realtime sync
  useRealtimeSync()

  // Load family data when family becomes active
  useEffect(() => {
    if (activeFamilyId) {
      loadFamilyData(activeFamilyId)
    }
  }, [activeFamilyId, loadFamilyData])

  if (!dataLoaded) return <FullScreenLoader />

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface">
      <Sidebar />

      <main className="flex-1 flex overflow-hidden relative">
        {activeView === 'dashboard' && <RaceDashboard />}
        {activeView === 'timeline' && <TimelineView />}
        <Suspense fallback={<ViewLoader />}>
          {activeView === 'graph' && <KnowledgeGraph />}
          {activeView === 'chat' && <GrowthChat />}
          {activeView === 'extract' && <ExtractPanel />}
          {activeView === 'reading' && <ReadingTracker />}
          {activeView === 'writing' && <WritingPage />}
        </Suspense>
      </main>

      <NodeDetail />
      <Toast />
    </div>
  )
}

export default function App() {
  useAuth()

  const authLoading = useAuthStore((s) => s.loading)
  const authInitialized = useAuthStore((s) => s.initialized)
  const user = useAuthStore((s) => s.user)
  const familyStatus = useFamilyStore((s) => s.status)

  // Auth still loading
  if (!authInitialized || authLoading) return <FullScreenLoader />

  // Not logged in
  if (!user) return <LoginPage />

  // Family status check
  if (familyStatus === 'loading') return <FullScreenLoader />
  if (familyStatus === 'no-family') return <FamilySetup />
  if (familyStatus === 'pending') return <PendingApproval />

  // Ready
  return <MainApp />
}

import { lazy, Suspense, useEffect } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import { useAuthStore } from '@/stores/authStore'
import { useFamilyStore } from '@/stores/familyStore'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import Sidebar from '@/components/layout/Sidebar'
import RaceDashboard from '@/components/race/RaceDashboard'
import Toast from '@/components/common/Toast'
import LoginPage from '@/components/auth/LoginPage'
import FamilySetup from '@/components/family/FamilySetup'
import PendingApproval from '@/components/family/PendingApproval'

// Initialize font size from localStorage
const savedFontSize = localStorage.getItem('fg_font_size')
if (savedFontSize) document.documentElement.dataset.fontSize = savedFontSize

const ReadingTracker = lazy(() => import('@/components/reading/ReadingTracker'))
const ReviewsPage = lazy(() => import('@/components/reviews/ReviewsPage'))
const TipsPage = lazy(() => import('@/components/tips/TipsPage'))

function ViewLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs text-espresso-400">로딩 중...</p>
      </div>
    </div>
  )
}

function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-surface">
      <div className="flex flex-col items-center gap-3 animate-fade-in-up">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-espresso-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <span className="text-2xl">📚</span>
        </div>
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    </div>
  )
}

function MainApp() {
  const activeView = useGraphStore((s) => s.activeView)
  const dataLoaded = useGraphStore((s) => s.dataLoaded)
  const loadFamilyData = useGraphStore((s) => s.loadFamilyData)
  const activeFamilyId = useFamilyStore((s) => s.activeFamilyId)

  useRealtimeSync()

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
        <Suspense fallback={<ViewLoader />}>
          {activeView === 'reading' && <ReadingTracker />}
          {activeView === 'reviews' && <ReviewsPage />}
          {activeView === 'tips' && <TipsPage />}
        </Suspense>
      </main>

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

  if (!authInitialized || authLoading) return <FullScreenLoader />
  if (!user) return <LoginPage />
  if (familyStatus === 'loading') return <FullScreenLoader />
  if (familyStatus === 'no-family') return <FamilySetup />
  if (familyStatus === 'pending') return <PendingApproval />

  return <MainApp />
}

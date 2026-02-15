import { useAuthStore } from '@/stores/authStore'
import { useFamilyStore } from '@/stores/familyStore'
import { signOut } from '@/lib/supabase'

export default function PendingApproval() {
  const profile = useAuthStore((s) => s.profile)
  const loadFamily = useFamilyStore((s) => s.loadFamily)

  const handleRefresh = () => { loadFamily() }
  const handleLogout = async () => { await signOut() }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-surface">
      <div className="w-full max-w-sm mx-4 text-center animate-fade-in-up">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mb-4">
          <span className="text-3xl">⏳</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">승인 대기 중</h2>
        <p className="text-sm text-gray-400 mb-1">{profile?.displayName}님, 가족 관리자의 승인을 기다리고 있습니다.</p>
        <p className="text-xs text-gray-500 mb-6">관리자가 승인하면 자동으로 입장됩니다.</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-surface-light border border-surface-border rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:border-gray-500 transition-colors cursor-pointer"
          >
            새로고침
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}

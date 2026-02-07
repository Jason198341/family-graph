import { useState } from 'react'
import { useFamilyStore } from '@/stores/familyStore'
import { useAuthStore } from '@/stores/authStore'
import { signOut } from '@/lib/supabase'
import InviteCode from './InviteCode'

export default function FamilySetup() {
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [familyName, setFamilyName] = useState('')
  const [familyEmoji, setFamilyEmoji] = useState('👨‍👩‍👧‍👦')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdFamily, setCreatedFamily] = useState<{ inviteCode: string } | null>(null)

  const createFamily = useFamilyStore((s) => s.createFamily)
  const joinByCode = useFamilyStore((s) => s.joinByCode)
  const profile = useAuthStore((s) => s.profile)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim()) return
    setLoading(true)
    setError(null)
    const family = await createFamily(familyName.trim(), familyEmoji)
    if (family) {
      setCreatedFamily({ inviteCode: family.inviteCode })
    } else {
      setError('가족 생성에 실패했습니다')
    }
    setLoading(false)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setLoading(true)
    setError(null)
    const result = await joinByCode(inviteCode.trim())
    if (result.error) setError(result.error)
    setLoading(false)
  }

  const handleLogout = async () => {
    await signOut()
  }

  // Show invite code after creating family
  if (createdFamily) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-surface">
        <div className="w-full max-w-sm mx-4 text-center animate-fade-in-up">
          <span className="text-5xl mb-4 inline-block">🎉</span>
          <h2 className="text-xl font-bold text-white mb-2">가족이 생성되었습니다!</h2>
          <p className="text-sm text-gray-400 mb-6">아래 초대 코드를 가족에게 공유하세요</p>
          <InviteCode code={createdFamily.inviteCode} />
        </div>
      </div>
    )
  }

  const emojiOptions = ['👨‍👩‍👧‍👦', '👨‍👩‍👦', '👨‍👩‍👧', '👩‍👧‍👦', '👨‍👧‍👦', '🏠', '🌳', '💝']

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-surface">
      <div className="w-full max-w-sm mx-4">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in-up">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 mb-3">
            <span className="text-white font-bold text-lg">FG</span>
          </div>
          <h1 className="text-xl font-bold text-white">안녕하세요, {profile?.displayName}님</h1>
          <p className="text-sm text-gray-400 mt-1">가족 그룹을 만들거나 초대 코드로 참여하세요</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface-light border border-surface-border rounded-xl p-1 mb-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <button
            onClick={() => { setTab('create'); setError(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === 'create' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            새 가족 만들기
          </button>
          <button
            onClick={() => { setTab('join'); setError(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === 'join' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            초대 코드 입력
          </button>
        </div>

        {/* Content */}
        <div className="bg-surface-light border border-surface-border rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">가족 이름</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="문씨네 가족"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">이모지</label>
                <div className="flex gap-2 flex-wrap">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFamilyEmoji(emoji)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all cursor-pointer ${
                        familyEmoji === emoji
                          ? 'bg-primary-600/30 border-2 border-primary-500 scale-110'
                          : 'bg-surface border border-surface-border hover:border-gray-500'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? '생성 중...' : '가족 만들기'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">초대 코드</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors tracking-widest text-center font-mono"
                  placeholder="abcd1234"
                  required
                  maxLength={8}
                />
              </div>
              {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? '참여 요청 중...' : '가족 참여하기'}
              </button>
            </form>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-4 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useFamilyStore } from '@/stores/familyStore'
import { useAuthStore } from '@/stores/authStore'
import { useGraphStore } from '@/stores/graphStore'
import { signOut } from '@/lib/supabase'
import InviteCode from './InviteCode'

const ROLE_PRESETS = [
  { role: '아빠', emoji: '👨', color: '#3b82f6' },
  { role: '엄마', emoji: '👩', color: '#ec4899' },
  { role: '아들', emoji: '👦', color: '#22c55e' },
  { role: '딸', emoji: '👧', color: '#f59e0b' },
  { role: '할아버지', emoji: '👴', color: '#6366f1' },
  { role: '할머니', emoji: '👵', color: '#a855f7' },
]

type Step = 'create-family' | 'add-members' | 'invite-or-start' | 'show-invite'

export default function FamilySetup() {
  const [step, setStep] = useState<Step>('create-family')
  const [tab, setTab] = useState<'create' | 'join'>('create')

  // Create family form
  const [familyName, setFamilyName] = useState('')
  const [familyEmoji, setFamilyEmoji] = useState('👨‍👩‍👧‍👦')
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [familyInviteCode, setFamilyInviteCode] = useState('')

  // Add members form
  const [addedPersons, setAddedPersons] = useState<{ name: string; role: string; emoji: string; color: string }[]>([])
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newEmoji, setNewEmoji] = useState('🧑')
  const [newColor, setNewColor] = useState('#3b82f6')

  const createFamily = useFamilyStore((s) => s.createFamily)
  const joinByCode = useFamilyStore((s) => s.joinByCode)
  const addPerson = useGraphStore((s) => s.addPerson)
  const profile = useAuthStore((s) => s.profile)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim()) return
    setLoading(true)
    setError(null)
    const family = await createFamily(familyName.trim(), familyEmoji)
    if (family) {
      setFamilyInviteCode(family.inviteCode)
      setStep('add-members')
    } else {
      setError('가족 생성에 실패했습니다')
    }
    setLoading(false)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCodeInput.trim()) return
    setLoading(true)
    setError(null)
    const result = await joinByCode(inviteCodeInput.trim())
    if (result.error) setError(result.error)
    setLoading(false)
  }

  const handleLogout = async () => { await signOut() }

  const addMember = () => {
    if (!newName.trim()) return
    setAddedPersons([...addedPersons, { name: newName.trim(), role: newRole || '가족', emoji: newEmoji, color: newColor }])
    setNewName('')
    setNewRole('')
    setNewEmoji('🧑')
    setNewColor('#3b82f6')
  }

  const removeMember = (idx: number) => {
    setAddedPersons(addedPersons.filter((_, i) => i !== idx))
  }

  const applyPreset = (preset: typeof ROLE_PRESETS[number]) => {
    setNewRole(preset.role)
    setNewEmoji(preset.emoji)
    setNewColor(preset.color)
  }

  const finishOnboarding = () => {
    // Save all added persons to the graph
    for (const p of addedPersons) {
      addPerson({ name: p.name, role: p.role, emoji: p.emoji, color: p.color, bio: '' })
    }
    setStep('invite-or-start')
  }

  const goToApp = () => window.location.reload()

  const emojiOptions = ['👨‍👩‍👧‍👦', '👨‍👩‍👦', '👨‍👩‍👧', '👩‍👧‍👦', '👨‍👧‍👦', '🏠', '🌳', '💝']

  // ─── Step 2: Add family members ────────────────────
  if (step === 'add-members') {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-surface">
        <div className="w-full max-w-md mx-4 animate-fade-in-up">
          <div className="text-center mb-6">
            <span className="text-4xl mb-2 inline-block">👨‍👩‍👧‍👦</span>
            <h2 className="text-xl font-bold text-gray-900">가족 구성원을 등록하세요</h2>
            <p className="text-sm text-gray-400 mt-1">그래프에 표시될 가족 인물을 추가합니다</p>
          </div>

          <div className="bg-surface-light border border-surface-border rounded-2xl p-6 space-y-4">
            {/* Quick role presets */}
            <div>
              <p className="text-xs text-gray-400 mb-2">빠른 선택</p>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.role}
                    onClick={() => { applyPreset(preset); if (!newName) setNewName(preset.role === '아빠' || preset.role === '엄마' ? '' : '') }}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      newRole === preset.role
                        ? 'bg-primary-500/20 border border-primary-500/40 text-amber-700'
                        : 'bg-surface border border-surface-border text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {preset.emoji} {preset.role}
                  </button>
                ))}
              </div>
            </div>

            {/* Name + add */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="이름 입력 (예: 현규)"
                className="flex-1 px-3 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && addMember()}
              />
              <button
                onClick={addMember}
                disabled={!newName.trim()}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-border disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                추가
              </button>
            </div>

            {/* Preview of current person being added */}
            {(newRole || newName) && (
              <div className="flex items-center gap-3 px-3 py-2 bg-surface rounded-lg border border-dashed border-surface-border">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg border-2 shrink-0"
                  style={{ borderColor: newColor, backgroundColor: `${newColor}15` }}
                >
                  {newEmoji}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{newName || '이름'}</p>
                  <p className="text-xs text-gray-500">{newRole || '역할'}</p>
                </div>
              </div>
            )}

            {/* Added persons list */}
            {addedPersons.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">등록할 가족 ({addedPersons.length}명)</p>
                <div className="space-y-1.5">
                  {addedPersons.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2 shrink-0"
                        style={{ borderColor: p.color, backgroundColor: `${p.color}15` }}
                      >
                        {p.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.role}</p>
                      </div>
                      <button
                        onClick={() => removeMember(i)}
                        className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer p-1"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 space-y-2">
            <button
              onClick={finishOnboarding}
              disabled={addedPersons.length === 0}
              className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-light disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {addedPersons.length > 0
                ? `${addedPersons.length}명 등록하고 계속하기`
                : '최소 1명을 추가하세요'}
            </button>
            <button
              onClick={() => { setStep('invite-or-start') }}
              className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              나중에 추가할게요
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 3: Invite or Start ────────────────────
  if (step === 'invite-or-start') {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-surface">
        <div className="w-full max-w-sm mx-4 text-center animate-fade-in-up">
          <span className="text-5xl mb-4 inline-block">🎉</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">준비 완료!</h2>
          <p className="text-sm text-gray-400 mb-8">
            {addedPersons.length > 0
              ? `${addedPersons.length}명의 가족이 등록되었습니다`
              : '가족 그룹이 생성되었습니다'}
          </p>
          <div className="space-y-3">
            <button
              onClick={goToApp}
              className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              <span className="text-lg block mb-1">🚀</span>
              <span className="font-semibold">시작하기</span>
            </button>
            {familyInviteCode && (
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2">다른 가족도 함께 사용하려면 초대 코드를 공유하세요</p>
                <InviteCode code={familyInviteCode} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 4: Show invite code ────────────────────
  if (step === 'show-invite') {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-surface">
        <div className="w-full max-w-sm mx-4 text-center animate-fade-in-up">
          <h2 className="text-xl font-bold text-gray-900 mb-2">초대 코드</h2>
          <p className="text-sm text-gray-400 mb-6">아래 코드를 가족에게 공유하세요</p>
          <InviteCode code={familyInviteCode} />
          <button
            onClick={goToApp}
            className="w-full mt-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            시작하기
          </button>
        </div>
      </div>
    )
  }

  // ─── Step 1: Create family or Join ────────────────
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-surface">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-6 animate-fade-in-up">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 mb-3">
            <span className="text-white font-bold text-lg">FG</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">안녕하세요, {profile?.displayName}님</h1>
          <p className="text-sm text-gray-400 mt-1">가족 그룹을 만들거나 초대 코드로 참여하세요</p>
        </div>

        <div className="flex bg-surface-light border border-surface-border rounded-xl p-1 mb-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <button
            onClick={() => { setTab('create'); setError(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === 'create' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            새 가족 만들기
          </button>
          <button
            onClick={() => { setTab('join'); setError(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === 'join' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            초대 코드 입력
          </button>
        </div>

        <div className="bg-surface-light border border-surface-border rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">가족 이름</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
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
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors tracking-widest text-center font-mono"
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
          className="w-full mt-4 py-2 text-xs text-gray-500 hover:text-gray-600 transition-colors cursor-pointer"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}

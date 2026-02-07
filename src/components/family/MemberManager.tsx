import { useState } from 'react'
import { useFamilyStore } from '@/stores/familyStore'
import { useGraphStore } from '@/stores/graphStore'
import InviteCode from './InviteCode'

const ROLE_PRESETS = [
  { role: '아빠', emoji: '👨', color: '#3b82f6' },
  { role: '엄마', emoji: '👩', color: '#ec4899' },
  { role: '아들', emoji: '👦', color: '#22c55e' },
  { role: '딸', emoji: '👧', color: '#f59e0b' },
  { role: '할아버지', emoji: '👴', color: '#6366f1' },
  { role: '할머니', emoji: '👵', color: '#a855f7' },
]

const EXTRA_EMOJIS = ['👶', '🧒', '🧑', '👱', '🧔', '👩‍🦰', '👨‍🦳', '👩‍🦳']

export default function MemberManager() {
  const family = useFamilyStore((s) => s.family)
  const members = useFamilyStore((s) => s.members)
  const myMembership = useFamilyStore((s) => s.myMembership)
  const approveMember = useFamilyStore((s) => s.approveMember)
  const rejectMember = useFamilyStore((s) => s.rejectMember)
  const regenerateInviteCode = useFamilyStore((s) => s.regenerateInviteCode)

  const persons = useGraphStore((s) => s.persons)
  const addPerson = useGraphStore((s) => s.addPerson)
  const addToast = useGraphStore((s) => s.addToast)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newEmoji, setNewEmoji] = useState('🧑')
  const [newColor, setNewColor] = useState('#3b82f6')

  if (!family) return null

  const isAdmin = myMembership?.role === 'admin'
  const pendingMembers = members.filter((m) => m.status === 'pending')
  const approvedMembers = members.filter((m) => m.status === 'approved')

  const handleAddPerson = () => {
    if (!newName.trim()) return
    addPerson({
      name: newName.trim(),
      role: newRole || '가족',
      emoji: newEmoji,
      bio: '',
      color: newColor,
    })
    addToast(`${newEmoji} ${newName} 추가됨`, 'success')
    setNewName('')
    setNewRole('')
    setNewEmoji('🧑')
    setNewColor('#3b82f6')
    setShowAddForm(false)
  }

  const applyPreset = (preset: typeof ROLE_PRESETS[number]) => {
    setNewRole(preset.role)
    setNewEmoji(preset.emoji)
    setNewColor(preset.color)
  }

  return (
    <div className="space-y-6">
      {/* Family info + invite code */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>{family.emoji}</span> {family.name}
        </h3>
        {isAdmin && (
          <InviteCode code={family.inviteCode} onRegenerate={regenerateInviteCode} />
        )}
      </div>

      {/* Graph persons (가족 인물) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs text-gray-400 uppercase tracking-wider">
            가족 인물 ({persons.length})
          </h4>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs px-2.5 py-1 rounded-lg bg-primary-500/15 border border-primary-500/25 text-primary-400 hover:bg-primary-500/25 transition-colors cursor-pointer"
          >
            {showAddForm ? '취소' : '+ 추가'}
          </button>
        </div>

        {/* Add person form */}
        {showAddForm && (
          <div className="bg-surface border border-primary-500/20 rounded-xl p-4 mb-3 space-y-3 animate-fade-in-up">
            {/* Quick role presets */}
            <div>
              <p className="text-[10px] text-gray-500 mb-1.5">빠른 선택</p>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.role}
                    onClick={() => applyPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                      newRole === preset.role
                        ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300'
                        : 'bg-surface-lighter border border-surface-border text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {preset.emoji} {preset.role}
                  </button>
                ))}
              </div>
            </div>

            {/* Name input */}
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">이름</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 세연"
                className="w-full px-3 py-2 bg-surface-lighter border border-surface-border rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/40 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
              />
            </div>

            {/* Emoji picker */}
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">이모지</label>
              <div className="flex gap-1.5 flex-wrap">
                {[...ROLE_PRESETS.map((p) => p.emoji), ...EXTRA_EMOJIS].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewEmoji(emoji)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all cursor-pointer ${
                      newEmoji === emoji
                        ? 'bg-primary-500/25 border-2 border-primary-500 scale-110'
                        : 'bg-surface-lighter border border-surface-border hover:border-gray-500'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">색상</label>
              <div className="flex gap-1.5">
                {['#3b82f6', '#ec4899', '#22c55e', '#f59e0b', '#6366f1', '#a855f7', '#ef4444', '#14b8a6'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                      newColor === c ? 'scale-125 ring-2 ring-white/30' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Preview + submit */}
            <div className="flex items-center gap-3 pt-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 shrink-0"
                style={{ borderColor: newColor, backgroundColor: `${newColor}15` }}
              >
                {newEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{newName || '이름'}</p>
                <p className="text-[10px] text-gray-500">{newRole || '역할'}</p>
              </div>
              <button
                onClick={handleAddPerson}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-border disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                추가
              </button>
            </div>
          </div>
        )}

        {/* Existing persons list */}
        <div className="space-y-1.5">
          {persons.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 border-2"
                style={{ borderColor: p.color, backgroundColor: `${p.color}15` }}
              >
                {p.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{p.name}</p>
                <p className="text-[10px] text-gray-500">{p.role}</p>
              </div>
            </div>
          ))}
          {persons.length === 0 && (
            <p className="text-xs text-gray-600 text-center py-3">아직 등록된 가족 인물이 없습니다</p>
          )}
        </div>
      </div>

      {/* Pending approvals */}
      {isAdmin && pendingMembers.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">
            승인 대기 ({pendingMembers.length})
          </h4>
          <div className="space-y-2">
            {pendingMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-surface border border-amber-500/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.avatarEmoji ?? '👤'}</span>
                  <div>
                    <p className="text-sm text-white">{m.displayName ?? m.email ?? '알 수 없음'}</p>
                    {m.email && <p className="text-[10px] text-gray-500">{m.email}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => approveMember(m.id)}
                    className="px-2.5 py-1 bg-growth-600/20 text-growth-400 border border-growth-500/30 rounded text-xs hover:bg-growth-600/30 transition-colors cursor-pointer"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => rejectMember(m.id)}
                    className="px-2.5 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-600/30 transition-colors cursor-pointer"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account members */}
      <div>
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">
          계정 ({approvedMembers.length})
        </h4>
        <div className="space-y-1.5">
          {approvedMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg">
              <span className="text-lg">{m.avatarEmoji ?? '👤'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{m.displayName ?? m.email ?? '알 수 없음'}</p>
              </div>
              {m.role === 'admin' && (
                <span className="text-[10px] px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full border border-primary-500/30">
                  관리자
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

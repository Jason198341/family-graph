import { useState, useRef } from 'react'
import { useFamilyStore } from '@/stores/familyStore'
import { useGraphStore } from '@/stores/graphStore'
import { resizeImage } from '@/lib/resizeImage'
import PersonAvatar from '@/components/common/PersonAvatar'
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
const ALL_EMOJIS = [...ROLE_PRESETS.map((p) => p.emoji), ...EXTRA_EMOJIS]
const COLORS = ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b', '#6366f1', '#a855f7', '#ef4444', '#14b8a6']

export default function MemberManager() {
  const family = useFamilyStore((s) => s.family)
  const members = useFamilyStore((s) => s.members)
  const myMembership = useFamilyStore((s) => s.myMembership)
  const approveMember = useFamilyStore((s) => s.approveMember)
  const rejectMember = useFamilyStore((s) => s.rejectMember)
  const regenerateInviteCode = useFamilyStore((s) => s.regenerateInviteCode)

  const persons = useGraphStore((s) => s.persons)
  const addPerson = useGraphStore((s) => s.addPerson)
  const updatePerson = useGraphStore((s) => s.updatePerson)
  const addToast = useGraphStore((s) => s.addToast)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newEmoji, setNewEmoji] = useState('🧑')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [newAvatarUrl, setNewAvatarUrl] = useState('')
  const addFileRef = useRef<HTMLInputElement>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const editFileRef = useRef<HTMLInputElement>(null)

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
      avatarUrl: newAvatarUrl || undefined,
    })
    addToast(`${newEmoji} ${newName} 추가됨`, 'success')
    setNewName('')
    setNewRole('')
    setNewEmoji('🧑')
    setNewColor('#3b82f6')
    setNewAvatarUrl('')
    setShowAddForm(false)
  }

  const handleFileUpload = async (file: File, target: 'add' | 'edit') => {
    try {
      const dataUrl = await resizeImage(file)
      if (target === 'add') setNewAvatarUrl(dataUrl)
      else setEditAvatarUrl(dataUrl)
      addToast('사진 업로드 완료', 'success')
    } catch {
      addToast('사진 처리 실패', 'error')
    }
  }

  const applyPreset = (preset: typeof ROLE_PRESETS[number]) => {
    setNewRole(preset.role)
    setNewEmoji(preset.emoji)
    setNewColor(preset.color)
  }

  const startEdit = (p: typeof persons[number]) => {
    setEditingId(p.id)
    setEditName(p.name)
    setEditRole(p.role)
    setEditEmoji(p.emoji)
    setEditColor(p.color)
    setEditAvatarUrl(p.avatarUrl ?? '')
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return
    updatePerson(editingId, {
      name: editName.trim(),
      role: editRole,
      emoji: editEmoji,
      color: editColor,
      avatarUrl: editAvatarUrl || undefined,
    })
    addToast(`${editEmoji} ${editName} 수정됨`, 'success')
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Family info + invite code */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
              <p className="text-xs text-gray-500 mb-1.5">빠른 선택</p>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.role}
                    onClick={() => applyPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                      newRole === preset.role
                        ? 'bg-primary-500/20 border border-primary-500/40 text-amber-700'
                        : 'bg-surface-lighter border border-surface-border text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {preset.emoji} {preset.role}
                  </button>
                ))}
              </div>
            </div>

            {/* Name input */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">이름</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 세연"
                className="w-full px-3 py-2 bg-surface-lighter border border-surface-border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500/40 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">프로필 사진</label>
              <div className="flex items-center gap-3">
                {newAvatarUrl ? (
                  <img src={newAvatarUrl} alt="preview" className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: newColor }} />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-surface-lighter border-2 border-dashed border-surface-border flex items-center justify-center text-xl">
                    {newEmoji}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addFileRef.current?.click()}
                    className="text-xs px-3 py-1.5 bg-surface-lighter border border-surface-border rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors cursor-pointer"
                  >
                    사진 선택
                  </button>
                  {newAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setNewAvatarUrl('')}
                      className="text-xs px-2 py-1.5 text-red-400 hover:text-red-600 cursor-pointer"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <input
                  ref={addFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'add')
                    e.target.value = ''
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">사진이 없으면 아래 이모지가 사용됩니다</p>
            </div>

            {/* Emoji picker (fallback) */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">이모지 {newAvatarUrl ? '(사진 대체)' : ''}</label>
              <div className="flex gap-1.5 flex-wrap">
                {ALL_EMOJIS.map((emoji) => (
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
              <label className="text-xs text-gray-500 mb-1 block">색상</label>
              <div className="flex gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                      newColor === c ? 'scale-125 ring-2 ring-gray-300' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Preview + submit */}
            <div className="flex items-center gap-3 pt-1">
              <PersonAvatar person={{ id: '', name: newName || '이름', role: newRole || '역할', emoji: newEmoji, bio: '', color: newColor, avatarUrl: newAvatarUrl || undefined }} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium">{newName || '이름'}</p>
                <p className="text-xs text-gray-500">{newRole || '역할'}</p>
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
            <div key={p.id}>
              {editingId === p.id ? (
                /* ── Edit mode ── */
                <div className="bg-surface border border-amber-500/30 rounded-xl p-4 space-y-3 animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-semibold">프로필 수정</p>
                    <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer">취소</button>
                  </div>

                  {/* Name */}
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-lighter border border-surface-border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500/40"
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  />

                  {/* Role presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_PRESETS.map((preset) => (
                      <button
                        key={preset.role}
                        onClick={() => { setEditRole(preset.role); setEditEmoji(preset.emoji); setEditColor(preset.color) }}
                        className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
                          editRole === preset.role
                            ? 'bg-amber-100 border border-amber-300 text-amber-700'
                            : 'bg-surface-lighter border border-surface-border text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {preset.emoji} {preset.role}
                      </button>
                    ))}
                  </div>

                  {/* Photo upload */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">프로필 사진</label>
                    <div className="flex items-center gap-3">
                      {editAvatarUrl ? (
                        <img src={editAvatarUrl} alt="preview" className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: editColor }} />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-surface-lighter border-2 border-dashed border-surface-border flex items-center justify-center text-xl">
                          {editEmoji}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editFileRef.current?.click()}
                          className="text-xs px-3 py-1.5 bg-surface-lighter border border-surface-border rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors cursor-pointer"
                        >
                          사진 변경
                        </button>
                        {editAvatarUrl && (
                          <button type="button" onClick={() => setEditAvatarUrl('')} className="text-xs px-2 py-1.5 text-red-400 hover:text-red-600 cursor-pointer">삭제</button>
                        )}
                      </div>
                      <input
                        ref={editFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, 'edit')
                          e.target.value = ''
                        }}
                      />
                    </div>
                  </div>

                  {/* Emoji picker */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">이모지 {editAvatarUrl ? '(사진 대체)' : ''}</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {ALL_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setEditEmoji(emoji)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all cursor-pointer ${
                            editEmoji === emoji
                              ? 'bg-amber-100 border-2 border-amber-400 scale-110'
                              : 'bg-surface-lighter border border-surface-border hover:border-gray-400'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color picker */}
                  <div className="flex gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                          editColor === c ? 'scale-125 ring-2 ring-gray-300' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  {/* Preview + save */}
                  <div className="flex items-center gap-3 pt-1">
                    <PersonAvatar person={{ id: '', name: editName, role: editRole, emoji: editEmoji, bio: '', color: editColor, avatarUrl: editAvatarUrl || undefined }} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium">{editName}</p>
                      <p className="text-xs text-gray-500">{editRole}</p>
                    </div>
                    <button
                      onClick={saveEdit}
                      disabled={!editName.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Display mode ── */
                <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg group">
                  <PersonAvatar person={p} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.role}</p>
                  </div>
                  <button
                    onClick={() => startEdit(p)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded transition-all cursor-pointer"
                  >
                    수정
                  </button>
                </div>
              )}
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
                    <p className="text-sm text-gray-900">{m.displayName ?? m.email ?? '알 수 없음'}</p>
                    {m.email && <p className="text-xs text-gray-500">{m.email}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => approveMember(m.id)}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
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
                <p className="text-sm text-gray-900 truncate">{m.displayName ?? m.email ?? '알 수 없음'}</p>
              </div>
              {m.role === 'admin' && (
                <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full border border-primary-500/30">
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

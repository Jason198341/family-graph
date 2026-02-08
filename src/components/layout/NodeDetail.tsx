import { useState, useEffect, useCallback } from 'react'
import { useGraphStore } from '@/stores/graphStore'
import type { NodeCategory } from '@/types'

const categoryLabels: Record<NodeCategory, string> = {
  person: '인물',
  interest: '관심 분야',
  value: '가치',
  event: '이벤트',
  goal: '목표',
  book: '책',
}

const categoryBadgeColors: Record<NodeCategory, string> = {
  person: 'bg-primary-500/15 text-primary-300 border-primary-500/30',
  interest: 'bg-accent-500/15 text-accent-300 border-accent-500/30',
  value: 'bg-warm-500/15 text-warm-300 border-warm-500/30',
  event: 'bg-growth-500/15 text-growth-300 border-growth-500/30',
  goal: 'bg-primary-400/15 text-primary-200 border-primary-400/30',
  book: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
}

const interestCategories = ['career', 'fitness', 'education', 'hobby', 'social'] as const
const practiceFrequencies = ['daily', 'weekly', 'monthly'] as const
const impactOptions = ['positive', 'neutral', 'challenge'] as const

const catLabel: Record<string, string> = {
  career: '커리어', fitness: '피트니스', education: '교육', hobby: '취미', social: '소셜',
}
const freqLabel: Record<string, string> = {
  daily: '매일', weekly: '매주', monthly: '매월',
}
const impactLabel: Record<string, string> = {
  positive: '긍정적', neutral: '보통', challenge: '도전적',
}

const inputCls = 'w-full px-3 py-1.5 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none'
const selectCls = 'w-full px-3 py-1.5 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 focus:border-primary-500/50 focus:outline-none'

export default function NodeDetail() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const selectNode = useGraphStore((s) => s.selectNode)
  const getNodeById = useGraphStore((s) => s.getNodeById)
  const getRelatedNodes = useGraphStore((s) => s.getRelatedNodes)
  const updateEntity = useGraphStore((s) => s.updateEntity)
  const removePerson = useGraphStore((s) => s.removePerson)
  const removeInterest = useGraphStore((s) => s.removeInterest)
  const removeValue = useGraphStore((s) => s.removeValue)
  const removeEvent = useGraphStore((s) => s.removeEvent)
  const removeGoal = useGraphStore((s) => s.removeGoal)
  const removeBook = useGraphStore((s) => s.removeBook)
  const addToast = useGraphStore((s) => s.addToast)

  const [visible, setVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset edit state when node changes
  useEffect(() => {
    if (selectedNodeId) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
    setIsEditing(false)
    setEditForm({})
    setShowDeleteConfirm(false)
  }, [selectedNodeId])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(() => selectNode(null), 200)
  }, [selectNode])

  if (!selectedNodeId) return null

  const node = getNodeById(selectedNodeId)
  if (!node) return null

  const { category, data } = node
  const related = getRelatedNodes(selectedNodeId)

  const name = (data.name as string | undefined) ?? (data.title as string | undefined) ?? selectedNodeId
  const emoji = (data.emoji as string | undefined) ?? '📌'
  const description = (data.description as string | undefined) ?? (data.bio as string | undefined) ?? ''
  const color = (data.color as string | undefined) ?? '#3b82f6'

  const setField = (key: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }))
  }

  const startEditing = () => {
    // Pre-populate form with current data
    const form: Record<string, string> = {}
    for (const [k, v] of Object.entries(data)) {
      if (k === 'id') continue
      if (typeof v === 'string') form[k] = v
      else if (typeof v === 'number') form[k] = String(v)
    }
    setEditForm(form)
    setIsEditing(true)
  }

  const handleSave = () => {
    const updates: Record<string, unknown> = {}

    switch (category) {
      case 'person':
        if (editForm.name?.trim()) updates.name = editForm.name.trim()
        if (editForm.role !== undefined) updates.role = editForm.role.trim()
        if (editForm.emoji !== undefined) updates.emoji = editForm.emoji.trim()
        if (editForm.bio !== undefined) updates.bio = editForm.bio.trim()
        if (editForm.color !== undefined) updates.color = editForm.color
        break
      case 'interest':
        if (editForm.name?.trim()) updates.name = editForm.name.trim()
        if (editForm.category) updates.category = editForm.category
        if (editForm.emoji !== undefined) updates.emoji = editForm.emoji.trim()
        if (editForm.description !== undefined) updates.description = editForm.description.trim()
        break
      case 'value':
        if (editForm.name?.trim()) updates.name = editForm.name.trim()
        if (editForm.emoji !== undefined) updates.emoji = editForm.emoji.trim()
        if (editForm.description !== undefined) updates.description = editForm.description.trim()
        if (editForm.practiceFrequency) updates.practiceFrequency = editForm.practiceFrequency
        break
      case 'event':
        if (editForm.title?.trim()) updates.title = editForm.title.trim()
        if (editForm.description !== undefined) updates.description = editForm.description.trim()
        if (editForm.date) updates.date = editForm.date
        if (editForm.emoji !== undefined) updates.emoji = editForm.emoji.trim()
        if (editForm.impact) updates.impact = editForm.impact
        break
      case 'goal':
        if (editForm.title?.trim()) updates.title = editForm.title.trim()
        if (editForm.description !== undefined) updates.description = editForm.description.trim()
        if (editForm.targetDate) updates.targetDate = editForm.targetDate
        if (editForm.emoji !== undefined) updates.emoji = editForm.emoji.trim()
        if (editForm.progress !== undefined) {
          const p = parseInt(editForm.progress, 10)
          if (!isNaN(p)) updates.progress = Math.min(100, Math.max(0, p))
        }
        break
      case 'book':
        if (editForm.title?.trim()) updates.title = editForm.title.trim()
        if (editForm.author !== undefined) updates.author = editForm.author.trim()
        if (editForm.emoji !== undefined) updates.emoji = editForm.emoji.trim()
        if (editForm.totalPages) {
          const n = parseInt(editForm.totalPages, 10)
          if (!isNaN(n)) updates.totalPages = n
        }
        break
    }

    if (Object.keys(updates).length > 0) {
      updateEntity(category, selectedNodeId, updates)
      addToast('수정 완료', 'success')
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    const removeFn: Record<NodeCategory, (id: string) => void> = {
      person: removePerson,
      interest: removeInterest,
      value: removeValue,
      event: removeEvent,
      goal: removeGoal,
      book: removeBook,
    }
    removeFn[category](selectedNodeId)
    addToast(`${emoji} ${name} 삭제됨`, 'info')
    setShowDeleteConfirm(false)
    handleClose()
  }

  // Collect extra meta info for display
  const metaEntries: { label: string; value: string; field: string }[] = []
  if (data.role) metaEntries.push({ label: '역할', value: data.role as string, field: 'role' })
  if (data.category) metaEntries.push({ label: '카테고리', value: catLabel[data.category as string] ?? (data.category as string), field: 'category' })
  if (data.practiceFrequency) metaEntries.push({ label: '실천 빈도', value: freqLabel[data.practiceFrequency as string] ?? (data.practiceFrequency as string), field: 'practiceFrequency' })
  if (data.date) metaEntries.push({ label: '날짜', value: data.date as string, field: 'date' })
  if (data.impact) metaEntries.push({ label: '영향', value: impactLabel[data.impact as string] ?? (data.impact as string), field: 'impact' })
  if (data.targetDate) metaEntries.push({ label: '목표일', value: data.targetDate as string, field: 'targetDate' })
  if (data.progress !== undefined) metaEntries.push({ label: '진행률', value: `${data.progress}%`, field: 'progress' })
  if (data.author) metaEntries.push({ label: '저자', value: data.author as string, field: 'author' })
  if (data.totalPages) metaEntries.push({ label: '페이지', value: `${data.totalPages}p`, field: 'totalPages' })
  if (data.linesPerPage) metaEntries.push({ label: '줄/페이지', value: `${data.linesPerPage}줄`, field: 'linesPerPage' })

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-surface-light border-l border-surface-border z-50 flex flex-col transition-transform duration-200 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ boxShadow: '-8px 0 32px rgba(0,0,0,0.3)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryBadgeColors[category]}`}>
            {categoryLabels[category]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isEditing ? (
            <button
              onClick={startEditing}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-hover text-gray-400 hover:text-primary-400 transition-colors cursor-pointer"
              title="수정"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 border border-primary-500/40 transition-colors cursor-pointer"
              >
                저장
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-300 border border-surface-border hover:bg-surface-hover transition-colors cursor-pointer"
              >
                취소
              </button>
            </>
          )}
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-hover text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Main identity */}
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
            style={{ borderColor: isEditing ? editForm.color || color : color, backgroundColor: `${isEditing ? editForm.color || color : color}12` }}
          >
            {isEditing ? (
              <input
                value={editForm.emoji ?? emoji}
                onChange={(e) => setField('emoji', e.target.value)}
                className="w-10 bg-transparent text-center text-2xl outline-none"
                maxLength={4}
              />
            ) : emoji}
          </div>
          <div className="w-full">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  value={editForm.name ?? editForm.title ?? name}
                  onChange={(e) => setField(category === 'event' || category === 'goal' ? 'title' : 'name', e.target.value)}
                  className={inputCls + ' text-center font-bold'}
                  placeholder="이름"
                />
                {(category === 'person') && (
                  <input
                    value={editForm.bio ?? ''}
                    onChange={(e) => setField('bio', e.target.value)}
                    className={inputCls + ' text-center text-xs'}
                    placeholder="소개"
                  />
                )}
                {(category === 'interest' || category === 'value' || category === 'event') && (
                  <input
                    value={editForm.description ?? ''}
                    onChange={(e) => setField('description', e.target.value)}
                    className={inputCls + ' text-center text-xs'}
                    placeholder="설명"
                  />
                )}
                {category === 'goal' && (
                  <input
                    value={editForm.description ?? ''}
                    onChange={(e) => setField('description', e.target.value)}
                    className={inputCls + ' text-center text-xs'}
                    placeholder="설명"
                  />
                )}
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-white">{name}</h2>
                {description && (
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[240px] mx-auto">{description}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Edit fields per category */}
        {isEditing && (
          <div className="space-y-2.5 bg-surface-lighter rounded-xl p-3">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">필드 수정</h3>

            {category === 'person' && (
              <>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">역할</label>
                  <input value={editForm.role ?? ''} onChange={(e) => setField('role', e.target.value)} className={inputCls} placeholder="아빠, 엄마..." />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">색상</label>
                  <input type="color" value={editForm.color || '#3b82f6'} onChange={(e) => setField('color', e.target.value)} className="w-full h-8 rounded-lg border border-surface-border cursor-pointer bg-transparent" />
                </div>
              </>
            )}

            {category === 'interest' && (
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">카테고리</label>
                <select value={editForm.category ?? 'hobby'} onChange={(e) => setField('category', e.target.value)} className={selectCls}>
                  {interestCategories.map((c) => <option key={c} value={c}>{catLabel[c]}</option>)}
                </select>
              </div>
            )}

            {category === 'value' && (
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">실천 빈도</label>
                <select value={editForm.practiceFrequency ?? 'weekly'} onChange={(e) => setField('practiceFrequency', e.target.value)} className={selectCls}>
                  {practiceFrequencies.map((f) => <option key={f} value={f}>{freqLabel[f]}</option>)}
                </select>
              </div>
            )}

            {category === 'event' && (
              <>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">날짜</label>
                  <input type="date" value={editForm.date ?? ''} onChange={(e) => setField('date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">영향</label>
                  <select value={editForm.impact ?? 'positive'} onChange={(e) => setField('impact', e.target.value)} className={selectCls}>
                    {impactOptions.map((i) => <option key={i} value={i}>{impactLabel[i]}</option>)}
                  </select>
                </div>
              </>
            )}

            {category === 'goal' && (
              <>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">목표일</label>
                  <input type="date" value={editForm.targetDate ?? ''} onChange={(e) => setField('targetDate', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">진행률</label>
                  <input type="number" min={0} max={100} value={editForm.progress ?? '0'} onChange={(e) => setField('progress', e.target.value)} className={inputCls} />
                </div>
              </>
            )}

            {category === 'book' && (
              <>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">저자</label>
                  <input value={editForm.author ?? ''} onChange={(e) => setField('author', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">총 페이지</label>
                  <input type="number" value={editForm.totalPages ?? ''} onChange={(e) => setField('totalPages', e.target.value)} className={inputCls} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Goal progress bar (read mode only) */}
        {!isEditing && category === 'goal' && data.progress !== undefined && (
          <div className="bg-surface-lighter rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">진행률</span>
              <span className="text-sm font-bold text-primary-400">{data.progress as number}%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${data.progress as number}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}50`,
                }}
              />
            </div>
          </div>
        )}

        {/* Meta info (read mode) */}
        {!isEditing && metaEntries.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">정보</h3>
            <div className="bg-surface-lighter rounded-xl divide-y divide-surface-border overflow-hidden">
              {metaEntries.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs text-gray-300 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related nodes */}
        <div className="space-y-2">
          <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            연결된 노드 ({related.length})
          </h3>
          {related.length === 0 ? (
            <p className="text-xs text-gray-600 py-3 text-center">연결된 노드가 없습니다</p>
          ) : (
            <div className="space-y-1.5">
              {related.map((rel) => {
                const rName = (rel.data.name as string | undefined) ?? (rel.data.title as string | undefined) ?? ''
                const rEmoji = (rel.data.emoji as string | undefined) ?? '📌'
                const rId = rel.data.id as string
                return (
                  <button
                    key={rId}
                    onClick={() => selectNode(rId)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-lighter hover:bg-surface-hover border border-transparent hover:border-surface-border transition-all cursor-pointer text-left"
                  >
                    <span className="text-base">{rEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-200 truncate">{rName}</p>
                      <p className="text-[9px] text-gray-500">{categoryLabels[rel.category]}</p>
                    </div>
                    <svg className="w-3.5 h-3.5 text-gray-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Delete button */}
        <div className="pt-3 border-t border-surface-border space-y-3">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-2 rounded-xl text-xs font-medium text-red-400/70 border border-red-500/20 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40 transition-all cursor-pointer"
            >
              노드 삭제
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-2">
              <p className="text-xs text-red-300 text-center">
                <strong>{emoji} {name}</strong>을(를) 삭제하시겠습니까?
                <br />
                <span className="text-red-400/60">연결된 관계도 함께 삭제됩니다.</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors cursor-pointer"
                >
                  삭제
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-3 py-1.5 text-gray-400 border border-surface-border rounded-lg text-xs hover:text-gray-300 hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>
          )}
          <p className="text-[9px] text-gray-700 font-mono truncate" title={selectedNodeId}>
            ID: {selectedNodeId}
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
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

export default function NodeDetail() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const selectNode = useGraphStore((s) => s.selectNode)
  const getNodeById = useGraphStore((s) => s.getNodeById)
  const getRelatedNodes = useGraphStore((s) => s.getRelatedNodes)
  const updateGoalProgress = useGraphStore((s) => s.updateGoalProgress)
  const addToast = useGraphStore((s) => s.addToast)

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (selectedNodeId) {
      // Trigger slide-in
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [selectedNodeId])

  if (!selectedNodeId) return null

  const node = getNodeById(selectedNodeId)
  if (!node) return null

  const { category, data } = node
  const related = getRelatedNodes(selectedNodeId)

  const name = (data.name as string | undefined) ?? (data.title as string | undefined) ?? selectedNodeId
  const emoji = (data.emoji as string | undefined) ?? '📌'
  const description = (data.description as string | undefined) ?? (data.bio as string | undefined) ?? ''
  const color = (data.color as string | undefined) ?? '#3b82f6'

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => selectNode(null), 200)
  }

  const handleStartEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue)
  }

  const handleSaveEdit = () => {
    if (!editingField) return

    // For goal progress editing
    if (editingField === 'progress' && category === 'goal') {
      const val = parseInt(editValue, 10)
      if (!isNaN(val)) {
        updateGoalProgress(selectedNodeId, val)
        addToast('진행률이 업데이트되었습니다', 'success')
      }
    }

    setEditingField(null)
    setEditValue('')
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit()
    if (e.key === 'Escape') setEditingField(null)
  }

  // Collect extra meta info for display
  const metaEntries: { label: string; value: string }[] = []
  if (data.role) metaEntries.push({ label: '역할', value: data.role as string })
  if (data.category) metaEntries.push({ label: '카테고리', value: data.category as string })
  if (data.practiceFrequency) metaEntries.push({ label: '실천 빈도', value: data.practiceFrequency as string })
  if (data.date) metaEntries.push({ label: '날짜', value: data.date as string })
  if (data.impact) metaEntries.push({ label: '영향', value: data.impact as string })
  if (data.targetDate) metaEntries.push({ label: '목표일', value: data.targetDate as string })
  if (data.progress !== undefined) metaEntries.push({ label: '진행률', value: `${data.progress}%` })
  if (data.author) metaEntries.push({ label: '저자', value: data.author as string })
  if (data.totalPages) metaEntries.push({ label: '페이지', value: `${data.totalPages}p` })
  if (data.linesPerPage) metaEntries.push({ label: '줄/페이지', value: `${data.linesPerPage}줄` })

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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Main identity */}
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
            style={{ borderColor: color, backgroundColor: `${color}12` }}
          >
            {emoji}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{name}</h2>
            {description && (
              <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[240px]">{description}</p>
            )}
          </div>
        </div>

        {/* Goal progress editor */}
        {category === 'goal' && data.progress !== undefined && (
          <div className="bg-surface-lighter rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">진행률</span>
              {editingField === 'progress' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={handleSaveEdit}
                    className="w-16 bg-surface border border-surface-border rounded-lg px-2 py-1 text-xs text-white text-center outline-none focus:border-primary-500"
                    autoFocus
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              ) : (
                <button
                  onClick={() => handleStartEdit('progress', String(data.progress))}
                  className="text-sm font-bold text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
                >
                  {data.progress as number}%
                </button>
              )}
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

        {/* Meta info */}
        {metaEntries.length > 0 && (
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

        {/* Node ID (subtle) */}
        <div className="pt-3 border-t border-surface-border">
          <p className="text-[9px] text-gray-700 font-mono truncate" title={selectedNodeId}>
            ID: {selectedNodeId}
          </p>
        </div>
      </div>
    </div>
  )
}

import { useMemo, useCallback, useEffect, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  useViewport,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react'
import { useGraphStore } from '@/stores/graphStore'
import { elkLayout } from '@/lib/elkLayout'
import PersonNode from '@/components/graph/nodes/PersonNode'
import InterestNode from '@/components/graph/nodes/InterestNode'
import ValueNode from '@/components/graph/nodes/ValueNode'
import EventNode from '@/components/graph/nodes/EventNode'
import GoalNode from '@/components/graph/nodes/GoalNode'
import BookNode from '@/components/graph/nodes/BookNode'

const nodeTypes = {
  custom: PersonNode, // fallback
  personNode: PersonNode,
  interestNode: InterestNode,
  valueNode: ValueNode,
  eventNode: EventNode,
  goalNode: GoalNode,
  bookNode: BookNode,
}

type NodeTypeKey = 'person' | 'interest' | 'value' | 'event' | 'goal' | 'book'
const nodeTypeOptions: { key: NodeTypeKey; label: string; emoji: string; color: string }[] = [
  { key: 'person', label: '인물', emoji: '👤', color: '#3b82f6' },
  { key: 'interest', label: '관심', emoji: '💡', color: '#d946ef' },
  { key: 'value', label: '가치', emoji: '💎', color: '#f97316' },
  { key: 'event', label: '이벤트', emoji: '📅', color: '#22c55e' },
  { key: 'goal', label: '목표', emoji: '🎯', color: '#60a5fa' },
  { key: 'book', label: '책', emoji: '📚', color: '#a855f7' },
]

const interestCategories = ['career', 'fitness', 'education', 'hobby', 'social'] as const
const practiceFrequencies = ['daily', 'weekly', 'monthly'] as const
const impactOptions = ['positive', 'neutral', 'challenge'] as const

const categoryLabel: Record<string, string> = {
  career: '커리어', fitness: '피트니스', education: '교육', hobby: '취미', social: '소셜',
}
const frequencyLabel: Record<string, string> = {
  daily: '매일', weekly: '매주', monthly: '매월',
}
const impactLabel: Record<string, string> = {
  positive: '긍정적', neutral: '보통', challenge: '도전적',
}

const minimapColors: Record<string, string> = {
  personNode: '#3b82f6',
  interestNode: '#d946ef',
  valueNode: '#f97316',
  eventNode: '#22c55e',
  goalNode: '#60a5fa',
  bookNode: '#a855f7',
  custom: '#64748b',
}

/** Category zone styling for group backgrounds */
const GROUP_ZONE: Record<string, { label: string; color: string }> = {
  person:   { label: 'People',    color: '#3b82f6' },
  interest: { label: 'Interests', color: '#d946ef' },
  value:    { label: 'Values',    color: '#f97316' },
  event:    { label: 'Events',    color: '#22c55e' },
  goal:     { label: 'Goals',     color: '#60a5fa' },
  book:     { label: 'Books',     color: '#a855f7' },
}

/** Node sizes (must match elkLayout.ts for consistency) */
const NODE_SIZE: Record<string, { w: number; h: number }> = {
  person:   { w: 100, h: 100 },
  interest: { w: 140, h: 56 },
  value:    { w: 140, h: 60 },
  event:    { w: 150, h: 60 },
  goal:     { w: 110, h: 110 },
  book:     { w: 120, h: 80 },
}

interface GroupBounds {
  category: string
  x: number; y: number; w: number; h: number
  color: string; label: string
}

function computeGroupBounds(nodes: Node[]): GroupBounds[] {
  const groups: Record<string, Node[]> = {}
  for (const node of nodes) {
    const cat = (node.data as Record<string, unknown>).category as string
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(node)
  }

  const PAD = 40
  const bounds: GroupBounds[] = []

  for (const [cat, catNodes] of Object.entries(groups)) {
    const zone = GROUP_ZONE[cat]
    if (!zone || catNodes.length === 0) continue
    const dim = NODE_SIZE[cat] ?? { w: 140, h: 60 }

    const xs = catNodes.map((n) => n.position.x)
    const ys = catNodes.map((n) => n.position.y)

    bounds.push({
      category: cat,
      x: Math.min(...xs) - PAD,
      y: Math.min(...ys) - PAD - 20,
      w: Math.max(...xs) - Math.min(...xs) + dim.w + PAD * 2,
      h: Math.max(...ys) - Math.min(...ys) + dim.h + PAD * 2 + 20,
      color: zone.color,
      label: zone.label,
    })
  }

  return bounds
}

function buildEdges(rawEdges: Edge[]): Edge[] {
  return rawEdges.map((edge) => {
    const strokeColor = (edge.style?.stroke as string) ?? '#64748b'
    const isFamily = (edge.style?.strokeDasharray as string | undefined) === '6 3'
    return {
      ...edge,
      type: 'default',
      animated: edge.animated ?? false,
      style: {
        stroke: strokeColor,
        strokeWidth: isFamily ? 1 : 1.5,
        strokeDasharray: isFamily ? '6 3' : undefined,
        opacity: 0.55,
      },
      labelStyle: {
        fill: '#9ca3af',
        fontSize: 9,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: '#0f1420',
        fillOpacity: 0.9,
      },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    }
  })
}

/** Group zone backgrounds rendered in the ReactFlow viewport coordinate system */
function GroupZones({ bounds }: { bounds: GroupBounds[] }) {
  const { x, y, zoom } = useViewport()
  if (bounds.length === 0) return null
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        {bounds.map((b) => (
          <g key={b.category}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={16}
              fill={b.color}
              fillOpacity={0.04}
              stroke={b.color}
              strokeOpacity={0.1}
              strokeWidth={1}
            />
            <text
              x={b.x + 12}
              y={b.y + 16}
              fill={b.color}
              fillOpacity={0.35}
              fontSize={11}
              fontWeight={600}
              fontFamily="Pretendard, sans-serif"
            >
              {b.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}

function KnowledgeGraphInner() {
  // Subscribe to actual data arrays so we re-render when entities change
  const persons = useGraphStore((s) => s.persons)
  const interests = useGraphStore((s) => s.interests)
  const values = useGraphStore((s) => s.values)
  const events = useGraphStore((s) => s.events)
  const goals = useGraphStore((s) => s.goals)
  const books = useGraphStore((s) => s.books)
  const relations = useGraphStore((s) => s.relations)
  const getAllGraphNodes = useGraphStore((s) => s.getAllGraphNodes)
  const getAllGraphEdges = useGraphStore((s) => s.getAllGraphEdges)
  const selectNode = useGraphStore((s) => s.selectNode)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const addPerson = useGraphStore((s) => s.addPerson)
  const addInterest = useGraphStore((s) => s.addInterest)
  const addValue = useGraphStore((s) => s.addValue)
  const addEvent = useGraphStore((s) => s.addEvent)
  const addGoal = useGraphStore((s) => s.addGoal)
  const addBook = useGraphStore((s) => s.addBook)
  const addToast = useGraphStore((s) => s.addToast)

  // Add-node UI state
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [addingType, setAddingType] = useState<NodeTypeKey | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  const resetAddForm = useCallback(() => {
    setAddingType(null)
    setShowTypeMenu(false)
    setForm({})
  }, [])

  const setField = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleAddSubmit = useCallback(() => {
    if (!addingType) return
    try {
      switch (addingType) {
        case 'person':
          if (!form.name?.trim()) { addToast('이름을 입력하세요', 'error'); return }
          addPerson({
            name: form.name.trim(),
            role: form.role?.trim() || '가족',
            emoji: form.emoji?.trim() || '👤',
            bio: form.bio?.trim() || '',
            color: form.color?.trim() || '#3b82f6',
          })
          addToast(`${form.emoji || '👤'} ${form.name.trim()} 추가됨`, 'success')
          break
        case 'interest':
          if (!form.name?.trim()) { addToast('이름을 입력하세요', 'error'); return }
          addInterest({
            name: form.name.trim(),
            category: (form.category as 'career' | 'fitness' | 'education' | 'hobby' | 'social') || 'hobby',
            emoji: form.emoji?.trim() || '💡',
            description: form.description?.trim() || '',
          })
          addToast(`${form.emoji || '💡'} ${form.name.trim()} 추가됨`, 'success')
          break
        case 'value':
          if (!form.name?.trim()) { addToast('이름을 입력하세요', 'error'); return }
          addValue({
            name: form.name.trim(),
            emoji: form.emoji?.trim() || '💎',
            description: form.description?.trim() || '',
            practiceFrequency: (form.practiceFrequency as 'daily' | 'weekly' | 'monthly') || 'weekly',
          })
          addToast(`${form.emoji || '💎'} ${form.name.trim()} 추가됨`, 'success')
          break
        case 'event':
          if (!form.title?.trim()) { addToast('제목을 입력하세요', 'error'); return }
          addEvent({
            title: form.title.trim(),
            description: form.description?.trim() || '',
            date: form.date || new Date().toISOString().slice(0, 10),
            personIds: form.personIds ? form.personIds.split(',').filter(Boolean) : [],
            emoji: form.emoji?.trim() || '📅',
            impact: (form.impact as 'positive' | 'neutral' | 'challenge') || 'positive',
          })
          addToast(`${form.emoji || '📅'} ${form.title.trim()} 추가됨`, 'success')
          break
        case 'goal':
          if (!form.title?.trim()) { addToast('제목을 입력하세요', 'error'); return }
          addGoal({
            title: form.title.trim(),
            description: form.description?.trim() || '',
            personId: form.personId || '',
            targetDate: form.targetDate || new Date().toISOString().slice(0, 10),
            progress: 0,
            emoji: form.emoji?.trim() || '🎯',
          })
          addToast(`${form.emoji || '🎯'} ${form.title.trim()} 추가됨`, 'success')
          break
        case 'book':
          if (!form.title?.trim()) { addToast('제목을 입력하세요', 'error'); return }
          addBook({
            title: form.title.trim(),
            author: form.author?.trim() || '',
            totalPages: Number(form.totalPages) || 200,
            linesPerPage: Number(form.linesPerPage) || 15,
            emoji: form.emoji?.trim() || '📚',
            color: form.color?.trim() || '#a855f7',
          })
          addToast(`${form.emoji || '📚'} ${form.title.trim()} 추가됨`, 'success')
          break
      }
      resetAddForm()
    } catch {
      addToast('추가 중 오류가 발생했습니다', 'error')
    }
  }, [addingType, form, addPerson, addInterest, addValue, addEvent, addGoal, addBook, addToast, resetAddForm])

  const { fitView } = useReactFlow()

  const rawNodes = useMemo(() => getAllGraphNodes(), [persons, interests, values, events, goals, books, getAllGraphNodes])
  const rawEdges = useMemo(() => getAllGraphEdges(), [relations, getAllGraphEdges])
  const styledEdges = useMemo(() => buildEdges(rawEdges), [rawEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState(styledEdges)
  const [groupBounds, setGroupBounds] = useState<GroupBounds[]>([])
  const layoutVersion = useRef(0)

  // Run ELK layout whenever data changes
  useEffect(() => {
    const version = ++layoutVersion.current
    elkLayout(rawNodes, rawEdges).then((laid) => {
      if (version !== layoutVersion.current) return // stale
      setNodes(laid)
      setGroupBounds(computeGroupBounds(laid))
      setTimeout(() => fitView({ padding: 0.3, duration: 300 }), 50)
    })
  }, [rawNodes, rawEdges, setNodes, fitView])

  // Sync edges
  useEffect(() => {
    setEdges(styledEdges)
  }, [styledEdges, setEdges])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      selectNode(node.id)
    },
    [selectNode],
  )

  const handlePaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  const handleAutoLayout = useCallback(() => {
    const freshNodes = getAllGraphNodes()
    const freshEdges = getAllGraphEdges()
    elkLayout(freshNodes, freshEdges).then((laid) => {
      setNodes(laid)
      setGroupBounds(computeGroupBounds(laid))
      setTimeout(() => fitView({ padding: 0.3, duration: 300 }), 50)
    })
  }, [getAllGraphNodes, getAllGraphEdges, setNodes, fitView])

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <button
          onClick={handleAutoLayout}
          className="flex items-center gap-2 px-4 py-2 bg-surface-light/90 backdrop-blur-md border border-surface-border rounded-xl text-sm text-gray-300 hover:text-white hover:border-primary-500/50 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
          Auto Layout
        </button>

        {/* Add Node */}
        <div className="relative">
          <button
            onClick={() => { setShowTypeMenu((v) => !v); setAddingType(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500/15 backdrop-blur-md border border-primary-500/40 rounded-xl text-sm text-primary-300 hover:text-white hover:bg-primary-500/25 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            노드 추가
          </button>
          {showTypeMenu && !addingType && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-surface-light/95 backdrop-blur-md border border-surface-border rounded-xl shadow-2xl overflow-hidden">
              {nodeTypeOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setAddingType(opt.key); setShowTypeMenu(false); setForm({}) }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-surface-hover hover:text-white transition-colors cursor-pointer"
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                  <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 px-4 py-2 bg-surface-light/90 backdrop-blur-md border border-surface-border rounded-xl">
          {[
            { label: '인물', color: '#3b82f6' },
            { label: '관심', color: '#d946ef' },
            { label: '가치', color: '#f97316' },
            { label: '이벤트', color: '#22c55e' },
            { label: '목표', color: '#60a5fa' },
            { label: '책', color: '#a855f7' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Node Form Panel */}
      {addingType && (
        <div className="absolute top-16 left-4 z-20 w-80 bg-surface-light/80 backdrop-blur-md border border-surface-border rounded-2xl shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              {nodeTypeOptions.find((o) => o.key === addingType)?.emoji}
              {nodeTypeOptions.find((o) => o.key === addingType)?.label} 추가
            </h3>
            <button onClick={resetAddForm} className="text-gray-500 hover:text-gray-300 cursor-pointer text-lg leading-none">&times;</button>
          </div>
          <div className="space-y-2.5">
            {/* Person fields */}
            {addingType === 'person' && (<>
              <input placeholder="이름 *" value={form.name ?? ''} onChange={(e) => setField('name', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <input placeholder="역할 (예: 아빠, 엄마)" value={form.role ?? ''} onChange={(e) => setField('role', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <div className="flex gap-2">
                <input placeholder="이모지" value={form.emoji ?? ''} onChange={(e) => setField('emoji', e.target.value)} className="w-20 px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-center placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
                <input type="color" value={form.color || '#3b82f6'} onChange={(e) => setField('color', e.target.value)} className="w-10 h-9 rounded-lg border border-surface-border cursor-pointer bg-transparent" />
              </div>
              <input placeholder="소개" value={form.bio ?? ''} onChange={(e) => setField('bio', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
            </>)}

            {/* Interest fields */}
            {addingType === 'interest' && (<>
              <input placeholder="이름 *" value={form.name ?? ''} onChange={(e) => setField('name', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <select value={form.category ?? 'hobby'} onChange={(e) => setField('category', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 focus:border-primary-500/50 focus:outline-none">
                {interestCategories.map((c) => <option key={c} value={c}>{categoryLabel[c]}</option>)}
              </select>
              <input placeholder="이모지" value={form.emoji ?? ''} onChange={(e) => setField('emoji', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <input placeholder="설명" value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
            </>)}

            {/* Value fields */}
            {addingType === 'value' && (<>
              <input placeholder="이름 *" value={form.name ?? ''} onChange={(e) => setField('name', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <input placeholder="이모지" value={form.emoji ?? ''} onChange={(e) => setField('emoji', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <input placeholder="설명" value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <select value={form.practiceFrequency ?? 'weekly'} onChange={(e) => setField('practiceFrequency', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 focus:border-primary-500/50 focus:outline-none">
                {practiceFrequencies.map((f) => <option key={f} value={f}>{frequencyLabel[f]}</option>)}
              </select>
            </>)}

            {/* Event fields */}
            {addingType === 'event' && (<>
              <input placeholder="제목 *" value={form.title ?? ''} onChange={(e) => setField('title', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <input placeholder="설명" value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <input type="date" value={form.date ?? new Date().toISOString().slice(0, 10)} onChange={(e) => setField('date', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 focus:border-primary-500/50 focus:outline-none" />
              {persons.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-gray-400">관련 인물</span>
                  <div className="flex flex-wrap gap-1.5">
                    {persons.map((p) => {
                      const selected = (form.personIds ?? '').split(',').includes(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const ids = (form.personIds ?? '').split(',').filter(Boolean)
                            setField('personIds', selected ? ids.filter((i) => i !== p.id).join(',') : [...ids, p.id].join(','))
                          }}
                          className={`px-2 py-1 rounded-md text-xs cursor-pointer transition-colors ${selected ? 'bg-primary-500/30 text-primary-200 border border-primary-500/50' : 'bg-surface/60 text-gray-400 border border-surface-border hover:text-gray-300'}`}
                        >
                          {p.emoji} {p.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <input placeholder="이모지" value={form.emoji ?? ''} onChange={(e) => setField('emoji', e.target.value)} className="w-20 px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-center placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
                <select value={form.impact ?? 'positive'} onChange={(e) => setField('impact', e.target.value)} className="flex-1 px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 focus:border-primary-500/50 focus:outline-none">
                  {impactOptions.map((i) => <option key={i} value={i}>{impactLabel[i]}</option>)}
                </select>
              </div>
            </>)}

            {/* Goal fields */}
            {addingType === 'goal' && (<>
              <input placeholder="제목 *" value={form.title ?? ''} onChange={(e) => setField('title', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <input placeholder="설명" value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              {persons.length > 0 && (
                <select value={form.personId ?? ''} onChange={(e) => setField('personId', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 focus:border-primary-500/50 focus:outline-none">
                  <option value="">담당자 선택</option>
                  {persons.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                </select>
              )}
              <input type="date" value={form.targetDate ?? new Date().toISOString().slice(0, 10)} onChange={(e) => setField('targetDate', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 focus:border-primary-500/50 focus:outline-none" />
              <input placeholder="이모지" value={form.emoji ?? ''} onChange={(e) => setField('emoji', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
            </>)}

            {/* Book fields */}
            {addingType === 'book' && (<>
              <input placeholder="제목 *" value={form.title ?? ''} onChange={(e) => setField('title', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <input placeholder="저자" value={form.author ?? ''} onChange={(e) => setField('author', e.target.value)} className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              <div className="flex gap-2">
                <input type="number" placeholder="페이지수" value={form.totalPages ?? ''} onChange={(e) => setField('totalPages', e.target.value)} className="flex-1 px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
                <input type="number" placeholder="줄수/p" value={form.linesPerPage ?? ''} onChange={(e) => setField('linesPerPage', e.target.value)} className="flex-1 px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <input placeholder="이모지" value={form.emoji ?? ''} onChange={(e) => setField('emoji', e.target.value)} className="w-20 px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-sm text-center placeholder-gray-500 focus:border-primary-500/50 focus:outline-none" />
                <input type="color" value={form.color || '#a855f7'} onChange={(e) => setField('color', e.target.value)} className="w-10 h-9 rounded-lg border border-surface-border cursor-pointer bg-transparent" />
              </div>
            </>)}

            {/* Submit / Cancel */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAddSubmit}
                className="flex-1 px-4 py-2 bg-primary-500/20 text-primary-300 border border-primary-500/40 rounded-lg text-sm hover:bg-primary-500/30 hover:text-white transition-colors cursor-pointer font-medium"
              >
                추가
              </button>
              <button
                onClick={resetAddForm}
                className="px-4 py-2 text-gray-400 border border-surface-border rounded-lg text-sm hover:text-gray-300 hover:bg-surface-hover transition-colors cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected node indicator */}
      {selectedNodeId && (
        <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-primary-500/15 border border-primary-500/30 rounded-lg text-xs text-primary-300">
          선택됨: {selectedNodeId}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-surface"
      >
        <GroupZones bounds={groupBounds} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.04)"
        />
        <Controls
          position="bottom-right"
          className="!bg-surface-light !border-surface-border !rounded-xl !shadow-2xl [&>button]:!bg-surface-lighter [&>button]:!border-surface-border [&>button]:!text-gray-400 [&>button:hover]:!bg-surface-hover [&>button:hover]:!text-white [&>button>svg]:!fill-current"
        />
        <MiniMap
          position="bottom-left"
          className="!bg-surface-light !border-surface-border !rounded-xl"
          nodeColor={(node) => minimapColors[node.type ?? 'custom'] ?? '#64748b'}
          maskColor="rgba(6,8,15,0.75)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}

export default function KnowledgeGraph() {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner />
    </ReactFlowProvider>
  )
}

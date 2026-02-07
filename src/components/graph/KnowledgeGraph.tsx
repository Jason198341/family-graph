import { useMemo, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react'
import { useGraphStore } from '@/stores/graphStore'
import PersonNode from '@/components/graph/nodes/PersonNode'
import InterestNode from '@/components/graph/nodes/InterestNode'
import ValueNode from '@/components/graph/nodes/ValueNode'
import EventNode from '@/components/graph/nodes/EventNode'
import GoalNode from '@/components/graph/nodes/GoalNode'

const nodeTypes = {
  custom: PersonNode, // fallback
  personNode: PersonNode,
  interestNode: InterestNode,
  valueNode: ValueNode,
  eventNode: EventNode,
  goalNode: GoalNode,
}

const categoryToNodeType: Record<string, string> = {
  person: 'personNode',
  interest: 'interestNode',
  value: 'valueNode',
  event: 'eventNode',
  goal: 'goalNode',
}

const minimapColors: Record<string, string> = {
  personNode: '#3b82f6',
  interestNode: '#d946ef',
  valueNode: '#f97316',
  eventNode: '#22c55e',
  goalNode: '#60a5fa',
  custom: '#64748b',
}

function autoLayout(rawNodes: Node[]): Node[] {
  // Group nodes by category for a nice clustered layout
  const groups: Record<string, Node[]> = {}
  for (const node of rawNodes) {
    const cat = (node.data as Record<string, unknown>).category as string
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(node)
  }

  const categoryOrder = ['person', 'interest', 'value', 'event', 'goal']
  const centerX = 500
  const centerY = 400
  const ringRadius: Record<string, number> = {
    person: 0,
    interest: 280,
    value: 280,
    event: 450,
    goal: 450,
  }
  const ringAngleStart: Record<string, number> = {
    person: 0,
    interest: -Math.PI / 3,
    value: Math.PI / 3,
    event: -Math.PI / 2,
    goal: Math.PI / 2,
  }

  const result: Node[] = []

  for (const cat of categoryOrder) {
    const nodesInGroup = groups[cat] ?? []
    const r = ringRadius[cat] ?? 300
    const startAngle = ringAngleStart[cat] ?? 0
    const spread = nodesInGroup.length > 1 ? Math.PI / 3 : 0

    nodesInGroup.forEach((node, idx) => {
      const fraction = nodesInGroup.length > 1 ? idx / (nodesInGroup.length - 1) : 0.5
      const angle = startAngle - spread / 2 + fraction * spread

      // Person nodes in center cluster
      if (cat === 'person') {
        const pAngle = (2 * Math.PI * idx) / Math.max(nodesInGroup.length, 1) - Math.PI / 2
        const pRadius = nodesInGroup.length > 1 ? 120 : 0
        result.push({
          ...node,
          type: categoryToNodeType[cat] ?? 'custom',
          position: {
            x: centerX + pRadius * Math.cos(pAngle),
            y: centerY + pRadius * Math.sin(pAngle),
          },
        })
      } else {
        result.push({
          ...node,
          type: categoryToNodeType[cat] ?? 'custom',
          position: {
            x: centerX + r * Math.cos(angle),
            y: centerY + r * Math.sin(angle),
          },
        })
      }
    })
  }

  return result
}

function buildEdges(rawEdges: Edge[]): Edge[] {
  return rawEdges.map((edge) => ({
    ...edge,
    type: 'default',
    animated: (edge.style?.strokeWidth as number ?? 1) >= 2,
    style: {
      ...(edge.style ?? {}),
      stroke: (edge.style?.stroke as string) ?? '#64748b',
      strokeWidth: Math.max(1, (edge.style?.strokeWidth as number) ?? 1),
    },
    labelStyle: {
      fill: '#9ca3af',
      fontSize: 10,
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: '#0f1420',
      fillOpacity: 0.85,
    },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
  }))
}

export default function KnowledgeGraph() {
  // Subscribe to actual data arrays so we re-render when entities change
  const persons = useGraphStore((s) => s.persons)
  const interests = useGraphStore((s) => s.interests)
  const values = useGraphStore((s) => s.values)
  const events = useGraphStore((s) => s.events)
  const goals = useGraphStore((s) => s.goals)
  const relations = useGraphStore((s) => s.relations)
  const getAllGraphNodes = useGraphStore((s) => s.getAllGraphNodes)
  const getAllGraphEdges = useGraphStore((s) => s.getAllGraphEdges)
  const selectNode = useGraphStore((s) => s.selectNode)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)

  const rawNodes = useMemo(() => getAllGraphNodes(), [persons, interests, values, events, goals, getAllGraphNodes])
  const rawEdges = useMemo(() => getAllGraphEdges(), [relations, getAllGraphEdges])

  const layoutedNodes = useMemo(() => autoLayout(rawNodes), [rawNodes])
  const styledEdges = useMemo(() => buildEdges(rawEdges), [rawEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(styledEdges)

  // Sync store changes → xyflow internal state
  useEffect(() => {
    setNodes(layoutedNodes)
  }, [layoutedNodes, setNodes])

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
    const laid = autoLayout(freshNodes)
    setNodes(laid)
  }, [getAllGraphNodes, setNodes])

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

        {/* Legend */}
        <div className="flex items-center gap-3 px-4 py-2 bg-surface-light/90 backdrop-blur-md border border-surface-border rounded-xl">
          {[
            { label: '인물', color: '#3b82f6' },
            { label: '관심', color: '#d946ef' },
            { label: '가치', color: '#f97316' },
            { label: '이벤트', color: '#22c55e' },
            { label: '목표', color: '#60a5fa' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

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

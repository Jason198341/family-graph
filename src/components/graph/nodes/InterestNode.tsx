import { type NodeProps } from '@xyflow/react'
import type { GraphNodeData } from '@/types'
import { BiHandles } from './BiHandles'

const categoryColors: Record<string, string> = {
  career: '#f59e0b',
  fitness: '#22c55e',
  education: '#3b82f6',
  hobby: '#d946ef',
  social: '#fb923c',
}

export default function InterestNode({ data, selected }: NodeProps) {
  const d = data as unknown as GraphNodeData
  const category = (d.meta?.category as string) ?? 'hobby'
  const catColor = categoryColors[category] ?? '#d946ef'

  return (
    <div className="relative">
      <BiHandles />

      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl bg-surface-lighter border transition-all duration-300 ${selected ? 'node-glow' : ''}`}
        style={{
          borderColor: selected ? catColor : `${catColor}40`,
          boxShadow: selected ? `0 0 16px ${catColor}30` : 'none',
        }}
      >
        <span className="text-lg select-none">{d.emoji}</span>
        <span className="text-xs font-semibold text-gray-200 whitespace-nowrap">{d.label}</span>

        {/* Category dot */}
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-surface-light"
          style={{ backgroundColor: catColor }}
          title={category}
        />
      </div>

    </div>
  )
}

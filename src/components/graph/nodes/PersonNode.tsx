import { type NodeProps } from '@xyflow/react'
import type { GraphNodeData } from '@/types'
import { BiHandles } from './BiHandles'

export default function PersonNode({ data, selected }: NodeProps) {
  const d = data as unknown as GraphNodeData
  const color = d.color ?? '#3b82f6'

  return (
    <div className="relative flex flex-col items-center">
      <BiHandles />

      {/* Node circle */}
      <div
        className={`w-20 h-20 rounded-full border-2 flex items-center justify-center bg-surface-light transition-all duration-300 ${selected ? 'node-glow' : ''}`}
        style={{
          borderColor: color,
          boxShadow: selected
            ? `0 0 20px ${color}50, 0 0 40px ${color}20`
            : `0 0 8px ${color}15`,
        }}
      >
        <span className="text-3xl select-none">{d.emoji}</span>
      </div>

      {/* Name label */}
      <div className="mt-2 text-center">
        <p className="text-xs font-bold text-white drop-shadow-md leading-tight">{d.label}</p>
        {typeof d.meta?.role === 'string' && (
          <p className="text-[9px] text-gray-400">{d.meta.role}</p>
        )}
      </div>

    </div>
  )
}

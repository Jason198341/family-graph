import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GraphNodeData } from '@/types'

export default function PersonNode({ data, selected }: NodeProps) {
  const d = data as unknown as GraphNodeData
  const color = d.color ?? '#3b82f6'

  return (
    <div className="relative flex flex-col items-center">
      {/* Top handle */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-primary-400 !border-surface-light" />
      {/* Left handle */}
      <Handle type="source" position={Position.Left} className="!w-2 !h-2 !bg-primary-400 !border-surface-light" id="left" />
      {/* Right handle */}
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-primary-400 !border-surface-light" id="right" />

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

      {/* Bottom handle */}
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-primary-400 !border-surface-light" id="bottom" />
    </div>
  )
}

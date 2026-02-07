import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GraphNodeData } from '@/types'

export default function ValueNode({ data, selected }: NodeProps) {
  const d = data as unknown as GraphNodeData

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-warm-400 !border-surface-light" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-warm-400 !border-surface-light" id="left" />

      {/* Outer gradient border wrapper */}
      <div
        className={`p-[2px] rounded-xl bg-gradient-to-br from-warm-400 to-growth-400 ${selected ? '' : 'opacity-70'} transition-opacity duration-300`}
        style={{
          animation: 'valuePulse 3s ease-in-out infinite',
          boxShadow: selected
            ? '0 0 20px rgba(249,115,22,0.25), 0 0 40px rgba(34,197,94,0.15)'
            : 'none',
        }}
      >
        <div className="flex flex-col items-center gap-1.5 px-5 py-3.5 rounded-[10px] bg-surface-light min-w-[80px]">
          <span className="text-xl select-none">{d.emoji}</span>
          <span className="text-xs font-semibold text-gray-200 whitespace-nowrap text-center leading-tight">{d.label}</span>
          {typeof d.meta?.practiceFrequency === 'string' && (
            <span className="text-[9px] text-warm-400/70 uppercase tracking-wider">
              {d.meta.practiceFrequency}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-growth-400 !border-surface-light" id="bottom" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-growth-400 !border-surface-light" id="right" />

      <style>{`
        @keyframes valuePulse {
          0%, 100% { opacity: 0.7; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.15); }
        }
      `}</style>
    </div>
  )
}

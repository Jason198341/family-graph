import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GraphNodeData } from '@/types'

const impactColors: Record<string, string> = {
  positive: '#22c55e',
  neutral: '#f59e0b',
  challenge: '#ef4444',
}

export default function EventNode({ data, selected }: NodeProps) {
  const d = data as unknown as GraphNodeData
  const impact = (d.meta?.impact as string) ?? 'neutral'
  const date = (d.meta?.date as string) ?? ''
  const barColor = impactColors[impact] ?? impactColors.neutral

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-growth-400 !border-surface-light" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-growth-400 !border-surface-light" id="left" />

      <div
        className={`flex items-start gap-0 rounded-xl bg-surface-lighter border border-surface-border overflow-hidden transition-all duration-300 ${selected ? 'node-glow' : ''}`}
        style={{
          boxShadow: selected ? `0 0 16px ${barColor}30` : 'none',
        }}
      >
        {/* Left color bar */}
        <div
          className="w-1.5 self-stretch shrink-0"
          style={{ backgroundColor: barColor }}
        />

        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="text-base select-none">{d.emoji}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-200 whitespace-nowrap leading-tight">{d.label}</p>
            {date && (
              <p className="text-[9px] text-gray-500 mt-0.5">{date}</p>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-growth-400 !border-surface-light" id="bottom" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-growth-400 !border-surface-light" id="right" />
    </div>
  )
}

import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GraphNodeData } from '@/types'

export default function GoalNode({ data, selected }: NodeProps) {
  const d = data as unknown as GraphNodeData
  const progress = (d.meta?.progress as number) ?? 0
  const color = d.color ?? '#60a5fa'

  // SVG circle math
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative flex flex-col items-center">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-primary-400 !border-surface-light" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-primary-400 !border-surface-light" id="left" />

      {/* Progress ring card */}
      <div
        className={`flex flex-col items-center gap-2 px-4 py-3 rounded-2xl bg-surface-lighter border border-surface-border transition-all duration-300 ${selected ? 'node-glow' : ''}`}
        style={{
          boxShadow: selected ? `0 0 20px ${color}30` : 'none',
        }}
      >
        {/* SVG ring with emoji center */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            {/* Background ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="4"
            />
            {/* Progress ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
              style={{
                filter: `drop-shadow(0 0 4px ${color}60)`,
              }}
            />
          </svg>
          {/* Emoji in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl select-none">{d.emoji}</span>
          </div>
        </div>

        {/* Title */}
        <p className="text-[11px] font-semibold text-gray-200 text-center whitespace-nowrap leading-tight max-w-[100px] truncate">
          {d.label}
        </p>

        {/* Progress percentage */}
        <span
          className="text-[10px] font-bold tabular-nums"
          style={{ color }}
        >
          {progress}%
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-primary-400 !border-surface-light" id="bottom" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-primary-400 !border-surface-light" id="right" />
    </div>
  )
}

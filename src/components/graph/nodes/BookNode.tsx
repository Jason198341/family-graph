import { type NodeProps } from '@xyflow/react'
import type { GraphNodeData } from '@/types'
import { BiHandles } from './BiHandles'

export default function BookNode({ data, selected }: NodeProps) {
  const d = data as unknown as GraphNodeData
  const color = d.color ?? '#a855f7'

  return (
    <div className="relative flex flex-col items-center">
      <BiHandles />

      {/* Book card */}
      <div
        className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-surface-lighter border transition-all duration-300 ${selected ? 'node-glow' : ''}`}
        style={{
          borderColor: selected ? color : 'rgba(255,255,255,0.06)',
          boxShadow: selected ? `0 0 20px ${color}30` : 'none',
        }}
      >
        <span className="text-2xl select-none">{d.emoji}</span>
        <p className="text-[11px] font-semibold text-gray-200 text-center whitespace-nowrap leading-tight max-w-[100px] truncate">
          {d.label}
        </p>
        {typeof d.meta?.author === 'string' && (
          <p className="text-[9px] text-gray-500">{d.meta.author}</p>
        )}
      </div>

    </div>
  )
}

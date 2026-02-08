import { Handle, Position } from '@xyflow/react'

/**
 * Invisible bidirectional handles at all 4 positions.
 * Allows edges to connect from any direction via sourceHandle / targetHandle IDs.
 * IDs: s-top, s-right, s-bottom, s-left (source), t-top, t-right, t-bottom, t-left (target)
 */
const S = { opacity: 0, width: 8, height: 8, pointerEvents: 'auto' as const }

export function BiHandles() {
  return (
    <>
      <Handle type="source" position={Position.Top} id="s-top" style={S} />
      <Handle type="source" position={Position.Right} id="s-right" style={S} />
      <Handle type="source" position={Position.Bottom} id="s-bottom" style={S} />
      <Handle type="source" position={Position.Left} id="s-left" style={S} />
      <Handle type="target" position={Position.Top} id="t-top" style={S} />
      <Handle type="target" position={Position.Right} id="t-right" style={S} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" style={S} />
      <Handle type="target" position={Position.Left} id="t-left" style={S} />
    </>
  )
}

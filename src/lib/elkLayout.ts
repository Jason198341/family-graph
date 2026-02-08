import ELK, { type ElkNode, type ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js'
import type { Node, Edge } from '@xyflow/react'

const elk = new ELK()

/** Partition index controls column ordering (left → right) */
const CATEGORY_PARTITION: Record<string, number> = {
  person: 0,
  interest: 1,
  value: 2,
  book: 3,
  event: 4,
  goal: 5,
}

/** Approximate rendered size per node type so ELK reserves correct space */
const NODE_SIZE: Record<string, { width: number; height: number }> = {
  person: { width: 100, height: 100 },
  interest: { width: 140, height: 56 },
  value: { width: 140, height: 60 },
  event: { width: 150, height: 60 },
  goal: { width: 110, height: 110 },
  book: { width: 120, height: 80 },
}

const DEFAULT_SIZE = { width: 140, height: 60 }

export async function elkLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'RIGHT' | 'DOWN' = 'DOWN',
): Promise<Node[]> {
  if (nodes.length === 0) return nodes

  const elkNodes: ElkNode[] = nodes.map((node) => {
    const category = (node.data as Record<string, unknown>).category as string
    const size = NODE_SIZE[category] ?? DEFAULT_SIZE
    return {
      id: node.id,
      width: size.width,
      height: size.height,
      layoutOptions: {
        'partitioning.partition': String(CATEGORY_PARTITION[category] ?? 0),
      },
    }
  })

  const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }))

  const graph: ElkNode = {
    id: 'root',
    children: elkNodes,
    edges: elkEdges,
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.partitioning.activate': 'true',
      // Spacing — generous to prevent edge overlap
      'elk.spacing.nodeNode': '70',
      'elk.spacing.edgeEdge': '25',
      'elk.spacing.edgeNode': '35',
      'elk.layered.spacing.nodeNodeBetweenLayers': '140',
      'elk.layered.spacing.edgeNodeBetweenLayers': '40',
      'elk.layered.spacing.edgeEdgeBetweenLayers': '20',
      // Edge routing — splines for smooth curves
      'elk.edgeRouting': 'SPLINES',
      // Quality
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.thoroughness': '10',
      // Padding
      'elk.padding': '[top=60,left=60,bottom=60,right=60]',
    },
  }

  const result = await elk.layout(graph)

  return nodes.map((node) => {
    const elkNode = result.children?.find((n) => n.id === node.id)
    if (!elkNode) return node
    return {
      ...node,
      position: { x: elkNode.x ?? 0, y: elkNode.y ?? 0 },
    }
  })
}

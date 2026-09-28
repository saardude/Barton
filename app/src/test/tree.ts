import type { PlaceNode } from '../state/selectors'

export function find(nodes: PlaceNode[], id: string): PlaceNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    const f = find(n.children, id)
    if (f) return f
  }
  return undefined
}

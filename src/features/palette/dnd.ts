import { NODE_KINDS, type NodeKind } from '../../core/types'

/** MIME key used to carry the node kind through HTML5 drag-and-drop. */
export const PALETTE_DND_MIME = 'application/x-flowhr-node'

export function isNodeKind(value: string): value is NodeKind {
  return (NODE_KINDS as readonly string[]).includes(value)
}

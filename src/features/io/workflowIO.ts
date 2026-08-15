import {
  fromWorkflowJSON,
  toWorkflowJSON,
  type ParseResult,
} from '../../core/serialization/workflowJson'
import type { WorkflowEdge, WorkflowNode } from '../../core/types'

/** Trigger a browser download of the current workflow as pretty-printed JSON. */
export function downloadWorkflow(name: string, nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
  const payload = toWorkflowJSON(name, nodes, edges)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${slugify(name)}.flow.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

/** Read and structurally validate an exported workflow file. */
export async function readWorkflowFile(file: File): Promise<ParseResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    return { ok: false, error: 'File is not valid JSON' }
  }
  return fromWorkflowJSON(parsed)
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workflow'
}

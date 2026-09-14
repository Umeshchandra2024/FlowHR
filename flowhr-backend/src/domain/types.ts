// Mirrors the frontend's wire-format types (src/core/types/index.ts in the FlowHR frontend repo)
// exactly, field-for-field, so a WorkflowJSON round-trips between the two apps unchanged.

export type NodeKind = 'start' | 'task' | 'approval' | 'automated' | 'end';

export type KeyValue = { id: string; key: string; value: string };

export type ApproverRole = 'Manager' | 'HRBP' | 'Director';

export type StartNodeData = { title: string; metadata: KeyValue[] };

export type TaskNodeData = {
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  customFields: KeyValue[];
};

export type ApprovalNodeData = {
  title: string;
  approverRole: ApproverRole;
  autoApproveThreshold: number;
};

export type AutomatedNodeData = {
  title: string;
  actionId: string | null;
  actionLabel: string | null;
  params: Record<string, string>;
};

export type EndNodeData = { endMessage: string; includeSummary: boolean };

export type NodeDataOf = {
  start: StartNodeData;
  task: TaskNodeData;
  approval: ApprovalNodeData;
  automated: AutomatedNodeData;
  end: EndNodeData;
};

export type NodeData = NodeDataOf[NodeKind];

export type SerializedNode = {
  id: string;
  kind: NodeKind;
  position: { x: number; y: number };
  data: NodeData;
};

export type SerializedEdge = { id: string; source: string; target: string };

export type WorkflowJSON = {
  version: 1;
  name: string;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
};

export type ValidationLevel = 'error' | 'warning';

export type ValidationIssue = {
  id: string;
  level: ValidationLevel;
  message: string;
  nodeId?: string;
};

export type SimulationStepStatus = 'success' | 'skipped' | 'error';

export type SimulationStep = {
  index: number;
  nodeId: string;
  nodeKind: NodeKind;
  nodeLabel: string;
  viaEdgeId?: string;
  status: SimulationStepStatus;
  message: string;
  durationMs: number;
};

export type SimulationResult = {
  workflowName: string;
  status: 'completed' | 'failed';
  totalSteps: number;
  totalDurationMs: number;
  steps: SimulationStep[];
};

export type AutomationAction = {
  id: string;
  label: string;
  params: string[];
};

export type AutomationExecutorContext = {
  nodeTitle: string;
  actionLabel: string;
  params: Record<string, string>;
};

export type AutomationExecutorResult = {
  status: SimulationStepStatus;
  message: string;
};

export type AutomationExecutor = (
  ctx: AutomationExecutorContext,
) => Promise<AutomationExecutorResult>;

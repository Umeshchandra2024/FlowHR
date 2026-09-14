import { z } from 'zod';

// Mirrors the frontend's WorkflowJSON wire format field-for-field (see src/domain/types.ts).
// A discriminated union on `kind` means an unknown or mismatched node shape is rejected with a
// precise Zod error instead of silently passing through as `any`.

const keyValueSchema = z.object({ id: z.string(), key: z.string(), value: z.string() });

const positionSchema = z.object({ x: z.number(), y: z.number() });

const startDataSchema = z.object({ title: z.string(), metadata: z.array(keyValueSchema) });

const taskDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  assignee: z.string(),
  dueDate: z.string(),
  customFields: z.array(keyValueSchema),
});

const approvalDataSchema = z.object({
  title: z.string(),
  approverRole: z.enum(['Manager', 'HRBP', 'Director']),
  autoApproveThreshold: z.number(),
});

const automatedDataSchema = z.object({
  title: z.string(),
  actionId: z.string().nullable(),
  actionLabel: z.string().nullable(),
  params: z.record(z.string(), z.string()),
});

const endDataSchema = z.object({ endMessage: z.string(), includeSummary: z.boolean() });

const nodeSchema = z.discriminatedUnion('kind', [
  z.object({ id: z.string(), kind: z.literal('start'), position: positionSchema, data: startDataSchema }),
  z.object({ id: z.string(), kind: z.literal('task'), position: positionSchema, data: taskDataSchema }),
  z.object({ id: z.string(), kind: z.literal('approval'), position: positionSchema, data: approvalDataSchema }),
  z.object({ id: z.string(), kind: z.literal('automated'), position: positionSchema, data: automatedDataSchema }),
  z.object({ id: z.string(), kind: z.literal('end'), position: positionSchema, data: endDataSchema }),
]);

const edgeSchema = z.object({ id: z.string(), source: z.string(), target: z.string() });

export const workflowJsonSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1),
  definition: workflowJsonSchema,
});

export const updateWorkflowSchema = z
  .object({
    name: z.string().min(1).optional(),
    definition: workflowJsonSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.definition !== undefined, {
    message: 'Provide at least one of "name" or "definition" to update',
  });

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;

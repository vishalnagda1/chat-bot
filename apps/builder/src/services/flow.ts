import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";

type Flow = typeof schema.flows.$inferSelect;

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface CreateFlowInput {
  botId: string;
  name: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
}

export interface UpdateFlowInput {
  name?: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
}

export async function createFlow(input: CreateFlowInput) {
  const [flow] = await db
    .insert(schema.flows)
    .values({
      botId: input.botId,
      name: input.name,
      nodes: input.nodes || [],
      edges: input.edges || [],
    })
    .returning();

  return flow!;
}

export async function getFlowById(id: string) {
  const flow = await db.query.flows.findFirst({
    where: eq(schema.flows.id, id),
  });

  if (!flow) {
    throw new Error("Flow not found");
  }

  return flow;
}

export async function getFlowsByBotId(botId: string) {
  const flows = await db.query.flows.findMany({
    where: eq(schema.flows.botId, botId),
    orderBy: (flows, { desc }) => [desc(flows.updatedAt)],
  });

  return flows;
}

export async function updateFlow(id: string, input: UpdateFlowInput) {
  const [flow] = await db
    .update(schema.flows)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.flows.id, id))
    .returning();

  return flow;
}

export async function deleteFlow(id: string) {
  await db.delete(schema.flows).where(eq(schema.flows.id, id));
}

export async function saveFlow(botId: string, name: string, nodes: FlowNode[], edges: FlowEdge[]) {
  // Check if flow exists for this bot with this name
  const existingFlow = await db.query.flows.findFirst({
    where: eq(schema.flows.botId, botId),
  });

  if (existingFlow) {
    // Update existing flow
    return updateFlow(existingFlow.id, { name, nodes, edges });
  }

  // Create new flow
  return createFlow({ botId, name, nodes, edges });
}

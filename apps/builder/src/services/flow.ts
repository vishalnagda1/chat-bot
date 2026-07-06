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
    // Create version snapshot before updating
    await createFlowVersion(existingFlow.id, existingFlow.version || 1, existingFlow.nodes as FlowNode[], existingFlow.edges as FlowEdge[]);

    // Update version number
    const newVersion = (existingFlow.version || 1) + 1;

    // Update existing flow
    const [updated] = await db
      .update(schema.flows)
      .set({ name, nodes, edges, version: newVersion, updatedAt: new Date() })
      .where(eq(schema.flows.id, existingFlow.id))
      .returning();

    return updated;
  }

  // Create new flow
  return createFlow({ botId, name, nodes, edges });
}

export async function createFlowVersion(flowId: string, version: number, nodes: FlowNode[], edges: FlowEdge[]) {
  const [flowVersion] = await db
    .insert(schema.flowVersions)
    .values({
      flowId,
      version,
      nodes,
      edges,
    })
    .returning();

  return flowVersion!;
}

export async function getFlowVersions(flowId: string) {
  const versions = await db.query.flowVersions.findMany({
    where: eq(schema.flowVersions.flowId, flowId),
    orderBy: (versions, { desc }) => [desc(versions.version)],
  });

  return versions;
}

export async function getFlowVersionById(id: string) {
  const version = await db.query.flowVersions.findFirst({
    where: eq(schema.flowVersions.id, id),
  });

  if (!version) {
    throw new Error("Flow version not found");
  }

  return version;
}

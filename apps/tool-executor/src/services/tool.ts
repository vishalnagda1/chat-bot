import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";

type Tool = typeof schema.tools.$inferSelect;
type ToolExecution = typeof schema.toolExecutions.$inferSelect;

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ExecuteToolInput {
  toolId: string;
  conversationId: string;
  input: Record<string, unknown>;
}

export async function getToolById(id: string) {
  const tool = await db.query.tools.findFirst({
    where: eq(schema.tools.id, id),
  });

  if (!tool) {
    throw new Error("Tool not found");
  }

  return tool;
}

export async function getToolsByBotId(botId: string) {
  const tools = await db.query.tools.findMany({
    where: eq(schema.tools.botId, botId),
  });

  return tools;
}

export async function createTool(tool: {
  botId: string;
  name: string;
  description?: string;
  type: string;
  config?: Record<string, unknown>;
  parametersSchema?: Record<string, unknown>;
}) {
  const [newTool] = await db
    .insert(schema.tools)
    .values({
      ...tool,
      description: tool.description || null,
      config: tool.config || null,
      parametersSchema: tool.parametersSchema || null,
    })
    .returning();

  return newTool!;
}

export async function updateTool(
  id: string,
  data: Partial<Pick<Tool, "name" | "description" | "type" | "config" | "parametersSchema">>
) {
  const [tool] = await db
    .update(schema.tools)
    .set(data)
    .where(eq(schema.tools.id, id))
    .returning();

  return tool;
}

export async function deleteTool(id: string) {
  await db.delete(schema.tools).where(eq(schema.tools.id, id));
}

export async function recordExecution(
  input: ExecuteToolInput,
  output: Record<string, unknown>,
  status: string,
  latencyMs: number
) {
  const [execution] = await db
    .insert(schema.toolExecutions)
    .values({
      toolId: input.toolId,
      conversationId: input.conversationId,
      input: input.input,
      output,
      status,
      latencyMs,
    })
    .returning();

  return execution!;
}

export async function getExecutionHistory(toolId: string, limit = 50) {
  const executions = await db.query.toolExecutions.findMany({
    where: eq(schema.toolExecutions.toolId, toolId),
    limit,
  });

  return executions;
}

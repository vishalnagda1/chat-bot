import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getToolsByBotId,
  createTool,
  updateTool,
  deleteTool,
  getExecutionHistory,
} from "../services/tool.js";
import { executeTool } from "../services/executor.js";

const createToolSchema = z.object({
  botId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["api_call", "code", "email", "sms", "database", "file"]),
  config: z.record(z.unknown()).optional(),
  parametersSchema: z.record(z.unknown()).optional(),
});

const updateToolSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  parametersSchema: z.record(z.unknown()).optional(),
});

const executeToolSchema = z.object({
  toolId: z.string().uuid(),
  conversationId: z.string().uuid(),
  input: z.record(z.unknown()),
});

export async function toolRoutes(app: FastifyInstance) {
  // List tools for a bot
  app.get("/api/bots/:botId/tools", async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const tools = await getToolsByBotId(botId);

    return reply.send({
      success: true,
      data: tools,
    });
  });

  // Create tool
  app.post("/api/tools", async (request, reply) => {
    const input = createToolSchema.parse(request.body);
    const tool = await createTool(input);

    return reply.status(201).send({
      success: true,
      data: tool,
    });
  });

  // Update tool
  app.patch("/api/tools/:toolId", async (request, reply) => {
    const { toolId } = request.params as { toolId: string };
    const input = updateToolSchema.parse(request.body);
    const tool = await updateTool(toolId, input);

    return reply.send({
      success: true,
      data: tool,
    });
  });

  // Delete tool
  app.delete("/api/tools/:toolId", async (request, reply) => {
    const { toolId } = request.params as { toolId: string };
    await deleteTool(toolId);

    return reply.send({
      success: true,
      data: null,
    });
  });

  // Execute tool
  app.post("/api/tools/execute", async (request, reply) => {
    const input = executeToolSchema.parse(request.body);
    const result = await executeTool(input.toolId, input.conversationId, input.input);

    return reply.send({
      success: true,
      data: result,
    });
  });

  // Get execution history
  app.get("/api/tools/:toolId/executions", async (request, reply) => {
    const { toolId } = request.params as { toolId: string };
    const { limit } = request.query as { limit?: string };

    const executions = await getExecutionHistory(
      toolId,
      limit ? parseInt(limit) : 50
    );

    return reply.send({
      success: true,
      data: executions,
    });
  });
}

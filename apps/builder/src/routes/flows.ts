import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createFlow,
  getFlowById,
  getFlowsByBotId,
  updateFlow,
  deleteFlow,
  saveFlow,
} from "../services/flow.js";

const flowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.unknown()),
});

const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});

const createFlowSchema = z.object({
  name: z.string().min(1),
  nodes: z.array(flowNodeSchema).optional(),
  edges: z.array(flowEdgeSchema).optional(),
});

const updateFlowSchema = z.object({
  name: z.string().min(1).optional(),
  nodes: z.array(flowNodeSchema).optional(),
  edges: z.array(flowEdgeSchema).optional(),
});

const saveFlowSchema = z.object({
  name: z.string().min(1),
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
});

export async function flowRoutes(app: FastifyInstance) {
  // List flows for a bot
  app.get("/api/bots/:botId/flows", async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const flows = await getFlowsByBotId(botId);

    return reply.send({
      success: true,
      data: flows,
    });
  });

  // Get flow
  app.get("/api/flows/:flowId", async (request, reply) => {
    const { flowId } = request.params as { flowId: string };
    const flow = await getFlowById(flowId);

    return reply.send({
      success: true,
      data: flow,
    });
  });

  // Create flow
  app.post("/api/bots/:botId/flows", async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const input = createFlowSchema.parse(request.body);
    const flow = await createFlow({ botId, ...input });

    return reply.status(201).send({
      success: true,
      data: flow,
    });
  });

  // Update flow
  app.patch("/api/flows/:flowId", async (request, reply) => {
    const { flowId } = request.params as { flowId: string };
    const input = updateFlowSchema.parse(request.body);
    const flow = await updateFlow(flowId, input);

    return reply.send({
      success: true,
      data: flow,
    });
  });

  // Delete flow
  app.delete("/api/flows/:flowId", async (request, reply) => {
    const { flowId } = request.params as { flowId: string };
    await deleteFlow(flowId);

    return reply.send({
      success: true,
      data: null,
    });
  });

  // Save flow (upsert)
  app.put("/api/bots/:botId/flows", async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const input = saveFlowSchema.parse(request.body);
    const flow = await saveFlow(botId, input.name, input.nodes, input.edges);

    return reply.send({
      success: true,
      data: flow,
    });
  });
}

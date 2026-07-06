import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createChannelBinding,
  getChannelBindingsByDeploymentId,
  getChannelBindingById,
  updateChannelBinding,
  deleteChannelBinding,
} from "../services/channel-binding.js";

const createChannelBindingSchema = z.object({
  channelType: z.enum(["web", "slack", "whatsapp", "telegram", "api"]),
  config: z.record(z.unknown()).optional(),
});

const updateChannelBindingSchema = z.object({
  config: z.record(z.unknown()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function channelBindingRoutes(app: FastifyInstance) {
  // List channel bindings for a deployment
  app.get("/api/deployments/:deploymentId/bindings", async (request, reply) => {
    const { deploymentId } = request.params as { deploymentId: string };

    const bindings = await getChannelBindingsByDeploymentId(deploymentId);

    return reply.send({
      success: true,
      data: bindings,
    });
  });

  // Get channel binding
  app.get("/api/channel-bindings/:bindingId", async (request, reply) => {
    const { bindingId } = request.params as { bindingId: string };

    const binding = await getChannelBindingById(bindingId);

    return reply.send({
      success: true,
      data: binding,
    });
  });

  // Create channel binding
  app.post("/api/deployments/:deploymentId/bindings", async (request, reply) => {
    const { deploymentId } = request.params as { deploymentId: string };
    const input = createChannelBindingSchema.parse(request.body);

    const binding = await createChannelBinding({
      deploymentId,
      ...input,
    });

    return reply.status(201).send({
      success: true,
      data: binding,
    });
  });

  // Update channel binding
  app.patch("/api/channel-bindings/:bindingId", async (request, reply) => {
    const { bindingId } = request.params as { bindingId: string };
    const input = updateChannelBindingSchema.parse(request.body);

    const binding = await updateChannelBinding(bindingId, input);

    return reply.send({
      success: true,
      data: binding,
    });
  });

  // Delete channel binding
  app.delete("/api/channel-bindings/:bindingId", async (request, reply) => {
    const { bindingId } = request.params as { bindingId: string };

    await deleteChannelBinding(bindingId);

    return reply.send({
      success: true,
      data: null,
    });
  });
}

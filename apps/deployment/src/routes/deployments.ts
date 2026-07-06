import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createDeployment,
  getDeploymentById,
  getDeploymentsByBotId,
  updateDeployment,
  deployBot,
  rollbackDeployment,
  deleteDeployment,
} from "../services/deployment.js";
import { generateWebWidgetScript } from "../channels/web-widget.js";

const createDeploymentSchema = z.object({
  botId: z.string().uuid(),
  versionId: z.string().uuid(),
  environment: z.enum(["development", "staging", "production"]),
  channelConfig: z.record(z.unknown()).optional(),
});

const deployBotSchema = z.object({
  versionId: z.string().uuid(),
  environment: z.string(),
});

export async function deploymentRoutes(app: FastifyInstance) {
  // List deployments for a bot
  app.get("/api/bots/:botId/deployments", async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const deployments = await getDeploymentsByBotId(botId);

    return reply.send({
      success: true,
      data: deployments,
    });
  });

  // Create deployment
  app.post("/api/deployments", async (request, reply) => {
    const input = createDeploymentSchema.parse(request.body);
    const deployment = await createDeployment(input);

    return reply.status(201).send({
      success: true,
      data: deployment,
    });
  });

  // Get deployment
  app.get("/api/deployments/:deploymentId", async (request, reply) => {
    const { deploymentId } = request.params as { deploymentId: string };
    const deployment = await getDeploymentById(deploymentId);

    return reply.send({
      success: true,
      data: deployment,
    });
  });

  // Update deployment
  app.patch("/api/deployments/:deploymentId", async (request, reply) => {
    const { deploymentId } = request.params as { deploymentId: string };
    const input = request.body as {
      versionId?: string;
      status?: "pending" | "active" | "inactive" | "failed" | "rolled_back";
      channelConfig?: Record<string, unknown>;
    };
    const deployment = await updateDeployment(deploymentId, input);

    return reply.send({
      success: true,
      data: deployment,
    });
  });

  // Deploy bot
  app.post("/api/bots/:botId/deploy", async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const input = deployBotSchema.parse(request.body);
    const deployment = await deployBot(botId, input.versionId, input.environment);

    return reply.send({
      success: true,
      data: deployment,
    });
  });

  // Rollback deployment
  app.post("/api/deployments/:deploymentId/rollback", async (request, reply) => {
    const { deploymentId } = request.params as { deploymentId: string };
    const deployment = await rollbackDeployment(deploymentId);

    return reply.send({
      success: true,
      data: deployment,
    });
  });

  // Delete deployment
  app.delete("/api/deployments/:deploymentId", async (request, reply) => {
    const { deploymentId } = request.params as { deploymentId: string };
    await deleteDeployment(deploymentId);

    return reply.send({
      success: true,
      data: null,
    });
  });

  // Generate web widget embed code
  app.post("/api/bots/:botId/widget", async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const config = request.body as {
      theme?: Record<string, string>;
      position?: "bottom-right" | "bottom-left";
      greeting?: string;
    };

    const widgetScript = generateWebWidgetScript({
      botId,
      ...config,
    });

    return reply.send({
      success: true,
      data: { script: widgetScript },
    });
  });
}

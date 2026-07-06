import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireBotAccess, requireOrgMember } from "@repo/auth-middleware";
import {
  createBot,
  getBotById,
  getBotsByOrgId,
  updateBot,
  deleteBot,
  createVersion,
  getVersions,
  publishBot,
} from "../services/bot.js";

const createBotSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateBotSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const createVersionSchema = z.object({
  provider: z.enum(["anthropic", "openai"]).optional(),
  systemPrompt: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(100).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
  welcomeMessage: z.string().optional(),
  config: z.record(z.unknown()).optional(),
});

const publishSchema = z.object({
  versionId: z.string().uuid(),
});

export async function botRoutes(app: FastifyInstance) {
  // List bots for an org
  app.get("/api/bots", { preHandler: [requireOrgMember] }, async (request, reply) => {
    const { orgId } = request.query as { orgId: string };

    if (!orgId) {
      return reply.status(400).send({ error: "orgId is required" });
    }

    const bots = await getBotsByOrgId(orgId);

    return reply.send({
      success: true,
      data: bots,
    });
  });

  // Create bot
  app.post("/api/bots", { preHandler: [requireOrgMember] }, async (request, reply) => {
    const input = createBotSchema.parse(request.body);
    const bot = await createBot(input);

    return reply.status(201).send({
      success: true,
      data: bot,
    });
  });

  // Get bot
  app.get("/api/bots/:botId", { preHandler: [requireBotAccess] }, async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const bot = await getBotById(botId);

    return reply.send({
      success: true,
      data: bot,
    });
  });

  // Update bot
  app.patch("/api/bots/:botId", { preHandler: [requireBotAccess] }, async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const input = updateBotSchema.parse(request.body);
    const bot = await updateBot(botId, input);

    return reply.send({
      success: true,
      data: bot,
    });
  });

  // Delete bot
  app.delete("/api/bots/:botId", { preHandler: [requireBotAccess] }, async (request, reply) => {
    const { botId } = request.params as { botId: string };
    await deleteBot(botId);

    return reply.send({
      success: true,
      data: null,
    });
  });

  // List versions
  app.get("/api/bots/:botId/versions", { preHandler: [requireBotAccess] }, async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const versions = await getVersions(botId);

    return reply.send({
      success: true,
      data: versions,
    });
  });

  // Create version
  app.post("/api/bots/:botId/versions", { preHandler: [requireBotAccess] }, async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const input = createVersionSchema.parse(request.body);
    const version = await createVersion({ botId, ...input });

    return reply.status(201).send({
      success: true,
      data: version,
    });
  });

  // Publish bot
  app.post("/api/bots/:botId/publish", { preHandler: [requireBotAccess] }, async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const { versionId } = publishSchema.parse(request.body);
    const bot = await publishBot(botId, versionId);

    return reply.send({
      success: true,
      data: bot,
    });
  });
}

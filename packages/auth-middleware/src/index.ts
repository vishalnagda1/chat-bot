import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export interface AuthUser {
  userId: string;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user: AuthUser;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await request.jwtVerify<{ userId: string; email: string }>();
    request.user = { userId: decoded.userId, email: decoded.email };
  } catch (err) {
    return reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

export async function requireOrgMember(request: FastifyRequest, reply: FastifyReply) {
  const { orgId } = request.params as { orgId?: string };
  if (!orgId) return;

  const { db, schema } = await import("@repo/db");
  const { eq, and } = await import("drizzle-orm");

  const membership = await db.query.memberships.findFirst({
    where: and(
      eq(schema.memberships.orgId, orgId),
      eq(schema.memberships.userId, request.user.userId)
    ),
  });

  if (!membership) {
    return reply.status(403).send({ error: "Forbidden", message: "Not a member of this organization" });
  }
}

export async function requireBotAccess(request: FastifyRequest, reply: FastifyReply) {
  const { botId } = request.params as { botId?: string };
  if (!botId) return;

  const { db, schema } = await import("@repo/db");
  const { eq } = await import("drizzle-orm");

  const bot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, botId),
  });

  if (!bot) {
    return reply.status(404).send({ error: "Not found", message: "Bot not found" });
  }

  // Check if user is a member of the bot's org
  const membership = await db.query.memberships.findFirst({
    where: and(
      eq(schema.memberships.orgId, bot.orgId),
      eq(schema.memberships.userId, request.user.userId)
    ),
  });

  if (!membership) {
    return reply.status(403).send({ error: "Forbidden", message: "No access to this bot" });
  }
}

export function registerAuth(app: FastifyInstance) {
  // PreHandler hook for JWT verification
  app.addHook("preHandler", async (request, reply) => {
    // Skip auth for health checks
    if (request.url === "/health") return;
    // Skip auth for auth routes (register/login)
    if (request.url.startsWith("/api/auth/")) return;

    await authenticate(request, reply);
  });
}

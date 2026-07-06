import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export interface AuthUser {
  userId: string;
  email: string;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await (request as any).jwtVerify();
    (request as any).user = { userId: decoded.userId, email: decoded.email };
  } catch (err) {
    return reply.status(401).send({ error: "Unauthorized", message: "Invalid or missing token" });
  }
}

export async function requireOrgMember(request: FastifyRequest, reply: FastifyReply) {
  const { orgId } = request.params as { orgId?: string };
  if (!orgId) return;

  const { db, schema, eq, and } = await import("@repo/db");
  const user = (request as any).user as AuthUser;

  const membership = await db.query.memberships.findFirst({
    where: and(
      eq(schema.memberships.orgId, orgId),
      eq(schema.memberships.userId, user.userId)
    ),
  });

  if (!membership) {
    return reply.status(403).send({ error: "Forbidden", message: "Not a member of this organization" });
  }
}

export async function requireBotAccess(request: FastifyRequest, reply: FastifyReply) {
  const { botId } = request.params as { botId?: string };
  if (!botId) return;

  const { db, schema, eq, and } = await import("@repo/db");
  const user = (request as any).user as AuthUser;

  const bot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, botId),
  });

  if (!bot) {
    return reply.status(404).send({ error: "Not found", message: "Bot not found" });
  }

  const membership = await db.query.memberships.findFirst({
    where: and(
      eq(schema.memberships.orgId, bot.orgId),
      eq(schema.memberships.userId, user.userId)
    ),
  });

  if (!membership) {
    return reply.status(403).send({ error: "Forbidden", message: "No access to this bot" });
  }
}

export function registerAuth(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    if (request.url === "/health") return;
    if (request.url.startsWith("/api/auth/")) return;

    await authenticate(request, reply);
  });
}

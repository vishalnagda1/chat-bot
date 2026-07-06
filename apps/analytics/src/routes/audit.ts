import { FastifyInstance } from "fastify";
import { z } from "zod";
import { logAudit, getAuditLogs } from "../services/audit.js";

const logAuditSchema = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const getAuditLogsSchema = z.object({
  orgId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  resourceType: z.string().optional(),
  limit: z.number().optional(),
});

export async function auditRoutes(app: FastifyInstance) {
  // Log audit event
  app.post("/api/audit", async (request, reply) => {
    const input = logAuditSchema.parse(request.body);
    const log = await logAudit(input);

    return reply.status(201).send({
      success: true,
      data: log,
    });
  });

  // Get audit logs
  app.get("/api/audit", async (request, reply) => {
    const input = getAuditLogsSchema.parse(request.query);
    const logs = await getAuditLogs(input.orgId, {
      userId: input.userId,
      resourceType: input.resourceType,
      limit: input.limit,
    });

    return reply.send({
      success: true,
      data: logs,
    });
  });
}

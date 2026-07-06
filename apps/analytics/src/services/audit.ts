import { db, schema } from "@repo/db";
import { eq, and } from "drizzle-orm";

type AuditLog = typeof schema.auditLogs.$inferSelect;

export interface LogAuditInput {
  userId: string;
  orgId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(input: LogAuditInput) {
  const [log] = await db
    .insert(schema.auditLogs)
    .values({
      userId: input.userId,
      orgId: input.orgId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata || {},
    })
    .returning();

  return log!;
}

export async function getAuditLogs(
  orgId: string,
  options: {
    userId?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
) {
  const { userId, resourceType, limit = 100 } = options;

  const conditions = [eq(schema.auditLogs.orgId, orgId)];
  if (userId) conditions.push(eq(schema.auditLogs.userId, userId));
  if (resourceType) conditions.push(eq(schema.auditLogs.resourceType, resourceType));

  const logs = await db.query.auditLogs.findMany({
    where: and(...conditions),
    limit,
  });

  return logs;
}

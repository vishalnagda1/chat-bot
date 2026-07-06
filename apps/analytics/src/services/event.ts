import { db, schema } from "@repo/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

type Event = typeof schema.events.$inferSelect;
type UsageMetric = typeof schema.usageMetrics.$inferSelect;

export interface TrackEventInput {
  orgId: string;
  botId?: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface GetMetricsInput {
  orgId: string;
  botId?: string;
  metricType: string;
  startDate: Date;
  endDate: Date;
}

export async function trackEvent(input: TrackEventInput) {
  const [event] = await db
    .insert(schema.events)
    .values({
      orgId: input.orgId,
      botId: input.botId,
      eventType: input.eventType,
      payload: input.payload,
    })
    .returning();

  return event!;
}

export async function getEvents(
  orgId: string,
  options: { botId?: string; eventType?: string; limit?: number } = {}
) {
  const { botId, eventType, limit = 100 } = options;

  const conditions = [eq(schema.events.orgId, orgId)];
  if (botId) conditions.push(eq(schema.events.botId, botId));
  if (eventType) conditions.push(eq(schema.events.eventType, eventType));

  const events = await db.query.events.findMany({
    where: and(...conditions),
    limit,
  });

  return events;
}

export async function recordMetric(
  orgId: string,
  botId: string,
  metricType: string,
  value: number,
  periodStart: Date,
  periodEnd: Date
) {
  const [metric] = await db
    .insert(schema.usageMetrics)
    .values({
      orgId,
      botId,
      metricType,
      value,
      periodStart,
      periodEnd,
    })
    .returning();

  return metric!;
}

export async function getMetrics(input: GetMetricsInput) {
  const metrics = await db.query.usageMetrics.findMany({
    where: and(
      eq(schema.usageMetrics.orgId, input.orgId),
      eq(schema.usageMetrics.metricType, input.metricType),
      gte(schema.usageMetrics.periodStart, input.startDate),
      lte(schema.usageMetrics.periodEnd, input.endDate)
    ),
  });

  return metrics;
}

export async function getAggregatedMetrics(
  orgId: string,
  botId: string | undefined,
  metricType: string,
  startDate: Date,
  endDate: Date
) {
  const conditions = [
    eq(schema.usageMetrics.orgId, orgId),
    eq(schema.usageMetrics.metricType, metricType),
    gte(schema.usageMetrics.periodStart, startDate),
    lte(schema.usageMetrics.periodEnd, endDate),
  ];

  if (botId) {
    conditions.push(eq(schema.usageMetrics.botId, botId));
  }

  const result = await db
    .select({
      total: sql<number>`sum(${schema.usageMetrics.value})`,
      count: sql<number>`count(*)`,
      avg: sql<number>`avg(${schema.usageMetrics.value})`,
    })
    .from(schema.usageMetrics)
    .where(and(...conditions));

  return result[0] || { total: 0, count: 0, avg: 0 };
}

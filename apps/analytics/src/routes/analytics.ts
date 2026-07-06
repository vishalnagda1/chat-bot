import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  trackEvent,
  getEvents,
  getMetrics,
  getAggregatedMetrics,
} from "../services/event.js";

const trackEventSchema = z.object({
  orgId: z.string().uuid(),
  botId: z.string().uuid().optional(),
  eventType: z.string(),
  payload: z.record(z.unknown()),
});

const getEventsSchema = z.object({
  orgId: z.string().uuid(),
  botId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  limit: z.number().optional(),
});

const getMetricsSchema = z.object({
  orgId: z.string().uuid(),
  botId: z.string().uuid().optional(),
  metricType: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export async function analyticsRoutes(app: FastifyInstance) {
  // Track event
  app.post("/api/events", async (request, reply) => {
    const input = trackEventSchema.parse(request.body);
    const event = await trackEvent(input);

    return reply.status(201).send({
      success: true,
      data: event,
    });
  });

  // Get events
  app.get("/api/events", async (request, reply) => {
    const input = getEventsSchema.parse(request.query);
    const events = await getEvents(input.orgId, {
      botId: input.botId,
      eventType: input.eventType,
      limit: input.limit,
    });

    return reply.send({
      success: true,
      data: events,
    });
  });

  // Get metrics
  app.get("/api/metrics", async (request, reply) => {
    const input = getMetricsSchema.parse(request.query);
    const metrics = await getMetrics({
      orgId: input.orgId,
      botId: input.botId,
      metricType: input.metricType,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    });

    return reply.send({
      success: true,
      data: metrics,
    });
  });

  // Get aggregated metrics
  app.get("/api/metrics/aggregate", async (request, reply) => {
    const input = getMetricsSchema.parse(request.query);
    const aggregated = await getAggregatedMetrics(
      input.orgId,
      input.botId,
      input.metricType,
      new Date(input.startDate),
      new Date(input.endDate)
    );

    return reply.send({
      success: true,
      data: aggregated,
    });
  });

  // Dashboard summary
  app.get("/api/dashboard/:orgId", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };

    // Get summary metrics for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const [totalConversations, totalMessages, totalToolExecutions] = await Promise.all([
      getAggregatedMetrics(orgId, undefined, "conversation.started", startDate, endDate),
      getAggregatedMetrics(orgId, undefined, "message.sent", startDate, endDate),
      getAggregatedMetrics(orgId, undefined, "tool.executed", startDate, endDate),
    ]);

    return reply.send({
      success: true,
      data: {
        period: { startDate, endDate },
        metrics: {
          conversations: totalConversations,
          messages: totalMessages,
          toolExecutions: totalToolExecutions,
        },
      },
    });
  });
}

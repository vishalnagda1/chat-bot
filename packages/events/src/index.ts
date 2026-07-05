import { z } from "zod";

// Base event schema
export const BaseEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string(),
  timestamp: z.string().datetime(),
  orgId: z.string().uuid(),
  botId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

// Bot events
export const BotCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("bot.created"),
  data: z.object({
    botId: z.string().uuid(),
    name: z.string(),
  }),
});

export const BotUpdatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("bot.updated"),
  data: z.object({
    botId: z.string().uuid(),
    changes: z.record(z.unknown()),
  }),
});

export const BotPublishedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("bot.published"),
  data: z.object({
    botId: z.string().uuid(),
    version: z.number(),
  }),
});

// Conversation events
export const ConversationStartedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("conversation.started"),
  data: z.object({
    conversationId: z.string().uuid(),
    botId: z.string().uuid(),
    channel: z.string(),
  }),
});

export const MessageSentEventSchema = BaseEventSchema.extend({
  eventType: z.literal("message.sent"),
  data: z.object({
    conversationId: z.string().uuid(),
    messageId: z.string().uuid(),
    role: z.enum(["user", "assistant", "system"]),
    tokens: z.number().optional(),
  }),
});

// Tool events
export const ToolExecutedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("tool.executed"),
  data: z.object({
    toolId: z.string().uuid(),
    conversationId: z.string().uuid(),
    success: z.boolean(),
    latencyMs: z.number(),
  }),
});

// Union of all events
export const ChatBotEventSchema = z.discriminatedUnion("eventType", [
  BotCreatedEventSchema,
  BotUpdatedEventSchema,
  BotPublishedEventSchema,
  ConversationStartedEventSchema,
  MessageSentEventSchema,
  ToolExecutedEventSchema,
]);

export type ChatBotEvent = z.infer<typeof ChatBotEventSchema>;

// Event type registry
export const EventType = {
  BOT_CREATED: "bot.created",
  BOT_UPDATED: "bot.updated",
  BOT_PUBLISHED: "bot.published",
  CONVERSATION_STARTED: "conversation.started",
  MESSAGE_SENT: "message.sent",
  TOOL_EXECUTED: "tool.executed",
} as const;

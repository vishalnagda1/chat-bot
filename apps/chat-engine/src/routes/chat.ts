import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createConversation,
  getConversationById,
  getConversationsByBotId,
  addMessage,
  getConversationHistory,
} from "../services/conversation.js";
import { generateResponse, streamResponse, LLMMessage } from "../llm/claude.js";
import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";

const createConversationSchema = z.object({
  endUserId: z.string().optional(),
  channel: z.string().default("web"),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
});

export async function chatRoutes(app: FastifyInstance) {
  // Start new conversation
  app.post("/api/bots/:botId/conversations", async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const input = createConversationSchema.parse(request.body);

    const conversation = await createConversation({
      botId,
      ...input,
    });

    return reply.status(201).send({
      success: true,
      data: conversation,
    });
  });

  // Get conversation
  app.get("/api/conversations/:conversationId", async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const conversation = await getConversationById(conversationId);

    return reply.send({
      success: true,
      data: conversation,
    });
  });

  // List conversations for a bot
  app.get("/api/bots/:botId/conversations", async (request, reply) => {
    const { botId } = request.params as { botId: string };
    const { limit } = request.query as { limit?: string };

    const conversations = await getConversationsByBotId(
      botId,
      limit ? parseInt(limit) : 50
    );

    return reply.send({
      success: true,
      data: conversations,
    });
  });

  // Get message history
  app.get("/api/conversations/:conversationId/messages", async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const messages = await getConversationHistory(conversationId);

    return reply.send({
      success: true,
      data: messages,
    });
  });

  // Send message and get response
  app.post("/api/conversations/:conversationId/messages", async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const input = sendMessageSchema.parse(request.body);

    // Get conversation and bot config
    const conversation = await getConversationById(conversationId);
    const bot = await db.query.bots.findFirst({
      where: eq(schema.bots.id, conversation.botId),
    });

    if (!bot) {
      return reply.status(404).send({ error: "Bot not found" });
    }

    // Get live version for config
    const liveVersion = await db.query.botVersions.findFirst({
      where: eq(schema.botVersions.botId, bot.id),
    });

    // Add user message
    await addMessage({ conversationId, content: input.content }, "user");

    // Get conversation history
    const history = await getConversationHistory(conversationId);

    // Prepare messages for LLM
    const llmMessages: LLMMessage[] = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Generate response
    const response = await generateResponse(llmMessages, {
      model: liveVersion?.model || undefined,
      systemPrompt: liveVersion?.systemPrompt || undefined,
      temperature: liveVersion?.temperature ? liveVersion.temperature / 100 : undefined,
      maxTokens: liveVersion?.maxTokens || undefined,
    });

    // Add assistant message
    const assistantMessage = await addMessage(
      { conversationId, content: response.content },
      "assistant"
    );

    return reply.send({
      success: true,
      data: {
        message: assistantMessage,
        usage: response.usage,
      },
    });
  });

  // Stream message response (SSE)
  app.post("/api/conversations/:conversationId/messages/stream", async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const input = sendMessageSchema.parse(request.body);

    // Get conversation and bot config
    const conversation = await getConversationById(conversationId);
    const bot = await db.query.bots.findFirst({
      where: eq(schema.bots.id, conversation.botId),
    });

    if (!bot) {
      return reply.status(404).send({ error: "Bot not found" });
    }

    // Get live version for config
    const liveVersion = await db.query.botVersions.findFirst({
      where: eq(schema.botVersions.botId, bot.id),
    });

    // Add user message
    await addMessage({ conversationId, content: input.content }, "user");

    // Get conversation history
    const history = await getConversationHistory(conversationId);

    // Prepare messages for LLM
    const llmMessages: LLMMessage[] = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Set up SSE
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    let fullResponse = "";

    try {
      for await (const chunk of streamResponse(llmMessages, {
        model: liveVersion?.model || undefined,
        systemPrompt: liveVersion?.systemPrompt || undefined,
        temperature: liveVersion?.temperature ? liveVersion.temperature / 100 : undefined,
        maxTokens: liveVersion?.maxTokens || undefined,
      })) {
        fullResponse += chunk;
        reply.raw.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      // Add assistant message to history
      await addMessage({ conversationId, content: fullResponse }, "assistant");

      reply.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      reply.raw.end();
    } catch (error) {
      reply.raw.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
      reply.raw.end();
    }
  });
}

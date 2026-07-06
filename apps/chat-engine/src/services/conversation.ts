import { db, schema } from "@repo/db";
import { eq, and, desc, asc } from "drizzle-orm";

type Conversation = typeof schema.conversations.$inferSelect;
type Message = typeof schema.messages.$inferSelect;

export interface CreateConversationInput {
  botId: string;
  endUserId?: string;
  channel?: string;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
  tokens?: number;
}

export async function createConversation(input: CreateConversationInput) {
  const [conversation] = await db
    .insert(schema.conversations)
    .values({
      botId: input.botId,
      endUserId: input.endUserId,
      channel: input.channel || "web",
    })
    .returning();

  return conversation!;
}

export async function getConversationById(id: string) {
  const conversation = await db.query.conversations.findFirst({
    where: eq(schema.conversations.id, id),
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Get messages separately
  const messages = await getMessages(id);

  return { ...conversation, messages };
}

export async function getConversationsByBotId(botId: string, limit = 50) {
  const conversations = await db.query.conversations.findMany({
    where: eq(schema.conversations.botId, botId),
    limit,
  });

  // Sort by lastMessageAt descending
  conversations.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

  return conversations;
}

export async function addMessage(input: SendMessageInput, role: "user" | "assistant" | "system") {
  const [message] = await db
    .insert(schema.messages)
    .values({
      conversationId: input.conversationId,
      role,
      content: input.content,
      tokens: input.tokens,
    })
    .returning();

  // Update conversation last message time
  await db
    .update(schema.conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(schema.conversations.id, input.conversationId));

  return message!;
}

export async function getMessages(conversationId: string) {
  const messages = await db.query.messages.findMany({
    where: eq(schema.messages.conversationId, conversationId),
  });

  // Sort by createdAt ascending
  messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return messages;
}

export async function getConversationHistory(conversationId: string, limit = 50) {
  const messages = await db.query.messages.findMany({
    where: eq(schema.messages.conversationId, conversationId),
    limit,
  });

  // Sort by createdAt descending and reverse to get chronological order
  messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return messages.reverse();
}

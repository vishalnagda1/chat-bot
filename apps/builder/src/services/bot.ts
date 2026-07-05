import { db, schema } from "@repo/db";
import { eq, and } from "drizzle-orm";

type Bot = typeof schema.bots.$inferSelect;
type BotVersion = typeof schema.botVersions.$inferSelect;

export interface CreateBotInput {
  orgId: string;
  name: string;
  description?: string;
}

export interface UpdateBotInput {
  name?: string;
  description?: string;
}

export interface CreateVersionInput {
  botId: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  welcomeMessage?: string;
  config?: Record<string, unknown>;
}

export async function createBot(input: CreateBotInput) {
  const [bot] = await db
    .insert(schema.bots)
    .values({
      orgId: input.orgId,
      name: input.name,
      description: input.description,
    })
    .returning();

  // Create initial version
  await db.insert(schema.botVersions).values({
    botId: bot!.id,
    version: 1,
    isLive: false,
  });

  return bot!;
}

export async function getBotById(id: string) {
  const bot = await db.query.bots.findFirst({
    where: eq(schema.bots.id, id),
    with: {
      versions: true,
      flows: true,
    },
  });

  if (!bot) {
    throw new Error("Bot not found");
  }

  return bot;
}

export async function getBotsByOrgId(orgId: string) {
  const bots = await db.query.bots.findMany({
    where: eq(schema.bots.orgId, orgId),
    orderBy: (bots, { desc }) => [desc(bots.updatedAt)],
  });

  return bots;
}

export async function updateBot(id: string, input: UpdateBotInput) {
  const [bot] = await db
    .update(schema.bots)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.bots.id, id))
    .returning();

  return bot;
}

export async function deleteBot(id: string) {
  await db.delete(schema.bots).where(eq(schema.bots.id, id));
}

export async function createVersion(input: CreateVersionInput) {
  // Get the latest version number
  const versions = await db.query.botVersions.findMany({
    where: eq(schema.botVersions.botId, input.botId),
    orderBy: (versions, { desc }) => [desc(versions.version)],
    limit: 1,
  });

  const nextVersion = versions.length > 0 ? versions[0]!.version + 1 : 1;

  const [version] = await db
    .insert(schema.botVersions)
    .values({
      botId: input.botId,
      version: nextVersion,
      systemPrompt: input.systemPrompt,
      model: input.model,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      welcomeMessage: input.welcomeMessage,
      config: input.config,
    })
    .returning();

  return version!;
}

export async function getVersions(botId: string) {
  const versions = await db.query.botVersions.findMany({
    where: eq(schema.botVersions.botId, botId),
    orderBy: (versions, { desc }) => [desc(versions.version)],
  });

  return versions;
}

export async function publishBot(botId: string, versionId: string) {
  // Unpublish all versions
  await db
    .update(schema.botVersions)
    .set({ isLive: false })
    .where(eq(schema.botVersions.botId, botId));

  // Publish the specified version
  await db
    .update(schema.botVersions)
    .set({ isLive: true })
    .where(eq(schema.botVersions.id, versionId));

  // Update bot status
  const [bot] = await db
    .update(schema.bots)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(schema.bots.id, botId))
    .returning();

  return bot;
}

export async function getLiveVersion(botId: string) {
  const version = await db.query.botVersions.findFirst({
    where: and(
      eq(schema.botVersions.botId, botId),
      eq(schema.botVersions.isLive, true)
    ),
  });

  return version;
}

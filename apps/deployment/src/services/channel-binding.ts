import { db, schema } from "@repo/db";
import { eq, and } from "drizzle-orm";

export interface CreateChannelBindingInput {
  deploymentId: string;
  channelType: string;
  config?: Record<string, unknown>;
}

export interface UpdateChannelBindingInput {
  config?: Record<string, unknown>;
  status?: string;
}

export async function createChannelBinding(input: CreateChannelBindingInput) {
  const [binding] = await db
    .insert(schema.channelBindings)
    .values({
      deploymentId: input.deploymentId,
      channelType: input.channelType,
      config: input.config,
    })
    .returning();

  return binding!;
}

export async function getChannelBindingById(id: string) {
  const binding = await db.query.channelBindings.findFirst({
    where: eq(schema.channelBindings.id, id),
  });

  if (!binding) {
    throw new Error("Channel binding not found");
  }

  return binding;
}

export async function getChannelBindingsByDeploymentId(deploymentId: string) {
  const bindings = await db.query.channelBindings.findMany({
    where: eq(schema.channelBindings.deploymentId, deploymentId),
  });

  return bindings;
}

export async function updateChannelBinding(id: string, input: UpdateChannelBindingInput) {
  const [binding] = await db
    .update(schema.channelBindings)
    .set(input)
    .where(eq(schema.channelBindings.id, id))
    .returning();

  return binding;
}

export async function deleteChannelBinding(id: string) {
  await db.delete(schema.channelBindings).where(eq(schema.channelBindings.id, id));
}

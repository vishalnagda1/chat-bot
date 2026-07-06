import { db, schema } from "@repo/db";
import { eq, and } from "drizzle-orm";

type Deployment = typeof schema.deployments.$inferSelect;

export interface CreateDeploymentInput {
  botId: string;
  versionId: string;
  environment: "development" | "staging" | "production";
  channelConfig?: Record<string, unknown>;
}

export interface UpdateDeploymentInput {
  versionId?: string;
  status?: "pending" | "active" | "inactive" | "failed" | "rolled_back";
  channelConfig?: Record<string, unknown>;
}

export async function createDeployment(input: CreateDeploymentInput) {
  const [deployment] = await db
    .insert(schema.deployments)
    .values({
      botId: input.botId,
      versionId: input.versionId,
      environment: input.environment,
      status: "pending",
      channelConfig: input.channelConfig || {},
    })
    .returning();

  return deployment!;
}

export async function getDeploymentById(id: string) {
  const deployment = await db.query.deployments.findFirst({
    where: eq(schema.deployments.id, id),
  });

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  return deployment;
}

export async function getDeploymentsByBotId(botId: string) {
  const deployments = await db.query.deployments.findMany({
    where: eq(schema.deployments.botId, botId),
  });

  return deployments;
}

export async function updateDeployment(id: string, input: UpdateDeploymentInput) {
  const [deployment] = await db
    .update(schema.deployments)
    .set(input)
    .where(eq(schema.deployments.id, id))
    .returning();

  return deployment;
}

export async function deployBot(botId: string, versionId: string, environment: string) {
  // Check if there's an existing deployment for this environment
  const existingDeployment = await db.query.deployments.findFirst({
    where: and(
      eq(schema.deployments.botId, botId),
      eq(schema.deployments.environment, environment as "development" | "staging" | "production")
    ),
  });

  if (existingDeployment) {
    // Update existing deployment
    return updateDeployment(existingDeployment.id, {
      versionId,
      status: "active",
    });
  }

  // Create new deployment
  return createDeployment({
    botId,
    versionId,
    environment: environment as "development" | "staging" | "production",
  });
}

export async function rollbackDeployment(deploymentId: string) {
  const deployment = await getDeploymentById(deploymentId);

  // Find the previous version
  const versions = await db.query.botVersions.findMany({
    where: eq(schema.botVersions.botId, deployment.botId),
  });

  const currentVersionIndex = versions.findIndex((v) => v.id === deployment.versionId);
  if (currentVersionIndex <= 0) {
    throw new Error("No previous version to rollback to");
  }

  const previousVersion = versions[currentVersionIndex - 1];

  return updateDeployment(deploymentId, {
    versionId: previousVersion!.id,
    status: "rolled_back",
  });
}

export async function deleteDeployment(id: string) {
  await db.delete(schema.deployments).where(eq(schema.deployments.id, id));
}

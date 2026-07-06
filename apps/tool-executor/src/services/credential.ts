import { db, schema } from "@repo/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const ALGORITHM = "aes-256-gcm";

function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export interface CreateCredentialInput {
  orgId: string;
  name: string;
  type: string;
  data: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface UpdateCredentialInput {
  name?: string;
  data?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export async function createCredential(input: CreateCredentialInput) {
  const encryptedData = encrypt(JSON.stringify(input.data));

  const [credential] = await db
    .insert(schema.credentials)
    .values({
      orgId: input.orgId,
      name: input.name,
      type: input.type,
      encryptedData,
      metadata: input.metadata,
    })
    .returning();

  return credential!;
}

export async function getCredentialById(id: string, orgId: string) {
  const credential = await db.query.credentials.findFirst({
    where: and(
      eq(schema.credentials.id, id),
      eq(schema.credentials.orgId, orgId)
    ),
  });

  if (!credential) {
    throw new Error("Credential not found");
  }

  return credential;
}

export async function getDecryptedCredential(id: string, orgId: string) {
  const credential = await getCredentialById(id, orgId);
  const decryptedData = decrypt(credential.encryptedData);

  return {
    ...credential,
    data: JSON.parse(decryptedData) as Record<string, string>,
  };
}

export async function getCredentialsByOrgId(orgId: string) {
  const credentials = await db.query.credentials.findMany({
    where: eq(schema.credentials.orgId, orgId),
  });

  return credentials;
}

export async function updateCredential(id: string, orgId: string, input: UpdateCredentialInput) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (input.name) updateData.name = input.name;
  if (input.data) updateData.encryptedData = encrypt(JSON.stringify(input.data));
  if (input.metadata) updateData.metadata = input.metadata;

  const [credential] = await db
    .update(schema.credentials)
    .set(updateData)
    .where(
      and(
        eq(schema.credentials.id, id),
        eq(schema.credentials.orgId, orgId)
      )
    )
    .returning();

  return credential;
}

export async function deleteCredential(id: string, orgId: string) {
  await db
    .delete(schema.credentials)
    .where(
      and(
        eq(schema.credentials.id, id),
        eq(schema.credentials.orgId, orgId)
      )
    );
}

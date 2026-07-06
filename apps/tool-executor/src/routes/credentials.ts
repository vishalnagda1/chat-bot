import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createCredential,
  getCredentialsByOrgId,
  getDecryptedCredential,
  updateCredential,
  deleteCredential,
} from "../services/credential.js";

const createCredentialSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(["api_key", "oauth", "basic_auth", "bearer_token"]),
  data: z.record(z.string()),
  metadata: z.record(z.unknown()).optional(),
});

const updateCredentialSchema = z.object({
  name: z.string().min(1).optional(),
  data: z.record(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function credentialRoutes(app: FastifyInstance) {
  // List credentials for an org
  app.get("/api/orgs/:orgId/credentials", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };

    const credentials = await getCredentialsByOrgId(orgId);

    // Don't return encrypted data in list
    return reply.send({
      success: true,
      data: credentials.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        metadata: c.metadata,
        lastUsedAt: c.lastUsedAt,
        createdAt: c.createdAt,
      })),
    });
  });

  // Get credential (decrypted)
  app.get("/api/orgs/:orgId/credentials/:credentialId", async (request, reply) => {
    const { orgId, credentialId } = request.params as { orgId: string; credentialId: string };

    const credential = await getDecryptedCredential(credentialId, orgId);

    return reply.send({
      success: true,
      data: credential,
    });
  });

  // Create credential
  app.post("/api/orgs/:orgId/credentials", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const input = createCredentialSchema.parse({ ...request.body, orgId });

    const credential = await createCredential(input);

    return reply.status(201).send({
      success: true,
      data: {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        metadata: credential.metadata,
        createdAt: credential.createdAt,
      },
    });
  });

  // Update credential
  app.patch("/api/orgs/:orgId/credentials/:credentialId", async (request, reply) => {
    const { orgId, credentialId } = request.params as { orgId: string; credentialId: string };
    const input = updateCredentialSchema.parse(request.body);

    const credential = await updateCredential(credentialId, orgId, input);

    return reply.send({
      success: true,
      data: {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        metadata: credential.metadata,
      },
    });
  });

  // Delete credential
  app.delete("/api/orgs/:orgId/credentials/:credentialId", async (request, reply) => {
    const { orgId, credentialId } = request.params as { orgId: string; credentialId: string };

    await deleteCredential(credentialId, orgId);

    return reply.send({
      success: true,
      data: null,
    });
  });
}

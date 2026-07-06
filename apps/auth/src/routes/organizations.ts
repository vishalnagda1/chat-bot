import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createOrganization,
  getOrganizationById,
  getOrganizationsByUserId,
  addMember,
  removeMember,
  getMembers,
  updateOrg,
  deleteOrganization,
} from "../services/organization.js";
import { getUserById } from "../services/user.js";
import { requireOrgMember } from "@repo/auth-middleware";
import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";

const createOrgSchema = z.object({
  name: z.string().min(1),
});

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  plan: z.enum(["free", "pro", "enterprise"]).optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
});

export async function orgRoutes(app: FastifyInstance) {
  // List organizations
  app.get("/api/orgs", async (request, reply) => {
    const orgs = await getOrganizationsByUserId(request.user.userId);

    return reply.send({
      success: true,
      data: orgs,
    });
  });

  // Create organization
  app.post("/api/orgs", async (request, reply) => {
    const input = createOrgSchema.parse(request.body);

    const org = await createOrganization({
      ...input,
      ownerId: request.user.userId,
    });

    return reply.status(201).send({
      success: true,
      data: org,
    });
  });

  // Get organization
  app.get("/api/orgs/:orgId", { preHandler: [requireOrgMember] }, async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const org = await getOrganizationById(orgId);

    return reply.send({
      success: true,
      data: org,
    });
  });

  // Update organization
  app.patch("/api/orgs/:orgId", { preHandler: [requireOrgMember] }, async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const input = updateOrgSchema.parse(request.body);

    const org = await updateOrg(orgId, input);

    return reply.send({
      success: true,
      data: org,
    });
  });

  // Delete organization
  app.delete("/api/orgs/:orgId", { preHandler: [requireOrgMember] }, async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    await deleteOrganization(orgId);

    return reply.send({
      success: true,
      data: null,
    });
  });

  // List members
  app.get("/api/orgs/:orgId/members", { preHandler: [requireOrgMember] }, async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const members = await getMembers(orgId);

    return reply.send({
      success: true,
      data: members,
    });
  });

  // Add member
  app.post("/api/orgs/:orgId/members", { preHandler: [requireOrgMember] }, async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const input = addMemberSchema.parse(request.body);

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, input.email),
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    const membership = await addMember(orgId, user.id, input.role);

    return reply.status(201).send({
      success: true,
      data: membership,
    });
  });

  // Remove member
  app.delete("/api/orgs/:orgId/members/:userId", { preHandler: [requireOrgMember] }, async (request, reply) => {
    const { orgId, userId } = request.params as { orgId: string; userId: string };
    await removeMember(orgId, userId);

    return reply.send({
      success: true,
      data: null,
    });
  });
}

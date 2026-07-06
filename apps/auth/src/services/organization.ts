import { db, schema } from "@repo/db";
import { eq, and } from "drizzle-orm";

type Organization = typeof schema.organizations.$inferSelect;
type Membership = typeof schema.memberships.$inferSelect;

export interface CreateOrgInput {
  name: string;
  ownerId: string;
}

export async function createOrganization(input: CreateOrgInput) {
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: input.name,
      ownerId: input.ownerId,
    })
    .returning();

  // Add owner as member
  await db.insert(schema.memberships).values({
    userId: input.ownerId,
    orgId: org!.id,
    role: "owner",
  });

  return org!;
}

export async function getOrganizationById(id: string) {
  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, id),
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  return org;
}

export async function getOrganizationsByUserId(userId: string) {
  const memberships = await db.query.memberships.findMany({
    where: eq(schema.memberships.userId, userId),
  });

  const orgIds = memberships.map((m) => m.orgId);
  if (orgIds.length === 0) return [];

  const orgs = await db.query.organizations.findMany({
    where: (organizations, { inArray }) => inArray(organizations.id, orgIds),
  });

  return orgs;
}

export async function addMember(orgId: string, userId: string, role: string) {
  const [membership] = await db
    .insert(schema.memberships)
    .values({
      orgId,
      userId,
      role: role as "owner" | "admin" | "editor" | "viewer",
    })
    .returning();

  return membership!;
}

export async function removeMember(orgId: string, userId: string) {
  await db
    .delete(schema.memberships)
    .where(
      and(
        eq(schema.memberships.orgId, orgId),
        eq(schema.memberships.userId, userId)
      )
    );
}

export async function getMembers(orgId: string) {
  const memberships = await db.query.memberships.findMany({
    where: eq(schema.memberships.orgId, orgId),
  });

  if (memberships.length === 0) return [];

  const userIds = [...new Set(memberships.map((m) => m.userId))];
  const users = await db.query.users.findMany({
    where: (users, { inArray }) => inArray(users.id, userIds),
    columns: { id: true, email: true, name: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return memberships.map((m) => ({
    ...m,
    user: userMap.get(m.userId) || null,
  }));
}

export async function updateOrg(
  id: string,
  data: Partial<Pick<Organization, "name" | "plan">>
) {
  const [org] = await db
    .update(schema.organizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.organizations.id, id))
    .returning();

  return org;
}

export async function deleteOrganization(id: string) {
  await db.delete(schema.organizations).where(eq(schema.organizations.id, id));
}

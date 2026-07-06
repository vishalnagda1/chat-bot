import { db, schema } from "@repo/db";
import { eq, and, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";

type User = typeof schema.users.$inferSelect;

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function createUser(input: CreateUserInput) {
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.email, input.email),
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const [user] = await db
    .insert(schema.users)
    .values({
      email: input.email,
      passwordHash,
      name: input.name,
    })
    .returning();

  return user!;
}

export async function loginUser(input: LoginInput) {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, input.email),
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error("Invalid credentials");
  }

  return user;
}

export async function getUserById(id: string) {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, "name" | "email">>
) {
  const [user] = await db
    .update(schema.users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.users.id, id))
    .returning();

  return user;
}

// Session management
export async function createSession(userId: string, token: string, expiresAt: Date) {
  const [session] = await db
    .insert(schema.sessions)
    .values({
      userId,
      token,
      expiresAt,
    })
    .returning();

  return session!;
}

export async function getSessionByToken(token: string) {
  const session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.token, token),
  });

  return session;
}

export async function deleteSession(token: string) {
  await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
}

export async function deleteAllUserSessions(userId: string) {
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

export async function deleteExpiredSessions() {
  await db
    .delete(schema.sessions)
    .where(lt(schema.sessions.expiresAt, new Date()));
}

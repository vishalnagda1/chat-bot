import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// Role enum
export const roleEnum = pgEnum("role", ["owner", "admin", "editor", "viewer"]);

// Plan enum
export const planEnum = pgEnum("plan", ["free", "pro", "enterprise"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: uuid("owner_id")
    .references(() => users.id)
    .notNull(),
  plan: planEnum("plan").default("free").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Memberships table (links users to organizations)
export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  role: roleEnum("role").default("viewer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API Keys table
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: text("key_hash").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sessions table
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bot status enum
export const botStatusEnum = pgEnum("bot_status", ["draft", "published"]);

// Bots table
export const bots = pgTable("bots", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: botStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bot versions table
export const botVersions = pgTable("bot_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  botId: uuid("bot_id")
    .references(() => bots.id)
    .notNull(),
  version: integer("version").notNull(),
  systemPrompt: text("system_prompt"),
  model: varchar("model", { length: 100 }).default("claude-sonnet-5-20250514"),
  temperature: integer("temperature").default(70), // 0-100 scale
  maxTokens: integer("max_tokens").default(4096),
  welcomeMessage: text("welcome_message"),
  isLive: boolean("is_live").default(false),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Flows table (visual flow editor)
export const flows = pgTable("flows", {
  id: uuid("id").defaultRandom().primaryKey(),
  botId: uuid("bot_id")
    .references(() => bots.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nodes: jsonb("nodes").default([]),
  edges: jsonb("edges").default([]),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tools table
export const tools = pgTable("tools", {
  id: uuid("id").defaultRandom().primaryKey(),
  botId: uuid("bot_id")
    .references(() => bots.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // api_call, database, code, email, sms, file
  config: jsonb("config"),
  parametersSchema: jsonb("parameters_schema"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

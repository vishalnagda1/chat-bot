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
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
}, (table) => [
  index("memberships_user_id_idx").on(table.userId),
  index("memberships_org_id_idx").on(table.orgId),
]);

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

// Credentials table (encrypted secrets vault)
export const credentials = pgTable("credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // api_key, oauth, basic_auth, bearer_token
  encryptedData: text("encrypted_data").notNull(),
  metadata: jsonb("metadata"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
  index("sessions_token_idx").on(table.token),
  index("sessions_expires_at_idx").on(table.expiresAt),
]);

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
  provider: varchar("provider", { length: 50 }).default("anthropic"), // anthropic, openai
  systemPrompt: text("system_prompt"),
  model: varchar("model", { length: 100 }).default("claude-sonnet-5-20250514"),
  temperature: integer("temperature").default(70), // 0-100 scale
  maxTokens: integer("max_tokens").default(4096),
  welcomeMessage: text("welcome_message"),
  isLive: boolean("is_live").default(false),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("bot_versions_bot_id_idx").on(table.botId),
  index("bot_versions_bot_id_is_live_idx").on(table.botId, table.isLive),
]);

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
}, (table) => [
  index("flows_bot_id_idx").on(table.botId),
]);

// Flow versions table (snapshots)
export const flowVersions = pgTable("flow_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  flowId: uuid("flow_id")
    .references(() => flows.id)
    .notNull(),
  version: integer("version").notNull(),
  nodes: jsonb("nodes").default([]),
  edges: jsonb("edges").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("flow_versions_flow_id_idx").on(table.flowId),
]);

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

// Message role enum
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"]);

// End users table (people chatting with bots)
export const endUsers = pgTable("end_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  botId: uuid("bot_id")
    .references(() => bots.id)
    .notNull(),
  externalId: varchar("external_id", { length: 255 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  botId: uuid("bot_id")
    .references(() => bots.id)
    .notNull(),
  endUserId: uuid("end_user_id")
    .references(() => endUsers.id),
  channel: varchar("channel", { length: 50 }).default("web"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  tokens: integer("tokens"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("messages_conversation_id_idx").on(table.conversationId),
]);

// Tool executions table
export const toolExecutions = pgTable("tool_executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolId: uuid("tool_id")
    .references(() => tools.id)
    .notNull(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  input: jsonb("input"),
  output: jsonb("output"),
  status: varchar("status", { length: 20 }).default("pending"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Deployment status enum
export const deploymentStatusEnum = pgEnum("deployment_status", [
  "pending",
  "active",
  "inactive",
  "failed",
  "rolled_back",
]);

// Environment enum
export const environmentEnum = pgEnum("environment", [
  "development",
  "staging",
  "production",
]);

// Deployments table
export const deployments = pgTable("deployments", {
  id: uuid("id").defaultRandom().primaryKey(),
  botId: uuid("bot_id")
    .references(() => bots.id)
    .notNull(),
  versionId: uuid("version_id")
    .references(() => botVersions.id)
    .notNull(),
  environment: environmentEnum("environment").notNull(),
  status: deploymentStatusEnum("status").default("pending"),
  channelConfig: jsonb("channel_config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Channel bindings table
export const channelBindings = pgTable("channel_bindings", {
  id: uuid("id").defaultRandom().primaryKey(),
  deploymentId: uuid("deployment_id")
    .references(() => deployments.id)
    .notNull(),
  channelType: varchar("channel_type", { length: 50 }).notNull(), // web, slack, whatsapp, telegram, api
  config: jsonb("config"),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  botId: uuid("bot_id").references(() => bots.id),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("events_org_id_idx").on(table.orgId),
  index("events_bot_id_idx").on(table.botId),
  index("events_event_type_idx").on(table.eventType),
]);

// Usage metrics table
export const usageMetrics = pgTable("usage_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  botId: uuid("bot_id")
    .references(() => bots.id)
    .notNull(),
  metricType: varchar("metric_type", { length: 100 }).notNull(),
  value: integer("value").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  orgId: uuid("org_id")
    .references(() => organizations.id)
    .notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  auditLogs: many(auditLogs),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id],
  }),
  memberships: many(memberships),
  bots: many(bots),
  apiKeys: many(apiKeys),
  events: many(events),
  usageMetrics: many(usageMetrics),
  auditLogs: many(auditLogs),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  org: one(organizations, {
    fields: [memberships.orgId],
    references: [organizations.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  org: one(organizations, {
    fields: [apiKeys.orgId],
    references: [organizations.id],
  }),
}));

export const credentialsRelations = relations(credentials, ({ one }) => ({
  org: one(organizations, {
    fields: [credentials.orgId],
    references: [organizations.id],
  }),
}));

export const botsRelations = relations(bots, ({ one, many }) => ({
  org: one(organizations, {
    fields: [bots.orgId],
    references: [organizations.id],
  }),
  versions: many(botVersions),
  flows: many(flows),
  tools: many(tools),
  endUsers: many(endUsers),
  conversations: many(conversations),
  deployments: many(deployments),
  events: many(events),
  usageMetrics: many(usageMetrics),
}));

export const botVersionsRelations = relations(botVersions, ({ one }) => ({
  bot: one(bots, {
    fields: [botVersions.botId],
    references: [bots.id],
  }),
}));

export const flowsRelations = relations(flows, ({ one, many }) => ({
  bot: one(bots, {
    fields: [flows.botId],
    references: [bots.id],
  }),
  versions: many(flowVersions),
}));

export const flowVersionsRelations = relations(flowVersions, ({ one }) => ({
  flow: one(flows, {
    fields: [flowVersions.flowId],
    references: [flows.id],
  }),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  bot: one(bots, {
    fields: [tools.botId],
    references: [bots.id],
  }),
}));

export const endUsersRelations = relations(endUsers, ({ one, many }) => ({
  bot: one(bots, {
    fields: [endUsers.botId],
    references: [bots.id],
  }),
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  bot: one(bots, {
    fields: [conversations.botId],
    references: [bots.id],
  }),
  endUser: one(endUsers, {
    fields: [conversations.endUserId],
    references: [endUsers.id],
  }),
  messages: many(messages),
  toolExecutions: many(toolExecutions),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const toolExecutionsRelations = relations(toolExecutions, ({ one }) => ({
  tool: one(tools, {
    fields: [toolExecutions.toolId],
    references: [tools.id],
  }),
  conversation: one(conversations, {
    fields: [toolExecutions.conversationId],
    references: [conversations.id],
  }),
}));

export const deploymentsRelations = relations(deployments, ({ one, many }) => ({
  bot: one(bots, {
    fields: [deployments.botId],
    references: [bots.id],
  }),
  version: one(botVersions, {
    fields: [deployments.versionId],
    references: [botVersions.id],
  }),
  channelBindings: many(channelBindings),
}));

export const channelBindingsRelations = relations(channelBindings, ({ one }) => ({
  deployment: one(deployments, {
    fields: [channelBindings.deploymentId],
    references: [deployments.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  org: one(organizations, {
    fields: [events.orgId],
    references: [organizations.id],
  }),
  bot: one(bots, {
    fields: [events.botId],
    references: [bots.id],
  }),
}));

export const usageMetricsRelations = relations(usageMetrics, ({ one }) => ({
  org: one(organizations, {
    fields: [usageMetrics.orgId],
    references: [organizations.id],
  }),
  bot: one(bots, {
    fields: [usageMetrics.botId],
    references: [bots.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  org: one(organizations, {
    fields: [auditLogs.orgId],
    references: [organizations.id],
  }),
}));

# Chatbot Builder Platform — Implementation Plan

## Architecture Overview

| Service | Core Responsibility | Owns Data |
|---|---|---|
| **Auth** | Identity, orgs, RBAC, API keys, sessions | Users, orgs, roles, tokens |
| **Builder** | Bot definitions, flows, prompts, versions | Bot configs, drafts, versions |
| **Chat Engine** | Runtime conversation orchestration, LLM calls | Conversations, messages, state |
| **Tool Executor** | Sandboxed execution of bot tools/functions | Tool definitions, run logs |
| **Deployment** | Publish bots, channel connectors, webhooks | Deployments, channel bindings |
| **Analytics** | Usage metrics, conversation insights, dashboards | Events, aggregates |

**Cross-cutting from day one:** an API gateway, a shared event bus (e.g. Kafka/NATS) for async cross-service events, per-service databases, and centralized structured logging + trace IDs.

---

## Phase 1 — MVP (Auth + Builder + Chat Engine basic)

**Goal:** A user can sign up, build a simple prompt-based bot, and chat with it in a test console.

### Foundation (do first)
- Repo/monorepo structure, service scaffolding, CI pipeline (lint/test/build).
- API gateway + service-to-service auth (signed internal JWTs or mTLS).
- Shared libraries: error format, logging, trace-ID propagation, config loader.
- Local dev environment (docker-compose) + one deployable staging environment.

### Auth
- User registration, login, password reset, email verification.
- Organization/workspace model; invite flow; org membership.
- RBAC with baseline roles (Owner, Editor, Viewer).
- JWT issuance + refresh; session management.
- API key generation/rotation for programmatic access.
- Token introspection endpoint used by the gateway/other services.

### Builder
- Bot CRUD (name, description, owner org).
- Bot configuration schema: system prompt, model selection, temperature, greeting.
- Draft vs. published version model; version history + rollback.
- Config validation on save.
- Emit `bot.updated` / `bot.published` events to the bus.
- Read API for Chat Engine to fetch the active bot config.

### Chat Engine (basic)
- Conversation + message data model; session lifecycle.
- Orchestration loop: load bot config → assemble context → call LLM → return response.
- LLM provider integration (default to latest Claude models — Opus 4.8 / Sonnet 5 / Haiku 4.5; abstract behind a provider interface).
- Streaming responses (SSE/WebSocket).
- Conversation history persistence + context-window management/truncation.
- Test/preview chat console wired into Builder.
- Basic rate limiting per org.

**Phase 1 exit criteria:** signed-in user builds a prompt bot, publishes it, and holds a streaming conversation in the preview console. End-to-end tracing works.

---

## Phase 2 — Core (Tool Executor + Deployment + channels)

**Goal:** Bots do real work via tools and are reachable on external channels.

### Tool Executor
- Tool definition schema (name, description, JSON-schema parameters) — surfaced in Builder.
- Sandboxed runtime (isolated containers/VMs or a serverless runner) with CPU/mem/time limits.
- Tool types: HTTP/REST call, code snippet, and internal built-ins.
- Secrets/credential vault for tool auth (per-org, encrypted at rest).
- Execution logging, retries, timeouts, and error surfacing back to Chat Engine.
- Concurrency limits + per-org quotas.

### Chat Engine (tool-calling upgrade)
- Tool-use loop: model requests tool → call Tool Executor → feed result back → continue.
- Parallel tool calls; guardrails on max tool iterations per turn.
- Tool-result injection into context.

### Builder (tool + flow upgrade)
- Attach/configure tools on a bot; map credentials.
- Optional visual flow/graph editor for multi-step logic and branching.
- Config validation extended to tool references.

### Deployment + Channels
- Publish pipeline: promote a Builder version to a live deployment (staged/blue-green).
- Deployment records, environments (dev/prod), and instant rollback.
- Channel connectors: **Web widget (embeddable JS)**, **Slack**, **WhatsApp/Twilio**, **generic webhook/REST API**.
- Inbound message normalization → Chat Engine; outbound formatting per channel.
- Per-channel auth (OAuth installs, verification tokens, signature checks).
- Delivery reliability: queueing, retries, dead-letter handling.

**Phase 2 exit criteria:** a bot calls an external API via a sandboxed tool and is live on at least the web widget + one messaging channel, with rollback working.

---

## Phase 3 — Enterprise (Analytics + compliance)

**Goal:** Visibility, governance, and controls required for enterprise buyers.

### Analytics
- Event ingestion pipeline from all services (conversations, tool runs, deployments).
- Metrics: active users, conversation volume, resolution/completion, latency, token cost, tool success rates.
- Dashboards + date-range filtering; per-bot and per-org views.
- Conversation-level drill-down and transcript search.
- Data export (CSV/API) and scheduled reports.
- Optional feedback signals (thumbs up/down, CSAT) feeding quality metrics.

### Compliance & Governance
- Audit logs (immutable) for auth, config changes, deployments, data access.
- Data retention policies + configurable auto-deletion per org.
- PII detection/redaction in stored transcripts.
- GDPR/CCPA support: data export + right-to-erasure workflows.
- SSO/SAML + SCIM provisioning (extends Auth).
- Fine-grained RBAC + custom roles; scoped API keys.
- Encryption review (at rest + in transit), secrets rotation policy.
- Data residency/region isolation options.
- SOC 2 readiness: access reviews, change management, monitoring/alerting.
- Content moderation + guardrails on inputs/outputs.

**Phase 3 exit criteria:** admins see usage dashboards, audit trails are queryable, SSO works, and erasure/retention policies are enforceable — passing a compliance/security review.

---

## Sequencing Notes & Risks
- **Auth is the critical-path dependency** — every service consumes it; build its token model to anticipate SSO/SCIM (Phase 3) so you don't re-architect later.
- **Define the event schema in Phase 1** even though Analytics arrives in Phase 3 — emit events from the start so historical data exists when dashboards ship.
- **Tool Executor sandboxing is the highest-risk item** — it's a security boundary; budget extra time and a dedicated security review.
- **Channel connectors are individually small but collectively long** — treat each channel as its own shippable increment rather than one big task.
- **Design the config/version schema for extensibility in Phase 1**, since Builder gains tools (P2) and governance controls (P3) that layer onto it.

---

## Project Structure

### Monorepo Layout (Turborepo + pnpm)

```
chat-bot/
├── package.json                      # root workspace + turbo scripts
├── pnpm-workspace.yaml               # workspace globs
├── turbo.json                        # pipeline config
├── tsconfig.base.json                # shared compiler options
├── .npmrc
├── .env.example
├── .dockerignore
├── docker-compose.yml
│
├── apps/                             # 6 deployable microservices
│   ├── auth/
│   │   ├── src/
│   │   │   ├── index.ts              # service entrypoint
│   │   │   ├── app.ts                # framework wiring
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── db/
│   │   │   │   ├── schema.ts
│   │   │   │   └── migrations/
│   │   │   └── config.ts
│   │   ├── test/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── builder/                      # same layout as auth
│   ├── chat-engine/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── ws/                   # websocket/streaming
│   │   │   └── llm/                  # Claude client
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── tool-executor/
│   ├── deployment/
│   └── analytics/
│
├── packages/                         # shared internal libraries
│   ├── config-eslint/                # @repo/eslint-config
│   ├── config-typescript/            # @repo/tsconfig
│   ├── logger/                       # @repo/logger (pino)
│   ├── types/                        # @repo/types (shared DTOs)
│   ├── events/                       # @repo/events (zod schemas)
│   └── db/                           # @repo/db (drizzle client)
│
├── infra/
│   ├── postgres/init/
│   └── grafana/
│
└── .github/
    └── workflows/ci.yml
```

### Workspace Configuration

**pnpm-workspace.yaml:**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Root package.json:**
```json
{
  "name": "chat-bot",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "db:migrate": "turbo run db:migrate",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.1.0",
    "typescript": "^5.6.0",
    "@types/node": "^20.16.0"
  }
}
```

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "db:migrate": { "cache": false },
    "clean": { "cache": false }
  }
}
```

### Docker Compose (Local Dev)

```yaml
name: chat-bot

x-service-defaults: &service-defaults
  build:
    context: .
    target: dev
  restart: unless-stopped
  env_file: .env
  depends_on:
    postgres: { condition: service_healthy }
    redis: { condition: service_started }

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: chatbot
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./infra/postgres/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev -d chatbot"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: ["redisdata:/data"]

  nats:
    image: nats:2.10-alpine
    command: ["-js"]
    ports: ["4222:4222", "8222:8222"]

  auth:
    <<: *service-defaults
    build: { context: ., dockerfile: apps/auth/Dockerfile, target: dev }
    ports: ["3001:3000"]
    volumes: ["./apps/auth:/app/apps/auth", "/app/node_modules"]
    command: pnpm --filter @repo/auth dev

  builder:
    <<: *service-defaults
    build: { context: ., dockerfile: apps/builder/Dockerfile, target: dev }
    ports: ["3002:3000"]
    volumes: ["./apps/builder:/app/apps/builder", "/app/node_modules"]
    command: pnpm --filter @repo/builder dev

  chat-engine:
    <<: *service-defaults
    build: { context: ., dockerfile: apps/chat-engine/Dockerfile, target: dev }
    ports: ["3003:3000"]
    environment: { ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY} }
    volumes: ["./apps/chat-engine:/app/apps/chat-engine", "/app/node_modules"]
    command: pnpm --filter @repo/chat-engine dev

  tool-executor:
    <<: *service-defaults
    build: { context: ., dockerfile: apps/tool-executor/Dockerfile, target: dev }
    ports: ["3004:3000"]
    volumes: ["./apps/tool-executor:/app/apps/tool-executor", "/app/node_modules"]
    command: pnpm --filter @repo/tool-executor dev

  deployment:
    <<: *service-defaults
    build: { context: ., dockerfile: apps/deployment/Dockerfile, target: dev }
    ports: ["3005:3000"]
    volumes: ["./apps/deployment:/app/apps/deployment", "/app/node_modules"]
    command: pnpm --filter @repo/deployment dev

  analytics:
    <<: *service-defaults
    build: { context: ., dockerfile: apps/analytics/Dockerfile, target: dev }
    ports: ["3006:3000"]
    volumes: ["./apps/analytics:/app/apps/analytics", "/app/node_modules"]
    command: pnpm --filter @repo/analytics dev

volumes:
  pgdata:
  redisdata:
```

### Port Map

| Service | Host Port | Container Port |
|---------|-----------|----------------|
| auth | 3001 | 3000 |
| builder | 3002 | 3000 |
| chat-engine | 3003 | 3000 |
| tool-executor | 3004 | 3000 |
| deployment | 3005 | 3000 |
| analytics | 3006 | 3000 |
| postgres | 5432 | 5432 |
| redis | 6379 | 6379 |
| nats | 4222 | 4222 |

### Service Dockerfile Template

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/auth/package.json ./apps/auth/package.json
RUN pnpm install --frozen-lockfile

FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "--filter", "@repo/auth", "dev"]

FROM base AS build
COPY . .
RUN pnpm --filter @repo/auth... build

FROM node:20-alpine AS prod
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/auth/dist ./apps/auth/dist
COPY --from=build /app/apps/auth/package.json ./apps/auth/package.json
COPY --from=build /app/packages ./packages
EXPOSE 3000
CMD ["node", "apps/auth/dist/index.js"]
```

### Environment Variables

```bash
NODE_ENV=development
DATABASE_URL=postgres://dev:dev@postgres:5432/chatbot
REDIS_URL=redis://redis:6379
NATS_URL=nats://nats:4222
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=change-me
LOG_LEVEL=debug
```

---

## Database Schemas

### Auth Service Tables

| Table | Key Columns |
|-------|-------------|
| **users** | `id`, `email`, `password_hash`, `name`, `created_at` |
| **sessions** | `id`, `user_id` (FK), `token`, `expires_at`, `created_at` |
| **organizations** | `id`, `name`, `owner_id` (FK), `plan`, `created_at` |
| **memberships** | `id`, `user_id` (FK), `org_id` (FK), `role` |
| **api_keys** | `id`, `org_id` (FK), `key_hash`, `name`, `last_used_at`, `created_at` |

### Builder Service Tables

| Table | Key Columns |
|-------|-------------|
| **bots** | `id`, `org_id` (FK), `name`, `description`, `status` (draft/published), `created_at` |
| **bot_versions** | `id`, `bot_id` (FK), `version`, `config` (JSON), `system_prompt`, `model`, `is_live`, `created_at` |
| **bot_settings** | `bot_id` (FK), `temperature`, `max_tokens`, `welcome_message` |
| **tools** | `id`, `bot_id` (FK), `name`, `type`, `config` (JSON), `created_at` |
| **flows** | `id`, `bot_id` (FK), `name`, `graph` (JSON nodes+edges), `version`, `created_at` |

### Chat Engine Tables

| Table | Key Columns |
|-------|-------------|
| **conversations** | `id`, `bot_id` (FK), `end_user_id`, `channel`, `started_at`, `last_message_at` |
| **messages** | `id`, `conversation_id` (FK), `role` (user/assistant/system), `content`, `tokens`, `created_at` |
| **end_users** | `id`, `bot_id` (FK), `external_id`, `metadata` (JSON), `created_at` |

### Tool Executor Tables

| Table | Key Columns |
|-------|-------------|
| **tool_definitions** | `id`, `org_id`, `name`, `description`, `parameters_schema` (JSON), `created_at` |
| **tool_executions** | `id`, `tool_id`, `conversation_id`, `input` (JSON), `output` (JSON), `status`, `latency_ms`, `created_at` |
| **credentials** | `id`, `org_id`, `name`, `type`, `encrypted_data`, `created_at` |

### Deployment Service Tables

| Table | Key Columns |
|-------|-------------|
| **deployments** | `id`, `bot_id`, `version_id`, `environment`, `status`, `channel_config` (JSON), `created_at` |
| **channel_bindings** | `id`, `deployment_id`, `channel_type`, `config` (JSON), `status`, `created_at` |

### Analytics Service Tables

| Table | Key Columns |
|-------|-------------|
| **events** | `id`, `org_id`, `bot_id`, `event_type`, `payload` (JSON), `created_at` |
| **usage_metrics** | `id`, `org_id`, `bot_id`, `metric_type`, `value`, `period_start`, `period_end` |
| **audit_logs** | `id`, `user_id`, `org_id`, `action`, `resource_type`, `resource_id`, `metadata`, `created_at` |

---

## API Endpoints

### Auth Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Authenticate and receive JWT |
| POST | `/api/auth/logout` | Invalidate current session |
| POST | `/api/auth/refresh` | Exchange refresh token for new access token |
| GET | `/api/auth/me` | Get authenticated user |
| GET | `/api/orgs` | List user's organizations |
| POST | `/api/orgs` | Create new organization |
| GET | `/api/orgs/{orgId}` | Get organization details |
| PATCH | `/api/orgs/{orgId}` | Update organization settings |
| DELETE | `/api/orgs/{orgId}` | Delete organization |
| GET | `/api/orgs/{orgId}/members` | List org members |
| POST | `/api/orgs/{orgId}/members` | Invite/add member |
| DELETE | `/api/orgs/{orgId}/members/{userId}` | Remove member |

### Builder Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bots` | List all bots (scoped to org) |
| POST | `/api/bots` | Create new bot |
| GET | `/api/bots/{botId}` | Get bot config/metadata |
| PATCH | `/api/bots/{botId}` | Update bot settings |
| DELETE | `/api/bots/{botId}` | Delete bot |
| POST | `/api/bots/{botId}/publish` | Publish/deploy current flow |
| GET | `/api/bots/{botId}/flow` | Load bot flow definition |
| PUT | `/api/bots/{botId}/flow` | Save/overwrite bot flow |
| GET | `/api/bots/{botId}/flow/versions` | List saved flow versions |
| POST | `/api/bots/{botId}/flow/versions` | Snapshot current flow as new version |

### Chat Engine

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bots/{botId}/conversations` | Start new conversation |
| POST | `/api/conversations/{id}/messages` | Send message, get bot reply (SSE) |
| GET | `/api/conversations/{id}/messages` | Get message history |
| GET | `/api/conversations/{id}` | Get conversation metadata |
| GET | `/api/bots/{botId}/conversations` | List bot conversations |

### Conventions

- Auth: `Authorization: Bearer <token>`
- Org scoping: `X-Org-Id` header or token claim
- Streaming: SSE on `POST /messages` endpoint
- REST: JSON request/response bodies

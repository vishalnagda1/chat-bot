# ChatBot Builder — API Reference

> **Version:** 1.0.0 | **Base URL:** `http://localhost` (via nginx) or `http://localhost:<port>` (direct)

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Service Ports](#service-ports)
- [Auth Service (Port 3001)](#auth-service)
- [Builder Service (Port 3002)](#builder-service)
- [Chat Engine (Port 3003)](#chat-engine)
- [Tool Executor (Port 3004)](#tool-executor)
- [Deployment Service (Port 3005)](#deployment-service)
- [Analytics Service (Port 3006)](#analytics-service)
- [Database Schema](#database-schema)
- [Environment Configuration](#environment-configuration)
- [SSE Streaming](#sse-streaming)
- [Embeddable Widget](#embeddable-widget)

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Gateway    │────▶│  Auth Svc    │
│  (Next.js)   │     │   (nginx)    │     │  :3001       │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────┼──────────────────────────┐
                    │      │                          │
              ┌─────▼──┐ ┌─▼──────────┐  ┌───────────▼┐
              │ Builder │ │ Chat Engine│  │  Analytics  │
              │  :3002  │ │   :3003    │  │    :3006    │
              └─────────┘ └────────────┘  └────────────┘
                    │           │
              ┌─────▼──┐ ┌─────▼────────┐
              │  Tool   │ │  Deployment  │
              │Executor │ │    :3005     │
              │  :3004  │ └──────────────┘
              └─────────┘
                    │
         ┌──────────┼──────────┐
    ┌────▼───┐ ┌────▼───┐ ┌───▼────┐
    │Postgres│ │ Redis  │ │  NATS  │
    │ :5433  │ │ :6379  │ │ :4222  │
    └────────┘ └────────┘ └────────┘
```

**Microservices:**

| Service | Port | Responsibility |
|---------|------|----------------|
| Auth | 3001 | User registration, login, JWT, organizations, RBAC |
| Builder | 3002 | Bot CRUD, flow editor, versioning, publish |
| Chat Engine | 3003 | Multi-provider LLM, conversations, streaming |
| Tool Executor | 3004 | API calls, code execution, email, SMS, credentials vault |
| Deployment | 3005 | Channel connectors, rollback, widget generation |
| Analytics | 3006 | Event tracking, metrics, audit logs, dashboard |

---

## Authentication

All services use JWT-based authentication via a shared middleware (`@repo/auth-middleware`).

### Obtaining a Token

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "John" },
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### Using the Token

Include the token in the `Authorization` header for all authenticated requests:

```
Authorization: Bearer <token>
```

### Token Lifecycle

- **Access Token:** Expires in 15 minutes
- **Refresh Token:** Expires in 7 days
- Use `POST /api/auth/refresh` to get a new access token

### Auth Exemptions

The following routes do **not** require authentication:
- `GET /health` (all services)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

### Role-Based Access Control

Organizations use four roles:

| Role | Permissions |
|------|-------------|
| `owner` | Full access, delete org, manage billing |
| `admin` | Manage members, create/edit bots, deploy |
| `editor` | Create/edit bots and flows |
| `viewer` | Read-only access to org resources |

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

### Validation Errors (Zod)

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "[{\"code\":\"invalid_type\",\"expected\":\"string\",\"received\":\"undefined\",\"path\":[\"name\"],\"message\":\"Required\"}]"
}
```

---

## Rate Limiting

The Chat Engine applies rate limiting:

- **Limit:** 30 requests per minute per user
- **Applies to:** `POST /api/conversations/:id/messages` and `POST /api/conversations/:id/messages/stream`
- **Response on limit:** `429 Too Many Requests`

---

## Service Ports

When running via Docker Compose, services are exposed on these host ports:

| Service | Direct Access | Via Nginx |
|---------|---------------|-----------|
| Auth | `localhost:3001` | `localhost/api/auth/*`, `localhost/api/orgs/*` |
| Builder | `localhost:3002` | `localhost/api/bots/*`, `localhost/api/flows/*` |
| Chat Engine | `localhost:3003` | `localhost/api/conversations/*` |
| Tool Executor | `localhost:3004` | `localhost/api/tools/*`, `localhost/api/orgs/:id/credentials/*` |
| Deployment | `localhost:3005` | `localhost/api/deployments/*`, `localhost/api/channel-bindings/*` |
| Analytics | `localhost:3006` | `localhost/api/events`, `localhost/api/metrics/*`, `localhost/api/dashboard/*`, `localhost/api/audit` |
| PostgreSQL | `localhost:5433` | — |
| Redis | `localhost:6379` | — |
| NATS | `localhost:4222` | — |

---

## Auth Service

**Base URL:** `http://localhost:3001`

### POST /api/auth/register

Register a new user account.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",    // required, valid email
  "password": "password123",      // required, min 8 characters
  "name": "John Doe"              // required, min 1 character
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" },
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

---

### POST /api/auth/login

Authenticate with email and password.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" },
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

---

### POST /api/auth/refresh

Get a new access token using a refresh token.

**Auth Required:** No

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

**Errors:**
- `401` — Invalid or expired refresh token

---

### POST /api/auth/logout

Invalidate the current session.

**Auth Required:** Yes

**Response (200):**
```json
{ "success": true, "data": null }
```

---

### GET /api/auth/me

Get the current authenticated user's profile.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": { "id": "uuid", "email": "user@example.com", "name": "John Doe" }
}
```

---

### GET /api/orgs

List all organizations the current user belongs to.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Org",
      "ownerId": "uuid",
      "plan": "free",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/orgs

Create a new organization. The creator becomes the `owner`.

**Auth Required:** Yes

**Request Body:**
```json
{ "name": "My Organization" }
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Organization",
    "ownerId": "user-uuid",
    "plan": "free",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  }
}
```

---

### GET /api/orgs/:orgId

Get an organization by ID.

**Auth Required:** Yes + `requireOrgMember`

**Params:** `orgId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "My Org", "ownerId": "uuid", "plan": "free", ... }
}
```

---

### PATCH /api/orgs/:orgId

Update organization name or plan.

**Auth Required:** Yes + `requireOrgMember`

**Params:** `orgId` (UUID)

**Request Body:**
```json
{
  "name": "New Name",           // optional
  "plan": "pro"                 // optional, one of: "free", "pro", "enterprise"
}
```

**Response (200):**
```json
{ "success": true, "data": { "id": "uuid", "name": "New Name", "plan": "pro", ... } }
```

---

### DELETE /api/orgs/:orgId

Delete an organization.

**Auth Required:** Yes + `requireOrgMember`

**Params:** `orgId` (UUID)

**Response (200):**
```json
{ "success": true, "data": null }
```

---

### GET /api/orgs/:orgId/members

List all members of an organization.

**Auth Required:** Yes + `requireOrgMember`

**Params:** `orgId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "membership-uuid",
      "userId": "user-uuid",
      "orgId": "org-uuid",
      "role": "owner",
      "createdAt": "2026-01-01T00:00:00Z",
      "user": { "id": "user-uuid", "email": "user@example.com", "name": "John" }
    }
  ]
}
```

---

### POST /api/orgs/:orgId/members

Add a member to an organization by email.

**Auth Required:** Yes + `requireOrgMember`

**Params:** `orgId` (UUID)

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "editor"              // one of: "admin", "editor", "viewer"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { "id": "uuid", "userId": "uuid", "orgId": "uuid", "role": "editor", ... }
}
```

**Errors:**
- `404` — User with that email not found

---

### DELETE /api/orgs/:orgId/members/:userId

Remove a member from an organization.

**Auth Required:** Yes + `requireOrgMember`

**Params:** `orgId` (UUID), `userId` (UUID)

**Response (200):**
```json
{ "success": true, "data": null }
```

---

## Builder Service

**Base URL:** `http://localhost:3002`

### Bot Management

#### GET /api/bots

List all bots for an organization.

**Auth Required:** Yes + `requireOrgMember`

**Query Params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `orgId` | UUID | Yes | Organization ID |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orgId": "uuid",
      "name": "Support Bot",
      "description": "Customer support chatbot",
      "status": "draft",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/bots

Create a new bot.

**Auth Required:** Yes + `requireOrgMember`

**Request Body:**
```json
{
  "orgId": "uuid",              // required
  "name": "Support Bot",       // required, min 1 char
  "description": "Helps users" // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orgId": "uuid",
    "name": "Support Bot",
    "description": "Helps users",
    "status": "draft",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  }
}
```

---

#### GET /api/bots/:botId

Get a bot by ID.

**Auth Required:** Yes + `requireBotAccess`

**Params:** `botId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": { "id": "uuid", "orgId": "uuid", "name": "Support Bot", "status": "draft", ... }
}
```

---

#### PATCH /api/bots/:botId

Update a bot's name or description.

**Auth Required:** Yes + `requireBotAccess`

**Params:** `botId` (UUID)

**Request Body:**
```json
{
  "name": "New Name",            // optional
  "description": "Updated desc" // optional
}
```

**Response (200):**
```json
{ "success": true, "data": { ... } }
```

---

#### DELETE /api/bots/:botId

Delete a bot.

**Auth Required:** Yes + `requireBotAccess`

**Params:** `botId` (UUID)

**Response (200):**
```json
{ "success": true, "data": null }
```

---

### Bot Versioning

#### GET /api/bots/:botId/versions

List all versions of a bot.

**Auth Required:** Yes + `requireBotAccess`

**Params:** `botId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "botId": "uuid",
      "version": 2,
      "provider": "anthropic",
      "systemPrompt": "You are a helpful assistant.",
      "model": "claude-sonnet-5-20250514",
      "temperature": 70,
      "maxTokens": 4096,
      "welcomeMessage": "Hello!",
      "isLive": true,
      "config": null,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/bots/:botId/versions

Create a new version of a bot.

**Auth Required:** Yes + `requireBotAccess`

**Params:** `botId` (UUID)

**Request Body:**
```json
{
  "provider": "anthropic",       // optional, "anthropic" | "openai"
  "systemPrompt": "You are a helpful assistant.",  // optional
  "model": "claude-sonnet-5-20250514",             // optional
  "temperature": 70,             // optional, 0-100 scale (70 = 0.7)
  "maxTokens": 4096,             // optional, 1-100000
  "welcomeMessage": "Hello!",   // optional
  "config": {}                   // optional, arbitrary JSON
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "botId": "uuid",
    "version": 1,
    "provider": "anthropic",
    "systemPrompt": "You are a helpful assistant.",
    "model": "claude-sonnet-5-20250514",
    "temperature": 70,
    "maxTokens": 4096,
    "welcomeMessage": "Hello!",
    "isLive": false,
    "config": null,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

#### POST /api/bots/:botId/publish

Publish a version (sets `isLive = true` for that version, `false` for all others).

**Auth Required:** Yes + `requireBotAccess`

**Params:** `botId` (UUID)

**Request Body:**
```json
{
  "versionId": "uuid"            // required, must be a valid version ID
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "published",
    ...
  }
}
```

**Side Effects:**
- Bot status changes to `published`
- The specified version is set to `isLive: true`
- All other versions for this bot are set to `isLive: false`
- NATS event emitted: `bot.published`

---

### Flow Editor

#### GET /api/bots/:botId/flows

List all flows for a bot.

**Auth Required:** Yes + `requireBotAccess`

**Params:** `botId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "botId": "uuid",
      "name": "Main Flow",
      "nodes": [{ "id": "start", "type": "startNode", "position": { "x": 0, "y": 0 }, "data": {} }],
      "edges": [],
      "version": 1,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/bots/:botId/flows

Create a new flow for a bot.

**Auth Required:** Yes + `requireBotAccess`

**Params:** `botId` (UUID)

**Request Body:**
```json
{
  "name": "Main Flow",           // required, min 1 char
  "nodes": [                     // optional, default []
    {
      "id": "start",
      "type": "startNode",
      "position": { "x": 0, "y": 0 },
      "data": {}
    }
  ],
  "edges": []                    // optional, default []
}
```

**FlowNode Schema:**
```json
{
  "id": "string",                // unique node ID
  "type": "string",              // node type (startNode, messageNode, conditionNode, etc.)
  "position": { "x": number, "y": number },
  "data": {}                     // arbitrary node configuration
}
```

**FlowEdge Schema:**
```json
{
  "id": "string",                // unique edge ID
  "source": "string",            // source node ID
  "target": "string",            // target node ID
  "label": "string"              // optional edge label
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "botId": "uuid",
    "name": "Main Flow",
    "nodes": [...],
    "edges": [],
    "version": 1,
    ...
  }
}
```

---

#### GET /api/flows/:flowId

Get a single flow by ID.

**Auth Required:** Yes (JWT only)

**Params:** `flowId` (UUID)

**Response (200):**
```json
{ "success": true, "data": { "id": "uuid", "name": "Main Flow", "nodes": [...], "edges": [...], ... } }
```

---

#### PATCH /api/flows/:flowId

Update a flow (partial update). Creates a version snapshot.

**Auth Required:** Yes (JWT only)

**Params:** `flowId` (UUID)

**Request Body:**
```json
{
  "name": "Updated Flow",        // optional
  "nodes": [...],                // optional
  "edges": [...]                 // optional
}
```

**Response (200):**
```json
{ "success": true, "data": { ... } }
```

**Side Effect:** A snapshot is saved to `flow_versions` table.

---

#### PUT /api/bots/:botId/flows

Replace a flow entirely (full update).

**Auth Required:** Yes + `requireBotAccess`

**Params:** `botId` (UUID)

**Request Body:**
```json
{
  "name": "Main Flow",           // required
  "nodes": [...],                // required
  "edges": [...]                 // required
}
```

**Response (200):**
```json
{ "success": true, "data": { ... } }
```

---

#### DELETE /api/flows/:flowId

Delete a flow.

**Auth Required:** Yes (JWT only)

**Params:** `flowId` (UUID)

**Response (200):**
```json
{ "success": true, "data": null }
```

---

#### GET /api/flows/:flowId/versions

List all version snapshots of a flow.

**Auth Required:** Yes (JWT only)

**Params:** `flowId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "flowId": "uuid",
      "version": 1,
      "nodes": [...],
      "edges": [...],
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### GET /api/flow-versions/:versionId

Get a specific flow version snapshot.

**Auth Required:** Yes (JWT only)

**Params:** `versionId` (UUID)

**Response (200):**
```json
{ "success": true, "data": { "id": "uuid", "flowId": "uuid", "version": 1, "nodes": [...], "edges": [...], ... } }
```

---

## Chat Engine

**Base URL:** `http://localhost:3003`

### Conversations

#### POST /api/bots/:botId/conversations

Create a new conversation with a bot.

**Auth Required:** Yes (JWT)

**Params:** `botId` (UUID)

**Request Body:**
```json
{
  "endUserId": "external-user-id",  // optional
  "channel": "web"                  // optional, default "web". One of: "web", "slack", "whatsapp", "api"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "botId": "uuid",
    "endUserId": null,
    "channel": "web",
    "startedAt": "2026-01-01T00:00:00Z",
    "lastMessageAt": "2026-01-01T00:00:00Z"
  }
}
```

---

#### GET /api/conversations/:conversationId

Get a conversation by ID.

**Auth Required:** Yes (JWT)

**Params:** `conversationId` (UUID)

**Response (200):**
```json
{ "success": true, "data": { "id": "uuid", "botId": "uuid", "channel": "web", ... } }
```

---

#### GET /api/bots/:botId/conversations

List all conversations for a bot.

**Auth Required:** Yes (JWT)

**Params:** `botId` (UUID)

**Query Params:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `limit` | number | No | 50 | Max conversations to return |

**Response (200):**
```json
{ "success": true, "data": [ { "id": "uuid", "botId": "uuid", ... } ] }
```

---

### Messages

#### POST /api/conversations/:conversationId/messages

Send a message and receive a complete response (non-streaming).

**Auth Required:** Yes (JWT)

**Params:** `conversationId` (UUID)

**Request Body:**
```json
{ "content": "Hello, how are you?" }
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "uuid",
      "conversationId": "uuid",
      "role": "assistant",
      "content": "I'm doing well, thanks for asking!",
      "tokens": 12,
      "createdAt": "2026-01-01T00:00:00Z"
    },
    "usage": {
      "outputTokens": 12
    }
  }
}
```

**Behavior:**
- Saves user message to database
- Loads conversation history (with context window management)
- Calls LLM provider (Anthropic or OpenAI based on bot version config)
- If LLM returns tool calls, executes them in a loop (max 5 rounds)
- Saves assistant message to database
- Emits NATS event: `message.sent`

**Errors:**
- `404` — Bot not found or not published
- `429` — Rate limit exceeded (30 req/min)

---

#### POST /api/conversations/:conversationId/messages/stream

Send a message and receive a streaming response via SSE.

**Auth Required:** Yes (JWT)

**Params:** `conversationId` (UUID)

**Request Body:**
```json
{ "content": "Tell me a story" }
```

**Response:** Server-Sent Events stream (`Content-Type: text/event-stream`)

```
data: {"content": "Once"}

data: {"content": " upon"}

data: {"content": " a time..."}

data: {"done": true}
```

**SSE Event Format:**
| Event | Payload | Description |
|-------|---------|-------------|
| Content chunk | `{ "content": "text chunk" }` | Partial response text |
| Done | `{ "done": true }` | Stream complete |
| Error | `{ "error": "Stream failed" }` | Stream error |

See [SSE Streaming](#sse-streaming) for implementation details.

---

#### GET /api/conversations/:conversationId/messages

List all messages in a conversation.

**Auth Required:** Yes (JWT)

**Params:** `conversationId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "role": "user",
      "content": "Hello!",
      "tokens": 2,
      "createdAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "conversationId": "uuid",
      "role": "assistant",
      "content": "Hi there! How can I help?",
      "tokens": 8,
      "createdAt": "2026-01-01T00:00:01Z"
    }
  ]
}
```

---

## Tool Executor

**Base URL:** `http://localhost:3004`

### Credentials Vault

Encrypted secrets storage using AES-256-GCM.

#### GET /api/orgs/:orgId/credentials

List all credentials for an organization (encrypted data stripped).

**Auth Required:** Yes (JWT)

**Params:** `orgId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Slack API Key",
      "type": "api_key",
      "metadata": { "scopes": ["chat:write"] },
      "lastUsedAt": "2026-01-01T00:00:00Z",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### GET /api/orgs/:orgId/credentials/:credentialId

Get a credential with decrypted data.

**Auth Required:** Yes (JWT)

**Params:** `orgId` (UUID), `credentialId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Slack API Key",
    "type": "api_key",
    "data": { "apiKey": "xoxb-..." },
    "metadata": { "scopes": ["chat:write"] },
    ...
  }
}
```

---

#### POST /api/orgs/:orgId/credentials

Create a new encrypted credential.

**Auth Required:** Yes (JWT)

**Params:** `orgId` (UUID)

**Request Body:**
```json
{
  "name": "Slack API Key",
  "type": "api_key",             // one of: "api_key", "oauth", "basic_auth", "bearer_token"
  "data": { "apiKey": "xoxb-123" },
  "metadata": { "scopes": ["chat:write"] }  // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Slack API Key",
    "type": "api_key",
    "metadata": { "scopes": ["chat:write"] },
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

#### PATCH /api/orgs/:orgId/credentials/:credentialId

Update a credential.

**Auth Required:** Yes (JWT)

**Params:** `orgId` (UUID), `credentialId` (UUID)

**Request Body:**
```json
{
  "name": "New Name",            // optional
  "data": { "apiKey": "new-key" },  // optional, re-encrypted
  "metadata": {}                 // optional
}
```

**Response (200):**
```json
{ "success": true, "data": { "id": "uuid", "name": "New Name", "type": "api_key", ... } }
```

---

#### DELETE /api/orgs/:orgId/credentials/:credentialId

Delete a credential.

**Auth Required:** Yes (JWT)

**Params:** `orgId` (UUID), `credentialId` (UUID)

**Response (200):**
```json
{ "success": true, "data": null }
```

---

### Tool Management

#### GET /api/bots/:botId/tools

List all tools for a bot.

**Auth Required:** Yes (JWT)

**Params:** `botId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "botId": "uuid",
      "name": "Weather API",
      "description": "Get current weather",
      "type": "api_call",
      "config": { "url": "https://api.weather.com/...", "method": "GET" },
      "parametersSchema": { "type": "object", "properties": { "city": { "type": "string" } } },
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/tools

Create a new tool.

**Auth Required:** Yes (JWT)

**Request Body:**
```json
{
  "botId": "uuid",
  "name": "Weather API",
  "description": "Get current weather",
  "type": "api_call",            // one of: "api_call", "code", "email", "sms", "database", "file"
  "config": {
    "url": "https://api.weather.com/current",
    "method": "GET",
    "headers": { "Authorization": "Bearer {{credential:weather-api-key}}" }
  },
  "parametersSchema": {          // optional, JSON Schema for tool parameters
    "type": "object",
    "properties": {
      "city": { "type": "string", "description": "City name" }
    },
    "required": ["city"]
  }
}
```

**Response (201):**
```json
{ "success": true, "data": { "id": "uuid", "name": "Weather API", ... } }
```

---

#### PATCH /api/tools/:toolId

Update a tool.

**Auth Required:** Yes (JWT)

**Params:** `toolId` (UUID)

**Request Body:**
```json
{
  "name": "Updated Tool",        // optional
  "description": "...",          // optional
  "config": {},                  // optional
  "parametersSchema": {}         // optional
}
```

**Response (200):**
```json
{ "success": true, "data": { ... } }
```

---

#### DELETE /api/tools/:toolId

Delete a tool.

**Auth Required:** Yes (JWT)

**Params:** `toolId` (UUID)

**Response (200):**
```json
{ "success": true, "data": null }
```

---

### Tool Execution

#### POST /api/tools/execute

Execute a tool directly (outside of a conversation).

**Auth Required:** Yes (JWT)

**Request Body:**
```json
{
  "toolId": "uuid",
  "conversationId": "uuid",
  "input": { "city": "London" }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "output": { "temperature": 15, "condition": "cloudy" },
    "latencyMs": 234
  }
}
```

**Tool Types:**

| Type | Execution Method |
|------|-----------------|
| `api_call` | HTTP request using `node-fetch` |
| `code` | Sandboxed JavaScript execution via Node.js `vm` module |
| `email` | SMTP via `nodemailer` |
| `sms` | Twilio API |
| `database` | SQL query (future) |
| `file` | File operation (future) |

---

#### GET /api/tools/:toolId/executions

List execution history for a tool.

**Auth Required:** Yes (JWT)

**Params:** `toolId` (UUID)

**Query Params:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `limit` | number | No | 50 | Max executions to return |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "toolId": "uuid",
      "conversationId": "uuid",
      "input": { "city": "London" },
      "output": { "temperature": 15 },
      "status": "success",
      "latencyMs": 234,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

## Deployment Service

**Base URL:** `http://localhost:3005`

### Deployments

#### GET /api/bots/:botId/deployments

List all deployments for a bot.

**Auth Required:** Yes (JWT)

**Params:** `botId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "botId": "uuid",
      "versionId": "uuid",
      "environment": "production",
      "status": "active",
      "channelConfig": {},
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/deployments

Create a new deployment.

**Auth Required:** Yes (JWT)

**Request Body:**
```json
{
  "botId": "uuid",
  "versionId": "uuid",
  "environment": "production",   // one of: "development", "staging", "production"
  "channelConfig": {}            // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "botId": "uuid",
    "versionId": "uuid",
    "environment": "production",
    "status": "pending",
    ...
  }
}
```

---

#### POST /api/bots/:botId/deploy

Deploy a bot version to an environment (convenience endpoint).

**Auth Required:** Yes (JWT)

**Params:** `botId` (UUID)

**Request Body:**
```json
{
  "versionId": "uuid",
  "environment": "production"
}
```

**Response (200):**
```json
{ "success": true, "data": { "id": "uuid", "status": "active", ... } }
```

---

#### GET /api/deployments/:deploymentId

Get a deployment by ID.

**Auth Required:** Yes (JWT)

**Params:** `deploymentId` (UUID)

**Response (200):**
```json
{ "success": true, "data": { "id": "uuid", "status": "active", ... } }
```

---

#### PATCH /api/deployments/:deploymentId

Update a deployment.

**Auth Required:** Yes (JWT)

**Params:** `deploymentId` (UUID)

**Request Body:**
```json
{
  "versionId": "uuid",           // optional, rollback to different version
  "status": "active",            // optional, one of: "pending", "active", "inactive", "failed", "rolled_back"
  "channelConfig": {}            // optional
}
```

**Response (200):**
```json
{ "success": true, "data": { ... } }
```

---

#### POST /api/deployments/:deploymentId/rollback

Roll back a deployment to its previous version.

**Auth Required:** Yes (JWT)

**Params:** `deploymentId` (UUID)

**Response (200):**
```json
{ "success": true, "data": { "status": "rolled_back", ... } }
```

---

#### DELETE /api/deployments/:deploymentId

Delete a deployment.

**Auth Required:** Yes (JWT)

**Params:** `deploymentId` (UUID)

**Response (200):**
```json
{ "success": true, "data": null }
```

---

### Widget Generation

#### POST /api/bots/:botId/widget

Generate an embeddable widget script for a bot.

**Auth Required:** Yes (JWT)

**Params:** `botId` (UUID)

**Request Body:**
```json
{
  "theme": { "primaryColor": "#007bff", "fontFamily": "Arial" },
  "position": "bottom-right",    // "bottom-right" | "bottom-left"
  "greeting": "Hi! How can I help?"  // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "script": "<script src=\"http://localhost:3005/widget.js\" data-bot-id=\"uuid\" ...></script>"
  }
}
```

---

### Channel Bindings

#### GET /api/deployments/:deploymentId/bindings

List all channel bindings for a deployment.

**Auth Required:** Yes (JWT)

**Params:** `deploymentId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "deploymentId": "uuid",
      "channelType": "slack",
      "config": { "botToken": "xoxb-...", "channelId": "C123" },
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/deployments/:deploymentId/bindings

Create a channel binding.

**Auth Required:** Yes (JWT)

**Params:** `deploymentId` (UUID)

**Request Body:**
```json
{
  "channelType": "slack",        // one of: "web", "slack", "whatsapp", "telegram", "api"
  "config": {                    // channel-specific configuration
    "botToken": "xoxb-...",
    "channelId": "C123"
  }
}
```

**Response (201):**
```json
{ "success": true, "data": { "id": "uuid", "channelType": "slack", "status": "active", ... } }
```

---

#### GET /api/channel-bindings/:bindingId

Get a channel binding by ID.

**Auth Required:** Yes (JWT)

**Params:** `bindingId` (UUID)

**Response (200):**
```json
{ "success": true, "data": { "id": "uuid", "channelType": "slack", ... } }
```

---

#### PATCH /api/channel-bindings/:bindingId

Update a channel binding.

**Auth Required:** Yes (JWT)

**Params:** `bindingId` (UUID)

**Request Body:**
```json
{
  "config": {},                  // optional
  "status": "active"             // optional, "active" | "inactive"
}
```

**Response (200):**
```json
{ "success": true, "data": { ... } }
```

---

#### DELETE /api/channel-bindings/:bindingId

Delete a channel binding.

**Auth Required:** Yes (JWT)

**Params:** `bindingId` (UUID)

**Response (200):**
```json
{ "success": true, "data": null }
```

---

## Analytics Service

**Base URL:** `http://localhost:3006`

### Events

#### POST /api/events

Track an event.

**Auth Required:** Yes (JWT)

**Request Body:**
```json
{
  "orgId": "uuid",
  "botId": "uuid",               // optional
  "eventType": "conversation.started",
  "payload": { "channel": "web", "userAgent": "..." }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orgId": "uuid",
    "botId": "uuid",
    "eventType": "conversation.started",
    "payload": { "channel": "web" },
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

#### GET /api/events

Query events with optional filters.

**Auth Required:** Yes (JWT)

**Query Params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `orgId` | UUID | Yes | Organization ID |
| `botId` | UUID | No | Filter by bot |
| `eventType` | string | No | Filter by event type |
| `limit` | number | No | Max results (default 50) |

**Response (200):**
```json
{ "success": true, "data": [ { "id": "uuid", "eventType": "...", ... } ] }
```

---

### Metrics

#### GET /api/metrics

Get metrics for a time range.

**Auth Required:** Yes (JWT)

**Query Params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `orgId` | UUID | Yes | Organization ID |
| `botId` | UUID | No | Filter by bot |
| `metricType` | string | Yes | e.g., "conversations", "messages", "tokens" |
| `startDate` | ISO datetime | Yes | Start of period |
| `endDate` | ISO datetime | Yes | End of period |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "metricType": "conversations",
    "total": 150,
    "periodStart": "2026-01-01T00:00:00Z",
    "periodEnd": "2026-01-31T23:59:59Z"
  }
}
```

---

#### GET /api/metrics/aggregate

Get aggregated metrics.

**Auth Required:** Yes (JWT)

**Query Params:** Same as `GET /api/metrics`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "metricType": "tokens",
    "total": 45000,
    "average": 1500,
    "periodStart": "...",
    "periodEnd": "..."
  }
}
```

---

### Dashboard

#### GET /api/dashboard/:orgId

Get dashboard summary for the last 30 days.

**Auth Required:** Yes (JWT)

**Params:** `orgId` (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalConversations": 150,
    "totalMessages": 1200,
    "totalTokens": 45000,
    "averageMessagesPerConversation": 8.0
  }
}
```

---

### Audit Logs

#### POST /api/audit

Create an audit log entry.

**Auth Required:** Yes (JWT)

**Request Body:**
```json
{
  "userId": "uuid",
  "orgId": "uuid",
  "action": "bot.published",
  "resourceType": "bot",
  "resourceId": "uuid",
  "metadata": { "version": 2 }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "orgId": "uuid",
    "action": "bot.published",
    "resourceType": "bot",
    "resourceId": "uuid",
    "metadata": { "version": 2 },
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

#### GET /api/audit

Query audit logs.

**Auth Required:** Yes (JWT)

**Query Params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `orgId` | UUID | Yes | Organization ID |
| `userId` | UUID | No | Filter by user |
| `resourceType` | string | No | Filter by resource type |
| `limit` | number | No | Max results (default 50) |

**Response (200):**
```json
{ "success": true, "data": [ { "id": "uuid", "action": "bot.published", ... } ] }
```

---

## SSE Streaming

The Chat Engine supports Server-Sent Events for real-time streaming of LLM responses.

### Endpoint

```
POST /api/conversations/:conversationId/messages/stream
```

### Client Implementation

```javascript
const response = await fetch('/api/conversations/conv-id/messages/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ content: 'Hello!' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.done) break;
      if (data.content) process.stdout.write(data.content);
    }
  }
}
```

### Nginx Configuration

The SSE endpoint requires specific nginx settings:

```nginx
location /api/conversations/ {
    proxy_pass http://chat-engine:3000;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding off;
    # X-Accel-Buffering header is set by the service
}
```

---

## Embeddable Widget

### Generating a Widget

```bash
curl -X POST http://localhost:3005/api/bots/:botId/widget \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": { "primaryColor": "#007bff" },
    "position": "bottom-right",
    "greeting": "Hi! How can I help you today?"
  }'
```

### Embedding

Add the generated script tag to your website:

```html
<script
  src="http://localhost:3005/widget.js"
  data-bot-id="your-bot-uuid"
  data-position="bottom-right"
  data-primary-color="#007bff"
  data-greeting="Hi! How can I help you today?"
></script>
```

### Widget Features

- Floating chat bubble (bottom-left or bottom-right)
- Expandable chat window
- Real-time streaming responses
- Mobile responsive
- Customizable theme (colors, font, greeting)
- Conversation persistence across page reloads

---

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts (id, email, password_hash, name) |
| `organizations` | Org workspaces (id, name, owner_id, plan) |
| `memberships` | User-org relationships (user_id, org_id, role) |
| `sessions` | JWT sessions (user_id, token, expires_at) |
| `api_keys` | API key hashes (org_id, name, key_hash) |
| `credentials` | Encrypted secrets vault (org_id, name, type, encrypted_data) |

### Bot Tables

| Table | Description |
|-------|-------------|
| `bots` | Chatbots (id, org_id, name, description, status) |
| `bot_versions` | Versioned bot configs (bot_id, version, provider, model, system_prompt, is_live) |
| `flows` | Visual flow definitions (bot_id, name, nodes, edges, version) |
| `flow_versions` | Flow snapshots (flow_id, version, nodes, edges) |
| `tools` | Tool definitions (bot_id, name, type, config, parameters_schema) |

### Conversation Tables

| Table | Description |
|-------|-------------|
| `end_users` | External users chatting with bots (bot_id, external_id, metadata) |
| `conversations` | Chat sessions (bot_id, end_user_id, channel) |
| `messages` | Chat messages (conversation_id, role, content, tokens) |
| `tool_executions` | Tool run history (tool_id, conversation_id, input, output, status) |

### Deployment Tables

| Table | Description |
|-------|-------------|
| `deployments` | Bot deployments (bot_id, version_id, environment, status) |
| `channel_bindings` | Channel configs (deployment_id, channel_type, config) |

### Analytics Tables

| Table | Description |
|-------|-------------|
| `events` | Tracked events (org_id, bot_id, event_type, payload) |
| `usage_metrics` | Usage aggregations (org_id, bot_id, metric_type, value) |
| `audit_logs` | Audit trail (user_id, org_id, action, resource_type, resource_id) |

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://dev:dev@postgres:5432/chatbot` |
| `JWT_SECRET` | Secret for JWT signing | `your-secret-key-here` |
| `CREDENTIAL_ENCRYPTION_KEY` | 32+ char key for AES-256-GCM | `change-me-in-production-32-chars!!` |
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude) | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI API key (for GPT) | `sk-...` |
| `OPENAI_BASE_URL` | Custom OpenAI-compatible endpoint | `http://localhost:11434/v1` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `NATS_URL` | NATS connection string | `nats://nats:4222` |
| `LOG_LEVEL` | Logging level | `debug` |

### .env File

```env
NODE_ENV=development
DATABASE_URL=postgres://dev:dev@postgres:5432/chatbot
REDIS_URL=redis://redis:6379
NATS_URL=nats://nats:4222
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=
OPENAI_BASE_URL=
JWT_SECRET=your-production-secret-key
CREDENTIAL_ENCRYPTION_KEY=your-32-char-encryption-key-here!!
LOG_LEVEL=debug
```

---

## Quick Start

```bash
# 1. Start all services
docker compose up -d

# 2. Register a user
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"password123","name":"Me"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 3. Create an organization
ORG_ID=$(curl -s -X POST http://localhost:3001/api/orgs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"My Org"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

# 4. Create a bot
BOT_ID=$(curl -s -X POST http://localhost:3002/api/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"orgId\":\"$ORG_ID\",\"name\":\"My Bot\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

# 5. Create a version
VER_ID=$(curl -s -X POST "http://localhost:3002/api/bots/$BOT_ID/versions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"systemPrompt":"You are helpful.","provider":"anthropic","model":"claude-sonnet-5-20250514"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

# 6. Publish
curl -s -X POST "http://localhost:3002/api/bots/$BOT_ID/publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"versionId\":\"$VER_ID\"}"

# 7. Start chatting
CONV_ID=$(curl -s -X POST "http://localhost:3003/api/bots/$BOT_ID/conversations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"channel":"web"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

curl -s -X POST "http://localhost:3003/api/conversations/$CONV_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"Hello!"}'
```

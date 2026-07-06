# ChatBot Builder

A no-code visual chatbot builder platform with 6 microservices, built for enterprise-grade deployment.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                          │
│  Dashboard │ Visual Builder │ Chat Preview │ Analytics │ Settings  │
└──────────────┬──────────────────────────────────────┬──────────────┘
               │                                      │
┌──────────────▼──────────────┐        ┌──────────────▼──────────────┐
│     API Gateway (port 80)   │        │     Widget (port 3010)      │
│   Nginx / Docker Network    │        │   Embeddable Web Widget     │
└──────────────┬──────────────┘        └─────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────────┐
│                        Microservices                                │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ Auth (3001) │  │Builder(3002)│  │ Chat (3003) │                │
│  │  JWT Auth   │  │  Bot CRUD   │  │  Multi-LLM  │                │
│  │  RBAC       │  │  Flow Editor│  │  Streaming  │                │
│  │  Sessions   │  │  Versioning │  │  Rate Limit │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ Tools (3004)│  │Deploy (3005)│  │Analytics(3006)               │
│  │  Code Exec  │  │  Channels   │  │  Metrics   │                │
│  │  Email/SMS  │  │  WhatsApp   │  │  Audit Logs│                │
│  │  Credentials│  │  Slack/API  │  │  Dashboard │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────────┐
│                    Infrastructure                                  │
│  PostgreSQL (5433) │ Redis │ NATS │ Docker Compose                │
└────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, React Flow, Tailwind CSS |
| Backend | Fastify, TypeScript, Drizzle ORM |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Database | PostgreSQL 15 |
| Cache | Redis |
| Events | NATS |
| LLM | Anthropic Claude, OpenAI GPT |
| Sandbox | isolated-vm |
| Deployment | Docker Compose |

## Features

### Core
- Visual flow editor with drag-and-drop nodes
- Multi-provider LLM support (Anthropic + OpenAI)
- Tool-calling loop with function execution
- Real-time SSE streaming responses
- Rate limiting (30 req/min per user)

### Channels
- Web widget (embeddable)
- WhatsApp Business API
- Slack integration
- REST API

### Enterprise
- Organization-level workspaces
- Role-based access control (admin/editor/viewer)
- Team member management
- Flow version history
- Credentials vault (AES-256-GCM encryption)
- Audit logging
- Analytics dashboard

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local dev)
- pnpm

### 1. Clone and Start

```bash
git clone https://github.com/vishalnagda1/chat-bot.git
cd chat-bot

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker compose up -d
```

### 2. Access Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Auth API | http://localhost:3001 |
| Builder API | http://localhost:3002 |
| Chat Engine | http://localhost:3003 |
| Tool Executor | http://localhost:3004 |
| Deployment | http://localhost:3005 |
| Analytics | http://localhost:3006 |
| PostgreSQL | localhost:5433 |

### 3. Create Account & Bot

1. Open http://localhost:3000/register
2. Register with email/password
3. Create an organization
4. Create a bot
5. Build your flow in the visual editor
6. Publish and deploy

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/chatbot_builder

# Auth
JWT_SECRET=your-secret-key-here
CREDENTIAL_ENCRYPTION_KEY=your-32-char-encryption-key!

# LLM Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1

# Channels (optional)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...

# SMS (optional)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# NATS
NATS_URL=nats://localhost:4222
```

## Project Structure

```
chat-bot/
├── apps/
│   ├── auth/              # Authentication & authorization
│   ├── builder/           # Bot & flow management
│   ├── chat-engine/       # LLM integration & chat
│   ├── tool-executor/     # Code execution & integrations
│   ├── deployment/        # Channel connectors
│   ├── analytics/         # Metrics & audit logs
│   ├── web/               # Next.js frontend
│   └── widget/            # Embeddable web widget
├── packages/
│   ├── db/                # Database schema & migrations
│   ├── events/            # NATS event publishing
│   └── auth-middleware/    # Shared JWT verification
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

## API Endpoints

### Auth (3001)
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user
- `GET /api/orgs` - List organizations
- `POST /api/orgs` - Create organization
- `PATCH /api/orgs/:id` - Update organization
- `GET /api/orgs/:id/members` - List members
- `POST /api/orgs/:id/members` - Invite member
- `DELETE /api/orgs/:id/members/:userId` - Remove member

### Builder (3002)
- `GET /api/bots` - List bots
- `POST /api/bots` - Create bot
- `GET /api/bots/:id` - Get bot
- `PATCH /api/bots/:id` - Update bot
- `DELETE /api/bots/:id` - Delete bot
- `POST /api/bots/:id/publish` - Publish bot
- `GET /api/bots/:id/flows` - List flows
- `PUT /api/bots/:id/flows` - Save flow
- `GET /api/bots/:id/versions` - List versions
- `POST /api/bots/:id/versions` - Create version

### Chat Engine (3003)
- `POST /api/bots/:botId/conversations` - Create conversation
- `GET /api/conversations/:id` - Get conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message (SSE)

### Tool Executor (3004)
- `POST /api/execute` - Execute tool
- `POST /api/execute/code` - Run code (isolated-vm)
- `POST /api/execute/email` - Send email
- `POST /api/execute/sms` - Send SMS
- `GET /api/credentials` - List credentials
- `POST /api/credentials` - Create credential
- `DELETE /api/credentials/:id` - Delete credential

### Deployment (3005)
- `POST /api/deployments` - Deploy bot
- `GET /api/deployments` - List deployments
- `POST /api/deployments/:id/rollback` - Rollback
- `GET /api/channel-bindings` - List bindings
- `POST /api/channel-bindings` - Create binding
- `POST /api/webhook/slack` - Slack webhook
- `POST /api/webhook/whatsapp` - WhatsApp webhook
- `POST /api/channel/api/process` - API channel

### Analytics (3006)
- `GET /api/dashboard/:orgId` - Dashboard metrics
- `GET /api/organizations/:orgId/metrics` - Detailed metrics
- `GET /api/organizations/:orgId/events` - Event logs

## Development

```bash
# Install dependencies
pnpm install

# Start in development mode
pnpm dev

# Build all packages
pnpm build

# Run database migrations
cd packages/db && npx drizzle-kit push
```

## License

MIT

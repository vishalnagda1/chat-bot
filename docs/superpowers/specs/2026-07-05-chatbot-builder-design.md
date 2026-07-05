# Chatbot Builder Platform - Design Document

## Overview

A no-code visual builder for creating intelligent chatbots with dynamic message handling, tool calling capabilities, and multi-channel deployment. The platform supports organization-level workspaces, enterprise analytics, and self-hosted deployment.

## Goals

- Enable non-technical users to build smart chatbots via drag-and-drop interface
- Support full ecosystem tool calling (API, database, files, email/SMS, custom functions)
- Provide code escape hatch for advanced customization
- Enterprise-grade analytics and compliance
- Self-hosted deployment with Kubernetes support

## Architecture

### Microservices Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
│                   (Kong / Traefik)                              │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Builder    │    │    Chat      │    │   Tool       │
│   Service    │    │   Engine     │    │  Executor    │
│              │    │   Service    │    │   Service    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Deployment  │    │  Analytics   │    │     Auth     │
│   Service    │    │   Service    │    │   Service    │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Service Responsibilities

| Service | Responsibility | Tech Stack |
|---------|---------------|------------|
| Builder Service | Visual flow editor, node management, flow validation | Node.js, TypeScript, React Flow |
| Chat Engine | Conversation handling, message routing, context management | Node.js, WebSocket, Redis |
| Tool Executor | API calls, DB ops, file ops, email/SMS, custom functions | Node.js, sandboxed execution |
| Deployment Service | Go-live management, channel integration, widget hosting | Node.js, Docker |
| Analytics Service | Usage tracking, dashboards, compliance logs | Node.js, ClickHouse |
| Auth Service | Users, organizations, roles, API keys | Node.js, JWT, OAuth |

### Communication

- **Async**: Apache Kafka for event streaming
- **Sync**: gRPC for service-to-service calls
- **Real-time**: WebSocket for chat connections

## Visual Builder & Chat Flow

### Node Types

| Category | Node Types |
|----------|------------|
| Trigger | Website Widget, WhatsApp, Slack, Telegram, API Webhook |
| Message | Text, Image, Card, Carousel, Quick Reply, Typing Indicator |
| Logic | Condition (if/else), Switch, Loop, Delay, Random Split |
| Tool | API Call, Database Query, File Upload/Download, Send Email, Send SMS, Custom Code |
| Variable | Set Variable, Get Variable, Transform Data |
| Handoff | Transfer to Agent, Escalation, End Conversation |

### Flow Execution

- Flows stored as JSON graphs (nodes + edges)
- Runtime interpreter executes node-by-node with state management
- Supports parallel branches and sub-flows
- Real-time validation before deployment

### Code Node

Users can write custom JavaScript/Python with access to input, context, tools, and HTTP client.

```javascript
export async function execute(input, context) {
  const result = await context.tools.call('database', {
    query: 'SELECT * FROM users WHERE id = ?',
    params: [input.user_id]
  });
  return { output: result, next: 'success_path' };
}
```

## Deployment & Channels

### Go-Live Flow

User clicks Deploy → Flow validation → Container build → Channel config → Health check → Live status + monitoring

### Channel Adapters

| Channel | Integration |
|---------|-------------|
| Website Widget | Embeddable JS snippet + React component |
| WhatsApp | Official Business API (Meta) |
| Slack | Slack Bolt SDK |
| Telegram | Telegram Bot API |
| API Endpoint | REST + WebSocket for custom integrations |

### Self-Hosted Deployment

- Docker Compose for single-server setup
- Kubernetes Helm chart for enterprise/cluster deployment
- Auto-scaling based on conversation volume
- Each chatbot runs in isolated container(s)

### Multi-Tenancy

- Organization → Workspace → Chatbot hierarchy
- Resource quotas per organization
- Data isolation at database level (schema-per-org)

## Data Architecture

### Database-per-Service

| Service | Database | Purpose |
|---------|----------|---------|
| Builder Service | PostgreSQL | Flows, nodes, templates, versions |
| Chat Engine | PostgreSQL + Redis | Conversations, messages, context cache |
| Tool Executor | PostgreSQL | Tool configs, execution logs, secrets vault |
| Deployment Service | PostgreSQL | Deployments, channel configs, health status |
| Analytics Service | ClickHouse | Events, metrics, aggregated reports |
| Auth Service | PostgreSQL | Users, orgs, roles, API keys |

### Data Models

```
Organization
  └─ Workspace
       └─ Chatbot
            ├─ Flow (versioned JSON graph)
            ├─ Tools (API keys, DB connections, etc.)
            ├─ Channels (website, WhatsApp, etc.)
            └─ Analytics
```

### Caching

- Redis: Session data, chatbot configs, rate limiting
- CDN: Widget assets, static resources

### File Storage

S3-compatible (MinIO for self-hosted)

## Analytics & Enterprise

### Analytics Pipeline

Events → Kafka → Stream Processor → ClickHouse → Dashboard API → Frontend

### Dashboard Metrics

| Category | Metrics |
|----------|---------|
| Usage | Total conversations, messages per bot, active users, peak hours |
| Performance | Response time, tool execution latency, error rates, uptime |
| Engagement | Conversation completion rate, drop-off points, satisfaction score |
| Tools | Tool call frequency, success/failure rates, latency per tool type |
| Revenue | API usage, storage consumption, compute hours per org |

### Enterprise Features

- Compliance logging with full audit trail
- Data export (CSV/JSON), scheduled reports, API access
- Custom report builder
- SSO integration (SAML 2.0, OAuth 2.0)
- SLA monitoring with uptime tracking and alerting

### Monitoring Stack

- Metrics: Prometheus + Grafana
- Logging: ELK Stack
- Tracing: Jaeger
- Alerting: PagerDuty/Opsgenie integration

## Testing Interface

### Testing Modes

1. Sandbox Mode: Test with mock data, no real APIs
2. Staging Mode: Test with real tools, dev environment
3. Production Dry Run: Live traffic, no side effects

### Testing Features

- Live preview with real-time flow testing
- Simulator for different channels
- Step debugger for walking through nodes
- Variable inspector during test
- Tool mocking without real calls

### Automated Testing

- Unit tests per service (Jest/Vitest)
- Integration tests for service communication
- E2E tests for complete conversation flows
- Load testing with k6

### CI/CD Pipeline

Code Push → Lint → Unit Tests → Integration Tests → Build Images → Deploy to Staging → E2E Tests → Deploy to Production

## Security

### Security Layers

| Layer | Measures |
|-------|----------|
| Authentication | JWT tokens, OAuth 2.0, API key auth, MFA support |
| Authorization | RBAC (Admin/Editor/Viewer), resource-level permissions |
| Data Encryption | TLS 1.3 in transit, AES-256 at rest |
| Secrets Management | HashiCorp Vault |
| Network | Service mesh (Istio), mTLS between services |
| API Security | Rate limiting, CORS, input validation |
| Compliance | GDPR data handling, audit logging, data retention |

### Chatbot Security

- Sandboxed code execution (V8 isolates or Docker containers)
- Input sanitization before tool execution
- Rate limiting per chatbot/user
- Webhook signature verification

## Tech Stack Summary

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14+, React Flow, Zustand |
| Backend Services | Node.js, TypeScript |
| API Gateway | Kong / Traefik |
| Databases | PostgreSQL, ClickHouse, Redis |
| Message Queue | Apache Kafka |
| Service Communication | gRPC |
| Container Orchestration | Kubernetes |
| CI/CD | GitHub Actions / GitLab CI |
| Monitoring | Prometheus, Grafana, ELK, Jaeger |
| Secrets | HashiCorp Vault |

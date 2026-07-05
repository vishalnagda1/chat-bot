# Monorepo Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a complete Turborepo monorepo foundation with shared packages, service scaffolding, and Docker Compose for local development.

**Architecture:** Turborepo + pnpm workspaces with 6 microservices (auth, builder, chat-engine, tool-executor, deployment, analytics), 6 shared packages, and infrastructure for PostgreSQL, Redis, and NATS.

**Tech Stack:** Node.js 20+, pnpm 9.x, TypeScript 5.6+, Fastify, Drizzle ORM, Zod, Pino, Docker Compose.

## Global Constraints

- Node.js >= 20
- pnpm 9.x as package manager
- TypeScript 5.6+
- Fastify as HTTP framework
- Drizzle ORM for database
- Zod for validation
- Pino for logging
- All services use port 3000 internally, mapped to different host ports
- All packages use workspace:* protocol for internal dependencies

---

## File Structure

### Root Configuration Files
- `package.json` - Root workspace with pnpm and turbo scripts
- `pnpm-workspace.yaml` - Workspace configuration
- `turbo.json` - Turborepo pipeline configuration
- `tsconfig.base.json` - Shared TypeScript compiler options
- `.npmrc` - pnpm configuration
- `.env.example` - Example environment variables
- `.gitignore` - Git ignore rules
- `.dockerignore` - Docker ignore rules

### Shared Packages
- `packages/config-eslint/package.json` - ESLint config package
- `packages/config-eslint/index.js` - ESLint configuration
- `packages/config-typescript/package.json` - TypeScript config package
- `packages/config-typescript/base.json` - Base TypeScript config
- `packages/config-typescript/service.json` - Service TypeScript config
- `packages/logger/package.json` - Logger package
- `packages/logger/src/index.ts` - Pino logger wrapper
- `packages/types/package.json` - Types package
- `packages/types/src/index.ts` - Shared TypeScript types
- `packages/events/package.json` - Events package
- `packages/events/src/index.ts` - Event schemas with Zod
- `packages/db/package.json` - Database package
- `packages/db/src/index.ts` - Drizzle ORM client wrapper

### Service Scaffolding (per service)
- `apps/[service]/package.json` - Service dependencies
- `apps/[service]/tsconfig.json` - TypeScript config
- `apps/[service]/src/index.ts` - Fastify server entry point
- `apps/[service]/src/app.ts` - Fastify app setup with health check
- `apps/[service]/src/config.ts` - Environment config
- `apps/[service]/Dockerfile` - Multi-stage Docker build

### Infrastructure
- `docker-compose.yml` - Docker Compose with all services
- `infra/postgres/init/` - PostgreSQL initialization scripts

---

## Task 1: Root Configuration Files

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.npmrc`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `.dockerignore`

**Interfaces:**
- Consumes: None (first task)
- Produces: Root configuration that all subsequent tasks depend on

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "chat-bot",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": {
    "node": ">=20"
  },
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

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "db:migrate": {
      "cache": false
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Create .npmrc**

```ini
auto-install-peers=true
```

- [ ] **Step 6: Create .env.example**

```bash
NODE_ENV=development
DATABASE_URL=postgres://dev:dev@localhost:5432/chatbot
REDIS_URL=redis://localhost:6379
NATS_URL=nats://localhost:4222
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=change-me
LOG_LEVEL=debug
```

- [ ] **Step 7: Create .gitignore**

```gitignore
# Dependencies
node_modules/
.pnpm-store

# Build outputs
dist/
build/
coverage/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
docker-compose.override.yml

# Turbo
.turbo/

# Logs
*.log
npm-debug.log*
pnpm-debug.log*
```

- [ ] **Step 8: Create .dockerignore**

```dockerignore
node_modules
.git
.gitignore
.env
.env.*
!.env.example
dist
build
coverage
.turbo
*.log
.vscode
.idea
```

- [ ] **Step 9: Install root dependencies**

Run: `pnpm install`
Expected: Dependencies installed, pnpm-lock.yaml created

- [ ] **Step 10: Verify TypeScript config**

Run: `pnpm typecheck`
Expected: No packages to typecheck yet, command completes without error

- [ ] **Step 11: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .npmrc .env.example .gitignore .dockerignore pnpm-lock.yaml
git commit -m "feat: add root monorepo configuration"
```

---

## Task 2: Shared Package - TypeScript Config

**Files:**
- Create: `packages/config-typescript/package.json`
- Create: `packages/config-typescript/base.json`
- Create: `packages/config-typescript/service.json`

**Interfaces:**
- Consumes: `tsconfig.base.json` from Task 1
- Produces: `@repo/tsconfig` package used by all services

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/tsconfig",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "files": [
    "base.json",
    "service.json"
  ]
}
```

- [ ] **Step 2: Create base.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

- [ ] **Step 3: Create service.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/config-typescript/
git commit -m "feat: add shared TypeScript configuration package"
```

---

## Task 3: Shared Package - ESLint Config

**Files:**
- Create: `packages/config-eslint/package.json`
- Create: `packages/config-eslint/index.js`

**Interfaces:**
- Consumes: None
- Produces: `@repo/eslint-config` package used by all services

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/eslint-config",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "main": "index.js",
  "files": [
    "index.js"
  ],
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.2.0"
  },
  "devDependencies": {
    "prettier": "^3.3.0"
  }
}
```

- [ ] **Step 2: Create index.js**

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'prettier/prettier': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/'],
};
```

- [ ] **Step 3: Commit**

```bash
git add packages/config-eslint/
git commit -m "feat: add shared ESLint configuration package"
```

---

## Task 4: Shared Package - Logger

**Files:**
- Create: `packages/logger/package.json`
- Create: `packages/logger/tsconfig.json`
- Create: `packages/logger/src/index.ts`

**Interfaces:**
- Consumes: `@repo/tsconfig` from Task 2
- Produces: `@repo/logger` package with `createLogger` function

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/logger",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "pino": "^9.4.0",
    "pino-pretty": "^11.2.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/tsconfig/service.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/index.ts**

```typescript
import pino from 'pino';

export interface Logger {
  info: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  debug: (msg: string, ...args: unknown[]) => void;
  child: (bindings: Record<string, unknown>) => Logger;
}

export function createLogger(service: string): Logger {
  const logger = pino({
    name: service,
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  });

  return {
    info: (msg, ...args) => logger.info(...args, msg),
    error: (msg, ...args) => logger.error(...args, msg),
    warn: (msg, ...args) => logger.warn(...args, msg),
    debug: (msg, ...args) => logger.debug(...args, msg),
    child: (bindings) => createLoggerFromChild(logger.child(bindings)),
  };
}

function createLoggerFromChild(child: pino.Logger): Logger {
  return {
    info: (msg, ...args) => child.info(...args, msg),
    error: (msg, ...args) => child.error(...args, msg),
    warn: (msg, ...args) => child.warn(...args, msg),
    debug: (msg, ...args) => child.debug(...args, msg),
    child: (bindings) => createLoggerFromChild(child.child(bindings)),
  };
}
```

- [ ] **Step 4: Build logger package**

Run: `pnpm --filter @repo/logger build`
Expected: dist/ directory created with compiled JavaScript

- [ ] **Step 5: Commit**

```bash
git add packages/logger/
git commit -m "feat: add shared Pino logger package"
```

---

## Task 5: Shared Package - Types

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`

**Interfaces:**
- Consumes: `@repo/tsconfig` from Task 2
- Produces: `@repo/types` package with shared DTOs

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/tsconfig/service.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/index.ts**

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
}

export interface Membership {
  id: string;
  userId: string;
  orgId: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface Bot {
  id: string;
  orgId: string;
  name: string;
  description: string;
  status: 'draft' | 'published';
  createdAt: Date;
}

export interface BotVersion {
  id: string;
  botId: string;
  version: number;
  config: Record<string, unknown>;
  systemPrompt: string;
  model: string;
  isLive: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  botId: string;
  endUserId: string;
  channel: string;
  startedAt: Date;
  lastMessageAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens: number;
  createdAt: Date;
}

export interface ToolDefinition {
  id: string;
  orgId: string;
  name: string;
  description: string;
  parametersSchema: Record<string, unknown>;
  createdAt: Date;
}

export interface Deployment {
  id: string;
  botId: string;
  versionId: string;
  environment: 'dev' | 'staging' | 'production';
  status: 'pending' | 'active' | 'failed' | 'rolled_back';
  channelConfig: Record<string, unknown>;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

- [ ] **Step 4: Build types package**

Run: `pnpm --filter @repo/types build`
Expected: dist/ directory created with compiled JavaScript

- [ ] **Step 5: Commit**

```bash
git add packages/types/
git commit -m "feat: add shared TypeScript types package"
```

---

## Task 6: Shared Package - Events

**Files:**
- Create: `packages/events/package.json`
- Create: `packages/events/tsconfig.json`
- Create: `packages/events/src/index.ts`

**Interfaces:**
- Consumes: `@repo/tsconfig` from Task 2, `zod` for validation
- Produces: `@repo/events` package with Zod schemas

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/events",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/tsconfig/service.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/index.ts**

```typescript
import { z } from 'zod';

export const BaseEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string(),
  timestamp: z.string().datetime(),
  orgId: z.string().uuid(),
  botId: z.string().uuid().optional(),
});

export const BotCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('bot.created'),
  payload: z.object({
    botId: z.string().uuid(),
    name: z.string(),
    orgId: z.string().uuid(),
  }),
});

export const BotUpdatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('bot.updated'),
  payload: z.object({
    botId: z.string().uuid(),
    changes: z.record(z.unknown()),
  }),
});

export const BotPublishedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('bot.published'),
  payload: z.object({
    botId: z.string().uuid(),
    versionId: z.string().uuid(),
    version: z.number(),
  }),
});

export const ConversationStartedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('conversation.started'),
  payload: z.object({
    conversationId: z.string().uuid(),
    botId: z.string().uuid(),
    channel: z.string(),
    endUserId: z.string().uuid(),
  }),
});

export const MessageSentEventSchema = BaseEventSchema.extend({
  eventType: z.literal('message.sent'),
  payload: z.object({
    conversationId: z.string().uuid(),
    messageId: z.string().uuid(),
    role: z.enum(['user', 'assistant', 'system']),
    tokens: z.number(),
  }),
});

export const ToolExecutedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('tool.executed'),
  payload: z.object({
    toolId: z.string().uuid(),
    conversationId: z.string().uuid(),
    status: z.enum(['success', 'error']),
    latencyMs: z.number(),
  }),
});

export const DeploymentCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal('deployment.created'),
  payload: z.object({
    deploymentId: z.string().uuid(),
    botId: z.string().uuid(),
    environment: z.enum(['dev', 'staging', 'production']),
  }),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type BotCreatedEvent = z.infer<typeof BotCreatedEventSchema>;
export type BotUpdatedEvent = z.infer<typeof BotUpdatedEventSchema>;
export type BotPublishedEvent = z.infer<typeof BotPublishedEventSchema>;
export type ConversationStartedEvent = z.infer<typeof ConversationStartedEventSchema>;
export type MessageSentEvent = z.infer<typeof MessageSentEventSchema>;
export type ToolExecutedEvent = z.infer<typeof ToolExecutedEventSchema>;
export type DeploymentCreatedEvent = z.infer<typeof DeploymentCreatedEventSchema>;

export type Event =
  | BotCreatedEvent
  | BotUpdatedEvent
  | BotPublishedEvent
  | ConversationStartedEvent
  | MessageSentEvent
  | ToolExecutedEvent
  | DeploymentCreatedEvent;
```

- [ ] **Step 4: Build events package**

Run: `pnpm --filter @repo/events build`
Expected: dist/ directory created with compiled JavaScript

- [ ] **Step 5: Commit**

```bash
git add packages/events/
git commit -m "feat: add shared event schemas package with Zod"
```

---

## Task 7: Shared Package - Database

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/src/index.ts`

**Interfaces:**
- Consumes: `@repo/tsconfig` from Task 2, `drizzle-orm`, `postgres`
- Produces: `@repo/db` package with Drizzle client wrapper

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "drizzle-orm": "^0.33.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "drizzle-kit": "^0.24.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/tsconfig/service.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/index.ts**

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export { drizzle, postgres };
export type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
export * from './schema';

export function createClient(databaseUrl: string) {
  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createClient>;
```

- [ ] **Step 4: Create src/schema.ts (placeholder)**

```typescript
export {};
```

- [ ] **Step 5: Build db package**

Run: `pnpm --filter @repo/db build`
Expected: dist/ directory created with compiled JavaScript

- [ ] **Step 6: Commit**

```bash
git add packages/db/
git commit -m "feat: add shared Drizzle ORM database package"
```

---

## Task 8: Service Scaffolding - Auth Service

**Files:**
- Create: `apps/auth/package.json`
- Create: `apps/auth/tsconfig.json`
- Create: `apps/auth/src/index.ts`
- Create: `apps/auth/src/app.ts`
- Create: `apps/auth/src/config.ts`
- Create: `apps/auth/Dockerfile`

**Interfaces:**
- Consumes: `@repo/logger`, `@repo/types`, `@repo/db`, `@repo/tsconfig`
- Produces: Auth service with health check endpoint

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/auth",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "@repo/logger": "workspace:*",
    "@repo/types": "workspace:*",
    "fastify": "^4.28.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/tsconfig/service.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/config.ts**

```typescript
import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string(),
  redisUrl: z.string().optional(),
  jwtSecret: z.string(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    port: process.env.PORT,
    host: process.env.HOST,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,
    logLevel: process.env.LOG_LEVEL,
  });
}
```

- [ ] **Step 4: Create src/app.ts**

```typescript
import Fastify, { FastifyInstance } from 'fastify';
import { createLogger } from '@repo/logger';
import { Config } from './config.js';

export async function buildApp(config: Config): Promise<FastifyInstance> {
  const logger = createLogger('auth');
  
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  app.get('/health', async () => {
    return { status: 'ok', service: 'auth' };
  });

  app.get('/api/auth/me', async () => {
    return { message: 'Auth service - not implemented yet' };
  });

  return app;
}
```

- [ ] **Step 5: Create src/index.ts**

```typescript
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createLogger } from '@repo/logger';

async function main() {
  const config = loadConfig();
  const logger = createLogger('auth');
  
  const app = await buildApp(config);
  
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`Auth service listening on ${config.host}:${config.port}`);
  } catch (err) {
    logger.error('Failed to start auth service', err);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 6: Create Dockerfile**

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

- [ ] **Step 7: Build auth service**

Run: `pnpm --filter @repo/auth build`
Expected: dist/ directory created

- [ ] **Step 8: Commit**

```bash
git add apps/auth/
git commit -m "feat: scaffold auth service with Fastify"
```

---

## Task 9: Service Scaffolding - Builder Service

**Files:**
- Create: `apps/builder/package.json`
- Create: `apps/builder/tsconfig.json`
- Create: `apps/builder/src/index.ts`
- Create: `apps/builder/src/app.ts`
- Create: `apps/builder/src/config.ts`
- Create: `apps/builder/Dockerfile`

**Interfaces:**
- Consumes: `@repo/logger`, `@repo/types`, `@repo/db`, `@repo/tsconfig`
- Produces: Builder service with health check endpoint

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/builder",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "@repo/logger": "workspace:*",
    "@repo/types": "workspace:*",
    "fastify": "^4.28.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/tsconfig/service.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/config.ts**

```typescript
import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string(),
  redisUrl: z.string().optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    port: process.env.PORT,
    host: process.env.HOST,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    logLevel: process.env.LOG_LEVEL,
  });
}
```

- [ ] **Step 4: Create src/app.ts**

```typescript
import Fastify, { FastifyInstance } from 'fastify';
import { createLogger } from '@repo/logger';
import { Config } from './config.js';

export async function buildApp(config: Config): Promise<FastifyInstance> {
  const logger = createLogger('builder');
  
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  app.get('/health', async () => {
    return { status: 'ok', service: 'builder' };
  });

  app.get('/api/bots', async () => {
    return { message: 'Builder service - not implemented yet' };
  });

  return app;
}
```

- [ ] **Step 5: Create src/index.ts**

```typescript
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createLogger } from '@repo/logger';

async function main() {
  const config = loadConfig();
  const logger = createLogger('builder');
  
  const app = await buildApp(config);
  
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`Builder service listening on ${config.host}:${config.port}`);
  } catch (err) {
    logger.error('Failed to start builder service', err);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 6: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/builder/package.json ./apps/builder/package.json
RUN pnpm install --frozen-lockfile

FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "--filter", "@repo/builder", "dev"]

FROM base AS build
COPY . .
RUN pnpm --filter @repo/builder... build

FROM node:20-alpine AS prod
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/builder/dist ./apps/builder/dist
COPY --from=build /app/apps/builder/package.json ./apps/builder/package.json
COPY --from=build /app/packages ./packages
EXPOSE 3000
CMD ["node", "apps/builder/dist/index.js"]
```

- [ ] **Step 7: Build builder service**

Run: `pnpm --filter @repo/builder build`
Expected: dist/ directory created

- [ ] **Step 8: Commit**

```bash
git add apps/builder/
git commit -m "feat: scaffold builder service with Fastify"
```

---

## Task 10: Service Scaffolding - Chat Engine Service

**Files:**
- Create: `apps/chat-engine/package.json`
- Create: `apps/chat-engine/tsconfig.json`
- Create: `apps/chat-engine/src/index.ts`
- Create: `apps/chat-engine/src/app.ts`
- Create: `apps/chat-engine/src/config.ts`
- Create: `apps/chat-engine/Dockerfile`

**Interfaces:**
- Consumes: `@repo/logger`, `@repo/types`, `@repo/db`, `@repo/tsconfig`
- Produces: Chat Engine service with health check endpoint

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/chat-engine",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "@repo/logger": "workspace:*",
    "@repo/types": "workspace:*",
    "fastify": "^4.28.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/tsconfig/service.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/config.ts**

```typescript
import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string(),
  redisUrl: z.string().optional(),
  natsUrl: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    port: process.env.PORT,
    host: process.env.HOST,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    natsUrl: process.env.NATS_URL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    logLevel: process.env.LOG_LEVEL,
  });
}
```

- [ ] **Step 4: Create src/app.ts**

```typescript
import Fastify, { FastifyInstance } from 'fastify';
import { createLogger } from '@repo/logger';
import { Config } from './config.js';

export async function buildApp(config: Config): Promise<FastifyInstance> {
  const logger = createLogger('chat-engine');
  
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  app.get('/health', async () => {
    return { status: 'ok', service: 'chat-engine' };
  });

  app.get('/api/bots/:botId/conversations', async () => {
    return { message: 'Chat Engine service - not implemented yet' };
  });

  return app;
}
```

- [ ] **Step 5: Create src/index.ts**

```typescript
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createLogger } from '@repo/logger';

async function main() {
  const config = loadConfig();
  const logger = createLogger('chat-engine');
  
  const app = await buildApp(config);
  
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`Chat Engine service listening on ${config.host}:${config.port}`);
  } catch (err) {
    logger.error('Failed to start chat-engine service', err);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 6: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/chat-engine/package.json ./apps/chat-engine/package.json
RUN pnpm install --frozen-lockfile

FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "--filter", "@repo/chat-engine", "dev"]

FROM base AS build
COPY . .
RUN pnpm --filter @repo/chat-engine... build

FROM node:20-alpine AS prod
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/chat-engine/dist ./apps/chat-engine/dist
COPY --from=build /app/apps/chat-engine/package.json ./apps/chat-engine/package.json
COPY --from=build /app/packages ./packages
EXPOSE 3000
CMD ["node", "apps/chat-engine/dist/index.js"]
```

- [ ] **Step 7: Build chat-engine service**

Run: `pnpm --filter @repo/chat-engine build`
Expected: dist/ directory created

- [ ] **Step 8: Commit**

```bash
git add apps/chat-engine/
git commit -m "feat: scaffold chat-engine service with Fastify"
```

---

## Task 11: Service Scaffolding - Tool Executor Service

**Files:**
- Create: `apps/tool-executor/package.json`
- Create: `apps/tool-executor/tsconfig.json`
- Create: `apps/tool-executor/src/index.ts`
- Create: `apps/tool-executor/src/app.ts`
- Create: `apps/tool-executor/src/config.ts`
- Create: `apps/tool-executor/Dockerfile`

**Interfaces:**
- Consumes: `@repo/logger`, `@repo/types`, `@repo/db`, `@repo/tsconfig`
- Produces: Tool Executor service with health check endpoint

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/tool-executor",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "@repo/logger": "workspace:*",
    "@repo/types": "workspace:*",
    "fastify": "^4.28.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/tsconfig/service.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/config.ts**

```typescript
import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    port: process.env.PORT,
    host: process.env.HOST,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    logLevel: process.env.LOG_LEVEL,
  });
}
```

- [ ] **Step 4: Create src/app.ts**

```typescript
import Fastify, { FastifyInstance } from 'fastify';
import { createLogger } from '@repo/logger';
import { Config } from './config.js';

export async function buildApp(config: Config): Promise<FastifyInstance> {
  const logger = createLogger('tool-executor');
  
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  app.get('/health', async () => {
    return { status: 'ok', service: 'tool-executor' };
  });

  app.get('/api/tools', async () => {
    return { message: 'Tool Executor service - not implemented yet' };
  });

  return app;
}
```

- [ ] **Step 5: Create src/index.ts**

```typescript
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createLogger } from '@repo/logger';

async function main() {
  const config = loadConfig();
  const logger = createLogger('tool-executor');
  
  const app = await buildApp(config);
  
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`Tool Executor service listening on ${config.host}:${config.port}`);
  } catch (err) {
    logger.error('Failed to start tool-executor service', err);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 6: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/tool-executor/package.json ./apps/tool-executor/package.json
RUN pnpm install --frozen-lockfile

FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "--filter", "@repo/tool-executor", "dev"]

FROM base AS build
COPY . .
RUN pnpm --filter @repo/tool-executor... build

FROM node:20-alpine AS prod
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/tool-executor/dist ./apps/tool-executor/dist
COPY --from=build /app/apps/tool-executor/package.json ./apps/tool-executor/package.json
COPY --from=build /app/packages ./packages
EXPOSE 3000
CMD ["node", "apps/tool-executor/dist/index.js"]
```

- [ ] **Step 7: Build tool-executor service**

Run: `pnpm --filter @repo/tool-executor build`
Expected: dist/ directory created

- [ ] **Step 8: Commit**

```bash
git add apps/tool-executor/
git commit -m "feat: scaffold tool-executor service with Fastify"
```

---

## Task 12: Service Scaffolding - Deployment Service

**Files:**
- Create: `apps/deployment/package.json`
- Create: `apps/deployment/tsconfig.json`
- Create: `apps/deployment/src/index.ts`
- Create: `apps/deployment/src/app.ts`
- Create: `apps/deployment/src/config.ts`
- Create: `apps/deployment/Dockerfile`

**Interfaces:**
- Consumes: `@repo/logger`, `@repo/types`, `@repo/db`, `@repo/tsconfig`
- Produces: Deployment service with health check endpoint

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/deployment",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "@repo/logger": "workspace:*",
    "@repo/types": "workspace:*",
    "fastify": "^4.28.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/tsconfig/service.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/config.ts**

```typescript
import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    port: process.env.PORT,
    host: process.env.HOST,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    logLevel: process.env.LOG_LEVEL,
  });
}
```

- [ ] **Step 4: Create src/app.ts**

```typescript
import Fastify, { FastifyInstance } from 'fastify';
import { createLogger } from '@repo/logger';
import { Config } from './config.js';

export async function buildApp(config: Config): Promise<FastifyInstance> {
  const logger = createLogger('deployment');
  
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  app.get('/health', async () => {
    return { status: 'ok', service: 'deployment' };
  });

  app.get('/api/deployments', async () => {
    return { message: 'Deployment service - not implemented yet' };
  });

  return app;
}
```

- [ ] **Step 5: Create src/index.ts**

```typescript
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createLogger } from '@repo/logger';

async function main() {
  const config = loadConfig();
  const logger = createLogger('deployment');
  
  const app = await buildApp(config);
  
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`Deployment service listening on ${config.host}:${config.port}`);
  } catch (err) {
    logger.error('Failed to start deployment service', err);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 6: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/deployment/package.json ./apps/deployment/package.json
RUN pnpm install --frozen-lockfile

FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "--filter", "@repo/deployment", "dev"]

FROM base AS build
COPY . .
RUN pnpm --filter @repo/deployment... build

FROM node:20-alpine AS prod
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/deployment/dist ./apps/deployment/dist
COPY --from=build /app/apps/deployment/package.json ./apps/deployment/package.json
COPY --from=build /app/packages ./packages
EXPOSE 3000
CMD ["node", "apps/deployment/dist/index.js"]
```

- [ ] **Step 7: Build deployment service**

Run: `pnpm --filter @repo/deployment build`
Expected: dist/ directory created

- [ ] **Step 8: Commit**

```bash
git add apps/deployment/
git commit -m "feat: scaffold deployment service with Fastify"
```

---

## Task 13: Service Scaffolding - Analytics Service

**Files:**
- Create: `apps/analytics/package.json`
- Create: `apps/analytics/tsconfig.json`
- Create: `apps/analytics/src/index.ts`
- Create: `apps/analytics/src/app.ts`
- Create: `apps/analytics/src/config.ts`
- Create: `apps/analytics/Dockerfile`

**Interfaces:**
- Consumes: `@repo/logger`, `@repo/types`, `@repo/db`, `@repo/tsconfig`
- Produces: Analytics service with health check endpoint

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/analytics",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "@repo/logger": "workspace:*",
    "@repo/types": "workspace:*",
    "fastify": "^4.28.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/tsconfig/service.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/config.ts**

```typescript
import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    port: process.env.PORT,
    host: process.env.HOST,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    logLevel: process.env.LOG_LEVEL,
  });
}
```

- [ ] **Step 4: Create src/app.ts**

```typescript
import Fastify, { FastifyInstance } from 'fastify';
import { createLogger } from '@repo/logger';
import { Config } from './config.js';

export async function buildApp(config: Config): Promise<FastifyInstance> {
  const logger = createLogger('analytics');
  
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  app.get('/health', async () => {
    return { status: 'ok', service: 'analytics' };
  });

  app.get('/api/analytics', async () => {
    return { message: 'Analytics service - not implemented yet' };
  });

  return app;
}
```

- [ ] **Step 5: Create src/index.ts**

```typescript
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createLogger } from '@repo/logger';

async function main() {
  const config = loadConfig();
  const logger = createLogger('analytics');
  
  const app = await buildApp(config);
  
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`Analytics service listening on ${config.host}:${config.port}`);
  } catch (err) {
    logger.error('Failed to start analytics service', err);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 6: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/analytics/package.json ./apps/analytics/package.json
RUN pnpm install --frozen-lockfile

FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "--filter", "@repo/analytics", "dev"]

FROM base AS build
COPY . .
RUN pnpm --filter @repo/analytics... build

FROM node:20-alpine AS prod
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/analytics/dist ./apps/analytics/dist
COPY --from=build /app/apps/analytics/package.json ./apps/analytics/package.json
COPY --from=build /app/packages ./packages
EXPOSE 3000
CMD ["node", "apps/analytics/dist/index.js"]
```

- [ ] **Step 7: Build analytics service**

Run: `pnpm --filter @repo/analytics build`
Expected: dist/ directory created

- [ ] **Step 8: Commit**

```bash
git add apps/analytics/
git commit -m "feat: scaffold analytics service with Fastify"
```

---

## Task 14: Docker Compose Configuration

**Files:**
- Create: `docker-compose.yml`

**Interfaces:**
- Consumes: All services from Tasks 8-13
- Produces: Docker Compose configuration for local development

- [ ] **Step 1: Create docker-compose.yml**

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

- [ ] **Step 2: Verify Docker Compose configuration**

Run: `docker compose config`
Expected: Valid YAML output with all services defined

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add Docker Compose configuration for local development"
```

---

## Task 15: Infrastructure Setup

**Files:**
- Create: `infra/postgres/init/.gitkeep`

**Interfaces:**
- Consumes: None
- Produces: Infrastructure directory structure

- [ ] **Step 1: Create infrastructure directories**

```bash
mkdir -p infra/postgres/init
touch infra/postgres/init/.gitkeep
```

- [ ] **Step 2: Commit**

```bash
git add infra/
git commit -m "feat: add infrastructure directory structure"
```

---

## Task 16: Final Verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verified working monorepo foundation

- [ ] **Step 1: Install all dependencies**

Run: `pnpm install`
Expected: All workspace dependencies resolve correctly

- [ ] **Step 2: Run typecheck across all packages**

Run: `pnpm typecheck`
Expected: All packages compile without TypeScript errors

- [ ] **Step 3: Run build across all packages**

Run: `pnpm build`
Expected: All packages build successfully

- [ ] **Step 4: Verify Docker Compose**

Run: `docker compose config`
Expected: Valid configuration output

- [ ] **Step 5: Create final commit**

```bash
git add .
git commit -m "chore: complete monorepo foundation setup"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✅ Root configuration files (package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json, .npmrc, .env.example, .gitignore, .dockerignore)
- ✅ Shared packages (config-eslint, config-typescript, logger, types, events, db)
- ✅ Service scaffolding (auth, builder, chat-engine, tool-executor, deployment, analytics)
- ✅ Docker Compose with PostgreSQL, Redis, NATS
- ✅ Infrastructure directory structure

**2. Placeholder scan:**
- ✅ No TBD/TODO placeholders
- ✅ All code blocks complete
- ✅ All commands with expected output

**3. Type consistency:**
- ✅ All services use same package structure
- ✅ All packages use workspace:* protocol
- ✅ All TypeScript configs extend from @repo/tsconfig
- ✅ All services use same port mapping (3000 internal)

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-05-monorepo-foundation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/chat-engine/package.json ./apps/chat-engine/package.json
RUN pnpm install --frozen-lockfile

FROM base AS dev
COPY . .
RUN pnpm --filter @repo/auth-middleware... build
EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter @repo/auth-middleware... build && pnpm --filter @repo/chat-engine dev"]

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

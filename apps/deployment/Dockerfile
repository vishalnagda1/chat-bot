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

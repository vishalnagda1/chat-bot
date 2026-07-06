import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { config } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { orgRoutes } from "./routes/organizations.js";
import { registerAuth } from "@repo/auth-middleware";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(cors);
  await app.register(jwt, { secret: config.jwtSecret });

  // Register shared auth middleware (skips /health and /api/auth/*)
  registerAuth(app);

  // Health check
  app.get("/health", async () => {
    return { status: "ok", service: "auth" };
  });

  // Register routes
  await app.register(authRoutes);
  await app.register(orgRoutes);

  return app;
}

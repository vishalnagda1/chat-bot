import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { config } from "./config.js";
import { botRoutes } from "./routes/bots.js";
import { flowRoutes } from "./routes/flows.js";
import { registerAuth } from "@repo/auth-middleware";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(cors);
  await app.register(jwt, { secret: config.jwtSecret });

  // Register auth middleware
  registerAuth(app);

  // Health check
  app.get("/health", async () => {
    return { status: "ok", service: "builder" };
  });

  // Register routes
  await app.register(botRoutes);
  await app.register(flowRoutes);

  return app;
}

import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { auditRoutes } from "./routes/audit.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(cors);

  // Health check
  app.get("/health", async () => {
    return { status: "ok", service: "analytics" };
  });

  // Register routes
  await app.register(analyticsRoutes);
  await app.register(auditRoutes);

  return app;
}

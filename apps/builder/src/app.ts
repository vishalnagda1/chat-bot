import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { botRoutes } from "./routes/bots.js";
import { flowRoutes } from "./routes/flows.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(cors);

  // Health check
  app.get("/health", async () => {
    return { status: "ok", service: "builder" };
  });

  // Register routes
  await app.register(botRoutes);
  await app.register(flowRoutes);

  return app;
}

import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { deploymentRoutes } from "./routes/deployments.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(cors);

  // Health check
  app.get("/health", async () => {
    return { status: "ok", service: "deployment" };
  });

  // Register routes
  await app.register(deploymentRoutes);

  return app;
}

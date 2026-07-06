import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { config } from "./config.js";
import { deploymentRoutes } from "./routes/deployments.js";
import { channelBindingRoutes } from "./routes/channel-bindings.js";
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
    return { status: "ok", service: "deployment" };
  });

  // Register routes
  await app.register(deploymentRoutes);
  await app.register(channelBindingRoutes);

  return app;
}

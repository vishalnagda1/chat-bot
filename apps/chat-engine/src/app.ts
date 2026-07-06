import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import { config } from "./config.js";
import { chatRoutes } from "./routes/chat.js";
import { registerAuth } from "@repo/auth-middleware";
import { createRateLimiter } from "./middleware/rate-limit.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(cors);
  await app.register(jwt, { secret: config.jwtSecret });
  await app.register(websocket);

  // Register auth middleware
  registerAuth(app);

  // Rate limiting for chat endpoints
  const rateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 30 });

  // Health check
  app.get("/health", async () => {
    return { status: "ok", service: "chat-engine" };
  });

  // Register routes with rate limiting
  await app.register(async (fastify) => {
    fastify.addHook("preHandler", rateLimiter);
    await fastify.register(chatRoutes);
  });

  return app;
}

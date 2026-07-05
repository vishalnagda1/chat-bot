import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { config } from "./config.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(cors);
  await app.register(websocket);

  // Health check
  app.get("/health", async () => {
    return { status: "ok", service: "chat-engine" };
  });

  return app;
}

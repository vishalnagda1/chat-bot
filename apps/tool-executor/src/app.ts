import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  await app.register(cors);

  // Health check
  app.get("/health", async () => {
    return { status: "ok", service: "tool-executor" };
  });

  return app;
}

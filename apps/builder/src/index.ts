import { buildApp } from "./app.js";
import { config } from "./config.js";
import { connectNats } from "@repo/events/nats";

async function start() {
  // Connect to NATS
  try {
    await connectNats(config.natsUrl);
  } catch (err) {
    console.warn("Failed to connect to NATS, events will not be published:", err);
  }

  const app = await buildApp();

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`Builder service running on http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

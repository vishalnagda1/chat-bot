export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  natsUrl: process.env.NATS_URL || "nats://localhost:4222",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  logLevel: process.env.LOG_LEVEL || "info",
};

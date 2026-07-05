import pino from "pino";

export type Logger = pino.Logger;

export function createLogger(name: string, level?: string): Logger {
  return pino({
    name,
    level: level || process.env.LOG_LEVEL || "info",
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  });
}

export default createLogger;

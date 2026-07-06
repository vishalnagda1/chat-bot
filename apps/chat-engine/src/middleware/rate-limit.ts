import { FastifyRequest, FastifyReply } from "fastify";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
};

export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const { windowMs, maxRequests } = { ...defaultConfig, ...config };

  return async function rateLimiter(request: FastifyRequest, reply: FastifyReply) {
    // Get client identifier (user ID or IP)
    const clientId = request.user?.userId || request.ip;
    const key = `ratelimit:${clientId}`;
    const now = Date.now();

    // Get or create entry
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    reply.header("X-RateLimit-Limit", maxRequests);
    reply.header("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count));
    reply.header("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    // Check if rate limit exceeded
    if (entry.count >= maxRequests) {
      return reply.status(429).send({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetAt - now) / 1000)} seconds.`,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }
  };
}

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startRateLimitCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000);
}

export function stopRateLimitCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

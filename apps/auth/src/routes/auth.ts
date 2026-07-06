import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createUser,
  loginUser,
  getUserById,
  createSession,
  getSessionByToken,
  deleteSession,
  deleteAllUserSessions,
} from "../services/user.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post("/api/auth/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);

    const user = await createUser(input);

    const token = app.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: "15m" });
    const refreshToken = app.jwt.sign({ userId: user.id, type: "refresh" }, { expiresIn: "7d" });

    // Store session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await createSession(user.id, refreshToken, expiresAt);

    return reply.status(201).send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
        refreshToken,
      },
    });
  });

  // Login
  app.post("/api/auth/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);

    const user = await loginUser(input);

    const token = app.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: "15m" });
    const refreshToken = app.jwt.sign({ userId: user.id, type: "refresh" }, { expiresIn: "7d" });

    // Store session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await createSession(user.id, refreshToken, expiresAt);

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
        refreshToken,
      },
    });
  });

  // Refresh token
  app.post("/api/auth/refresh", async (request, reply) => {
    const input = refreshSchema.parse(request.body);

    try {
      const decoded = app.jwt.verify<{ userId: string; type: string }>(input.refreshToken);

      if (decoded.type !== "refresh") {
        return reply.status(401).send({ error: "Invalid token type" });
      }

      // Check if session exists
      const session = await getSessionByToken(input.refreshToken);
      if (!session) {
        return reply.status(401).send({ error: "Invalid refresh token" });
      }

      // Get user
      const user = await getUserById(decoded.userId);

      // Generate new tokens
      const newToken = app.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: "15m" });
      const newRefreshToken = app.jwt.sign({ userId: user.id, type: "refresh" }, { expiresIn: "7d" });

      // Delete old session and create new one
      await deleteSession(input.refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await createSession(user.id, newRefreshToken, expiresAt);

      return reply.send({
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (err) {
      return reply.status(401).send({ error: "Invalid refresh token" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (request, reply) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const token = auth.slice(7);

    try {
      const decoded = app.jwt.verify<{ userId: string }>(token);
      await deleteAllUserSessions(decoded.userId);
    } catch (err) {
      // Token may be expired or invalid - still return success for logout
    }

    return reply.send({
      success: true,
      data: null,
    });
  });

  // Get current user
  app.get("/api/auth/me", async (request, reply) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const token = auth.slice(7);
    const decoded = app.jwt.verify<{ userId: string }>(token);
    const user = await getUserById(decoded.userId);

    return reply.send({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  });
}

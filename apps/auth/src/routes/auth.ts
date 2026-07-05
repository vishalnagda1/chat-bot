import { FastifyInstance } from "fastify";
import { z } from "zod";
import { createUser, loginUser, getUserById } from "../services/user.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post("/api/auth/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);

    const user = await createUser(input);

    const token = app.jwt.sign({ userId: user.id, email: user.email });

    return reply.status(201).send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
    });
  });

  // Login
  app.post("/api/auth/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);

    const user = await loginUser(input);

    const token = app.jwt.sign({ userId: user.id, email: user.email });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
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

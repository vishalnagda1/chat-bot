const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost";

const services = {
  auth: `${API_BASE}:3001`,
  builder: `${API_BASE}:3002`,
  chat: `${API_BASE}:3003`,
  deployment: `${API_BASE}:3005`,
  analytics: `${API_BASE}:3006`,
};

async function request<T>(
  service: keyof typeof services,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${services[service]}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || data.error || "Request failed");
  return data;
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; name: string }) =>
      request<{ data: { user: { id: string; email: string; name: string }; token: string } }>(
        "auth", "/api/auth/register", { method: "POST", body: JSON.stringify(body) }
      ),
    login: (body: { email: string; password: string }) =>
      request<{ data: { user: { id: string; email: string; name: string }; token: string } }>(
        "auth", "/api/auth/login", { method: "POST", body: JSON.stringify(body) }
      ),
  },
  orgs: {
    list: () => request<{ data: Array<{ id: string; name: string }> }>("auth", "/api/orgs"),
    create: (body: { name: string }) =>
      request<{ data: { id: string; name: string } }>("auth", "/api/orgs", {
        method: "POST", body: JSON.stringify(body),
      }),
  },
  bots: {
    list: (orgId: string) =>
      request<{ data: Array<{ id: string; name: string; description: string; status: string; createdAt: string }> }>(
        "builder", `/api/bots?orgId=${orgId}`
      ),
    get: (botId: string) =>
      request<{ data: { id: string; name: string; description: string; status: string } }>(
        "builder", `/api/bots/${botId}`
      ),
    create: (body: { orgId: string; name: string; description?: string }) =>
      request<{ data: { id: string } }>("builder", "/api/bots", {
        method: "POST", body: JSON.stringify(body),
      }),
    update: (botId: string, body: { name?: string; description?: string }) =>
      request<{ data: { id: string } }>("builder", `/api/bots/${botId}`, {
        method: "PATCH", body: JSON.stringify(body),
      }),
    delete: (botId: string) =>
      request<{ data: null }>("builder", `/api/bots/${botId}`, { method: "DELETE" }),
    publish: (botId: string, versionId: string) =>
      request<{ data: { id: string; status: string } }>("builder", `/api/bots/${botId}/publish`, {
        method: "POST", body: JSON.stringify({ versionId }),
      }),
  },
  flows: {
    list: (botId: string) =>
      request<{ data: Array<{ id: string; name: string; nodes: unknown[]; edges: unknown[] }> }>(
        "builder", `/api/bots/${botId}/flows`
      ),
    save: (botId: string, body: { name: string; nodes: unknown[]; edges: unknown[] }) =>
      request<{ data: { id: string } }>("builder", `/api/bots/${botId}/flows`, {
        method: "PUT", body: JSON.stringify(body),
      }),
  },
  versions: {
    list: (botId: string) =>
      request<{ data: Array<{ id: string; version: number; provider: string; systemPrompt: string; model: string; isLive: boolean }> }>(
        "builder", `/api/bots/${botId}/versions`
      ),
    create: (botId: string, body: { provider?: string; systemPrompt?: string; model?: string; temperature?: number; maxTokens?: number }) =>
      request<{ data: { id: string } }>("builder", `/api/bots/${botId}/versions`, {
        method: "POST", body: JSON.stringify(body),
      }),
  },
  chat: {
    createConversation: (botId: string) =>
      request<{ data: { id: string } }>("chat", `/api/bots/${botId}/conversations`, {
        method: "POST", body: JSON.stringify({ channel: "web" }),
      }),
    sendMessage: (conversationId: string, content: string) =>
      request<{ data: { message: { id: string; content: string; role: string } } }>(
        "chat", `/api/conversations/${conversationId}/messages`, {
          method: "POST", body: JSON.stringify({ content }),
        }
      ),
  },
  analytics: {
    getDashboard: (orgId: string) =>
      request<{ data: { totalConversations: number; totalMessages: number; totalTokens: number; averageMessagesPerConversation: number } }>(
        "analytics", `/api/dashboard/${orgId}`
      ),
    getMetrics: (orgId: string, params?: { startDate?: string; endDate?: string }) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request<{ data: unknown[] }>("analytics", `/api/organizations/${orgId}/metrics${query}`);
    },
    getEvents: (orgId: string, params?: { limit?: number; offset?: number }) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
      return request<{ data: unknown[] }>("analytics", `/api/organizations/${orgId}/events${query}`);
    },
  },
  orgSettings: {
    get: (orgId: string) =>
      request<{ data: { id: string; name: string; plan: string; createdAt: string } }>(
        "auth", `/api/orgs/${orgId}`
      ),
    update: (orgId: string, body: { name: string }) =>
      request<{ data: { id: string; name: string } }>(
        "auth", `/api/orgs/${orgId}`, { method: "PATCH", body: JSON.stringify(body) }
      ),
    getMembers: (orgId: string) =>
      request<{ data: Array<{ id: string; userId: string; role: string; user?: { id: string; email: string; name: string } }> }>(
        "auth", `/api/orgs/${orgId}/members`
      ),
    inviteMember: (orgId: string, body: { email: string; role: string }) =>
      request<{ data: { id: string } }>(
        "auth", `/api/orgs/${orgId}/members`, { method: "POST", body: JSON.stringify(body) }
      ),
    removeMember: (orgId: string, userId: string) =>
      request<{ data: null }>(
        "auth", `/api/orgs/${orgId}/members/${userId}`, { method: "DELETE" }
      ),
  },
};

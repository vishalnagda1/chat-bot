// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: Date;
}

export type Role = "owner" | "admin" | "editor" | "viewer";

export interface Membership {
  id: string;
  userId: string;
  orgId: string;
  role: Role;
  createdAt: Date;
}

// Bot types
export type BotStatus = "draft" | "published";

export interface Bot {
  id: string;
  orgId: string;
  name: string;
  description: string;
  status: BotStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotConfig {
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  welcomeMessage: string;
}

// Flow types
export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Flow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

// Conversation types
export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  tokens?: number;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  botId: string;
  endUserId: string;
  channel: string;
  startedAt: Date;
  lastMessageAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

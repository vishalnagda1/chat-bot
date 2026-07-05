import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";

const client = new Anthropic({
  apiKey: config.anthropicApiKey,
});

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateResponse(
  messages: LLMMessage[],
  options: LLMOptions = {}
) {
  const {
    model = "claude-sonnet-5-20250514",
    systemPrompt = "You are a helpful assistant.",
    temperature = 0.7,
    maxTokens = 4096,
  } = options;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const content = response.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return {
    content: content.text,
    usage: response.usage,
  };
}

export async function* streamResponse(
  messages: LLMMessage[],
  options: LLMOptions = {}
) {
  const {
    model = "claude-sonnet-5-20250514",
    systemPrompt = "You are a helpful assistant.",
    temperature = 0.7,
    maxTokens = 4096,
  } = options;

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

export async function generateWithTools(
  messages: LLMMessage[],
  tools: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }>,
  options: LLMOptions = {}
) {
  const {
    model = "claude-sonnet-5-20250514",
    systemPrompt = "You are a helpful assistant.",
    temperature = 0.7,
    maxTokens = 4096,
  } = options;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Tool["input_schema"],
    })),
  });

  return response;
}

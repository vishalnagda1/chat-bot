import Anthropic from "@anthropic-ai/sdk";
import { LLMProvider, LLMMessage, LLMOptions, LLMResponse } from "./types.js";

export class ClaudeProvider implements LLMProvider {
  name = "anthropic";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateResponse(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const {
      model = "claude-sonnet-5-20250514",
      systemPrompt = "You are a helpful assistant.",
      temperature = 0.7,
      maxTokens = 4096,
    } = options;

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const content = response.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    return {
      content: content.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async *streamResponse(messages: LLMMessage[], options: LLMOptions = {}): AsyncGenerator<string> {
    const {
      model = "claude-sonnet-5-20250514",
      systemPrompt = "You are a helpful assistant.",
      temperature = 0.7,
      maxTokens = 4096,
    } = options;

    const stream = this.client.messages.stream({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
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

  async generateWithTools(
    messages: LLMMessage[],
    tools: Array<{
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
    }>,
    options: LLMOptions = {}
  ): Promise<LLMResponse> {
    const {
      model = "claude-sonnet-5-20250514",
      systemPrompt = "You are a helpful assistant.",
      temperature = 0.7,
      maxTokens = 4096,
    } = options;

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
      })),
    });

    let textContent = "";
    const toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = [];

    for (const block of response.content) {
      if (block.type === "text") {
        textContent += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input as Record<string, unknown>,
        });
      }
    }

    return {
      content: textContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}

import OpenAI from "openai";
import { LLMProvider, LLMMessage, LLMOptions, LLMResponse } from "./types.js";

export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({
      apiKey,
      ...(baseURL && { baseURL }),
    });
  }

  async generateResponse(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const {
      model = "gpt-4o",
      systemPrompt = "You are a helpful assistant.",
      temperature = 0.7,
      maxTokens = 4096,
    } = options;

    const response = await this.client.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error("No response from OpenAI");
    }

    return {
      content: choice.message.content,
      usage: {
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      },
    };
  }

  async *streamResponse(messages: LLMMessage[], options: LLMOptions = {}): AsyncGenerator<string> {
    const {
      model = "gpt-4o",
      systemPrompt = "You are a helpful assistant.",
      temperature = 0.7,
      maxTokens = 4096,
    } = options;

    const stream = await this.client.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
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
      model = "gpt-4o",
      systemPrompt = "You are a helpful assistant.",
      temperature = 0.7,
      maxTokens = 4096,
    } = options;

    const response = await this.client.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      tools: tools.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })),
    });

    const choice = response.choices[0];
    return {
      content: choice?.message?.content || "",
      usage: {
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      },
    };
  }
}

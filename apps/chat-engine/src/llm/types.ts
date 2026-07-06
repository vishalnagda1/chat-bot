export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMToolResult {
  toolCallId: string;
  content: string;
}

export interface LLMOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  toolCalls?: LLMToolCall[];
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface LLMTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface LLMProvider {
  name: string;
  generateResponse(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse>;
  streamResponse(messages: LLMMessage[], options: LLMOptions): AsyncGenerator<string>;
  generateWithTools(
    messages: LLMMessage[],
    tools: LLMTool[],
    options: LLMOptions
  ): Promise<LLMResponse>;
}

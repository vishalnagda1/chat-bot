import { LLMMessage, LLMTool, LLMOptions, LLMProvider, LLMToolCall } from "../llm/types.js";
import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";

const MAX_TOOL_ROUNDS = 5;

export interface ToolCallResult {
  toolCallId: string;
  name: string;
  result: unknown;
  success: boolean;
  error?: string;
}

export async function executeToolCall(
  toolCall: LLMToolCall,
  conversationId: string
): Promise<ToolCallResult> {
  try {
    // Find the tool in the database
    const tool = await db.query.tools.findFirst({
      where: eq(schema.tools.name, toolCall.name),
    });

    if (!tool) {
      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        result: null,
        success: false,
        error: `Tool "${toolCall.name}" not found`,
      };
    }

    // Execute the tool via the tool-executor service
    const executorUrl = process.env.TOOL_EXECUTOR_URL || "http://tool-executor:3000";
    const response = await fetch(`${executorUrl}/api/tools/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolId: tool.id,
        conversationId,
        input: toolCall.arguments,
      }),
    });

    const result = await response.json();

    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      result: result.data?.output || result,
      success: result.success !== false,
      error: result.error,
    };
  } catch (error) {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      result: null,
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function chatWithTools(
  provider: LLMProvider,
  messages: LLMMessage[],
  tools: LLMTool[],
  options: LLMOptions
): Promise<{ content: string; toolCalls: ToolCallResult[] }> {
  const allToolCalls: ToolCallResult[] = [];
  let currentMessages = [...messages];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // Call LLM with tools
    const response = await provider.generateWithTools(currentMessages, tools, options);

    // If no tool calls, return the response
    if (!response.toolCalls || response.toolCalls.length === 0) {
      return { content: response.content, toolCalls: allToolCalls };
    }

    // Execute tool calls
    const toolResults: string[] = [];
    for (const toolCall of response.toolCalls) {
      const result = await executeToolCall(toolCall, "");
      allToolCalls.push(result);

      // Format tool result for the LLM
      toolResults.push(
        JSON.stringify({
          tool_call_id: toolCall.id,
          result: result.success ? result.result : { error: result.error },
        })
      );
    }

    // Add assistant message with tool calls to history
    currentMessages.push({
      role: "assistant",
      content: response.content || JSON.stringify(response.toolCalls),
    });

    // Add tool results as user message
    currentMessages.push({
      role: "user",
      content: `Tool execution results:\n${toolResults.join("\n")}`,
    });
  }

  // If we've exhausted tool rounds, get a final response
  const finalResponse = await provider.generateResponse(currentMessages, options);
  return { content: finalResponse.content, toolCalls: allToolCalls };
}

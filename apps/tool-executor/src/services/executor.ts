import { getToolById, recordExecution } from "./tool.js";
import { executeApiCall, ApiCallConfig } from "../executors/api-call.js";
import { executeCode, CodeConfig } from "../executors/code.js";
import { executeSendEmail, EmailConfig } from "../executors/email.js";
import { executeSendSms, SmsConfig } from "../executors/sms.js";

export interface ToolExecutionResult {
  success: boolean;
  output: unknown;
  latencyMs: number;
  error?: string;
}

export async function executeTool(
  toolId: string,
  conversationId: string,
  input: Record<string, unknown>
): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  try {
    const tool = await getToolById(toolId);
    const config = tool.config as Record<string, unknown>;

    let result: { success: boolean; data: unknown; error?: string };

    switch (tool.type) {
      case "api_call":
        result = await executeApiCall(config as unknown as ApiCallConfig, {
          params: input.params as Record<string, string>,
          body: input.body as Record<string, unknown>,
        });
        break;

      case "code":
        const codeResult = await executeCode(config as unknown as CodeConfig, {
          variables: input.variables as Record<string, unknown>,
        });
        result = {
          success: codeResult.success,
          data: codeResult.output,
          error: codeResult.error,
        };
        break;

      case "email":
        const emailResult = await executeSendEmail(config as unknown as EmailConfig, {
          to: input.to as string,
          subject: input.subject as string,
          body: input.body as string,
        });
        result = {
          success: emailResult.success,
          data: { messageId: emailResult.messageId },
          error: emailResult.error,
        };
        break;

      case "sms":
        const smsResult = await executeSendSms(config as unknown as SmsConfig, {
          to: input.to as string,
          message: input.message as string,
        });
        result = {
          success: smsResult.success,
          data: { messageId: smsResult.messageId },
          error: smsResult.error,
        };
        break;

      default:
        result = {
          success: false,
          data: null,
          error: `Unknown tool type: ${tool.type}`,
        };
    }

    const latencyMs = Date.now() - startTime;

    // Record execution
    await recordExecution(
      { toolId, conversationId, input },
      result.data as Record<string, unknown>,
      result.success ? "success" : "error",
      latencyMs
    );

    return {
      success: result.success,
      output: result.data,
      latencyMs,
      error: result.error,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    return {
      success: false,
      output: null,
      latencyMs,
      error: (error as Error).message,
    };
  }
}

export function getToolDefinitions(tools: Array<{ name: string; description: string; parametersSchema: unknown }>) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description || "",
    input_schema: tool.parametersSchema || {
      type: "object",
      properties: {},
    },
  }));
}

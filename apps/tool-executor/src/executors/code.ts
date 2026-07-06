import vm from "vm";

export interface CodeConfig {
  language: "javascript";
  code: string;
  timeout?: number;
}

export interface CodeInput {
  variables?: Record<string, unknown>;
}

export interface CodeResult {
  success: boolean;
  output: unknown;
  error?: string;
}

export async function executeCode(
  config: CodeConfig,
  input: CodeInput
): Promise<CodeResult> {
  const { code, timeout = 5000 } = config;

  const logs: string[] = [];
  const sandbox = {
    input: input.variables || {},
    console: {
      log: (...args: unknown[]) => {
        logs.push(args.map(String).join(" "));
      },
    },
  };

  const context = vm.createContext(sandbox);

  const wrappedCode = `
    (function() {
      const result = (function(input, console) {
        ${code}
      })(input, console);
      return result !== undefined ? result : undefined;
    })()
  `;

  try {
    const script = new vm.Script(wrappedCode, { filename: "user-code.js" });
    const result = script.runInContext(context, { timeout });

    return {
      success: true,
      output: result !== undefined ? result : logs.join("\n"),
    };
  } catch (error) {
    return {
      success: false,
      output: null,
      error: (error as Error).message,
    };
  }
}

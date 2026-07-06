import { VM } from "vm2";

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

  try {
    const sandbox = {
      input: input.variables || {},
      console: {
        log: (...args: unknown[]) => {
          // Capture console.log output
          sandbox._output = sandbox._output || [];
          sandbox._output.push(args.join(" "));
        },
      },
      _output: [] as string[],
    };

    const vm = new VM({
      timeout,
      sandbox,
    });

    const result = vm.run(code);

    return {
      success: true,
      output: result !== undefined ? result : sandbox._output.join("\n"),
    };
  } catch (error) {
    return {
      success: false,
      output: null,
      error: (error as Error).message,
    };
  }
}

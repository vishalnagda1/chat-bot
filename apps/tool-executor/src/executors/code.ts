import ivm from "isolated-vm";

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

  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = await isolate.createContext();

  try {
    // Set up globals
    const jail = context.global;
    await jail.set("global", jail.derefInto());
    await jail.set("input", new ivm.ExternalCopy(input.variables || {}).copyInto());

    // Capture console.log output
    const logs: string[] = [];
    await jail.set(
      "log",
      new ivm.Callback((...args: unknown[]) => {
        logs.push(args.map(String).join(" "));
      })
    );

    // Wrap code to capture output
    const wrappedCode = `
      (function() {
        const console = { log: log };
        const __logs = [];
        const result = (function(input, console) {
          ${code}
        })(input, console);
        return result !== undefined ? result : __logs.join("\\n");
      })()
    `;

    const script = await isolate.compileScript(wrappedCode);
    const result = await script.run(context, { timeout });

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
  } finally {
    isolate.dispose();
  }
}

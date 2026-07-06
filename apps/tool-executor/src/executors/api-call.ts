export interface ApiCallConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiCallInput {
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}

export async function executeApiCall(
  config: ApiCallConfig,
  input: ApiCallInput
): Promise<{ success: boolean; data: unknown; status: number }> {
  const { url, method, headers = {}, timeout = 30000 } = config;

  // Build URL with params
  let requestUrl = url;
  if (input.params) {
    const searchParams = new URLSearchParams(input.params);
    requestUrl += `?${searchParams.toString()}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(requestUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: input.body ? JSON.stringify(input.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    return {
      success: response.ok,
      data,
      status: response.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        data: { error: "Request timed out" },
        status: 408,
      };
    }

    return {
      success: false,
      data: { error: (error as Error).message },
      status: 500,
    };
  }
}

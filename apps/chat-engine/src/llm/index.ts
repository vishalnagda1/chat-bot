import { LLMProvider } from "./types.js";
import { ClaudeProvider } from "./claude.js";
import { OpenAIProvider } from "./openai.js";

export type ProviderName = "anthropic" | "openai";

interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
}

const providers = new Map<ProviderName, LLMProvider>();

export function initProviders(configs: Partial<Record<ProviderName, ProviderConfig>>) {
  if (configs.anthropic?.apiKey) {
    providers.set("anthropic", new ClaudeProvider(configs.anthropic.apiKey));
  }
  if (configs.openai?.apiKey) {
    providers.set(
      "openai",
      new OpenAIProvider(configs.openai.apiKey, configs.openai.baseURL)
    );
  }
}

export function getProvider(name: ProviderName): LLMProvider {
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(
      `LLM provider "${name}" not configured. Available: ${[...providers.keys()].join(", ") || "none"}`
    );
  }
  return provider;
}

export function getAvailableProviders(): ProviderName[] {
  return [...providers.keys()];
}

export function getDefaultProvider(): ProviderName {
  if (providers.has("anthropic")) return "anthropic";
  if (providers.has("openai")) return "openai";
  throw new Error("No LLM providers configured");
}

export interface ApiConfig {
  apiKey: string;
  webhookUrl?: string;
  botId: string;
}

export interface ApiMessage {
  message: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}

export class ApiConnector {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  async processMessage(message: ApiMessage): Promise<{ success: boolean; response?: string; conversationId?: string; error?: string }> {
    try {
      const chatEngineUrl = process.env.CHAT_ENGINE_URL || "http://localhost:3003";
      const response = await fetch(`${chatEngineUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: this.config.botId,
          message: message.message,
          conversationId: message.conversationId,
          channel: "api",
          metadata: message.metadata,
        }),
      });
      const data = await response.json();
      return {
        success: true,
        response: data.data?.message,
        conversationId: data.data?.conversationId || message.conversationId,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async sendWebhook(event: string, data: unknown): Promise<{ success: boolean; error?: string }> {
    if (!this.config.webhookUrl) {
      return { success: true };
    }

    // In production, you'd send the webhook
    console.log("Sending webhook:", { event, data, url: this.config.webhookUrl });

    return { success: true };
  }

  verifyApiKey(apiKey: string): boolean {
    return apiKey === this.config.apiKey;
  }
}

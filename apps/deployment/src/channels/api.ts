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
    // In production, this would call the chat engine
    console.log("Processing API message:", message);

    return {
      success: true,
      response: `Echo: ${message.message}`,
      conversationId: message.conversationId || `conv_${Date.now()}`,
    };
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

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  botId: string;
}

export interface WhatsAppMessage {
  to: string;
  type: "text" | "image" | "template";
  text?: { body: string };
  image?: { link: string };
  template?: { name: string; language: { code: string }; components: unknown[] };
}

export class WhatsAppConnector {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // In production, you'd use the WhatsApp Business API
    console.log("Sending WhatsApp message:", message);

    return {
      success: true,
      messageId: `wamid.${Date.now()}`,
    };
  }

  async verifyWebhook(mode: string, token: string): Promise<boolean> {
    if (mode === "subscribe" && token === this.config.verifyToken) {
      return true;
    }
    return false;
  }

  parseWebhookMessage(body: unknown): { from: string; message: string } | null {
    // Parse incoming WhatsApp webhook
    const data = body as { entry?: { changes?: { value?: { messages?: { from: string; text?: { body: string } }[] } }[] }[] };
    const message = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      return {
        from: message.from,
        message: message.text?.body || "",
      };
    }

    return null;
  }
}

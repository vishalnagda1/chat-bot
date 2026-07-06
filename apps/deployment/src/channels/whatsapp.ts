export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  botId: string;
  apiVersion?: string;
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
  private baseUrl: string;

  constructor(config: WhatsAppConfig) {
    this.config = config;
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion || "v18.0"}`;
  }

  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: message.to,
            type: message.type,
            [message.type]: message[message.type],
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to send WhatsApp message");
      }

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async verifyWebhook(mode: string, token: string): Promise<boolean> {
    if (mode === "subscribe" && token === this.config.verifyToken) {
      return true;
    }
    return false;
  }

  parseWebhookMessage(body: unknown): { from: string; message: string; type: string } | null {
    const data = body as {
      entry?: {
        changes?: {
          value?: {
            messages?: { from: string; text?: { body: string }; type: string }[];
          };
        }[];
      }[];
    };

    const message = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      return {
        from: message.from,
        message: message.text?.body || "",
        type: message.type,
      };
    }

    return null;
  }
}

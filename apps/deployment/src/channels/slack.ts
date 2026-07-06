export interface SlackConfig {
  botToken: string;
  appToken?: string;
  signingSecret: string;
  botId: string;
}

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: unknown[];
}

export class SlackConnector {
  private config: SlackConfig;
  private baseUrl = "https://slack.com/api";

  constructor(config: SlackConfig) {
    this.config = config;
  }

  async sendMessage(message: SlackMessage): Promise<{ success: boolean; ts?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.botToken}`,
        },
        body: JSON.stringify({
          channel: message.channel,
          text: message.text,
          blocks: message.blocks,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "Failed to send Slack message");
      }

      return {
        success: true,
        ts: result.ts,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async verifySignature(timestamp: string, signature: string, body: string): Promise<boolean> {
    const crypto = await import("crypto");
    const hmac = crypto.createHmac("sha256", this.config.signingSecret);
    const baseString = `v0:${timestamp}:${body}`;
    hmac.update(baseString);
    const expectedSignature = `v0=${hmac.digest("hex")}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  async handleEvent(event: { type: string; event?: { type: string; user?: string; text?: string; channel?: string } }, botId?: string): Promise<string | null> {
    if (event.type === "url_verification") {
      return null;
    }

    if (event.event?.type === "message" && event.event.user !== this.config.botId && event.event.text && event.event.channel) {
      try {
        const chatEngineUrl = process.env.CHAT_ENGINE_URL || "http://localhost:3003";
        const response = await fetch(`${chatEngineUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            botId: botId,
            message: event.event.text,
            conversationId: event.event.channel,
            channel: "slack",
            endUserId: event.event.user,
          }),
        });
        const data = await response.json();
        if (data.data?.message) {
          return data.data.message;
        }
      } catch (error) {
        console.error("Failed to process Slack message:", error);
      }
    }
    return null;
  }
}

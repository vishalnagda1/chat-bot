interface ChatBotConfig {
  botId: string;
  apiUrl?: string;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  position?: "bottom-right" | "bottom-left";
  greeting?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

class ChatBotWidget {
  private config: ChatBotConfig;
  private container: HTMLDivElement | null = null;
  private isOpen = false;
  private messages: Message[] = [];

  constructor(config: ChatBotConfig) {
    this.config = {
      apiUrl: "http://localhost:3003",
      position: "bottom-right",
      greeting: "Hello! How can I help you?",
      ...config,
    };
    this.init();
  }

  private init() {
    this.createContainer();
    this.createStyles();
    this.createButton();
    this.createChatWindow();
  }

  private createContainer() {
    this.container = document.createElement("div");
    this.container.id = "chatbot-widget";
    document.body.appendChild(this.container);
  }

  private createStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #chatbot-widget {
        position: fixed;
        ${this.config.position === "bottom-left" ? "left: 20px" : "right: 20px"};
        bottom: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .chatbot-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.config.theme?.primaryColor || "#3b82f6"};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .chatbot-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      .chatbot-button svg {
        width: 28px;
        height: 28px;
        fill: white;
      }

      .chatbot-window {
        position: absolute;
        bottom: 70px;
        ${this.config.position === "bottom-left" ? "left: 0" : "right: 0"};
        width: 350px;
        height: 500px;
        background: ${this.config.theme?.backgroundColor || "#ffffff"};
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      .chatbot-window.open {
        display: flex;
      }

      .chatbot-header {
        padding: 16px;
        background: ${this.config.theme?.primaryColor || "#3b82f6"};
        color: white;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .chatbot-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        line-height: 1;
      }

      .chatbot-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .chatbot-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.4;
      }

      .chatbot-message.user {
        align-self: flex-end;
        background: ${this.config.theme?.primaryColor || "#3b82f6"};
        color: white;
        border-bottom-right-radius: 4px;
      }

      .chatbot-message.assistant {
        align-self: flex-start;
        background: #f1f5f9;
        color: ${this.config.theme?.textColor || "#1e293b"};
        border-bottom-left-radius: 4px;
      }

      .chatbot-input-area {
        padding: 12px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 8px;
      }

      .chatbot-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
      }

      .chatbot-input:focus {
        border-color: ${this.config.theme?.primaryColor || "#3b82f6"};
      }

      .chatbot-send {
        padding: 10px 16px;
        background: ${this.config.theme?.primaryColor || "#3b82f6"};
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }

      .chatbot-send:hover {
        opacity: 0.9;
      }

      .chatbot-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  private createButton() {
    const button = document.createElement("button");
    button.className = "chatbot-button";
    button.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
    `;
    button.onclick = () => this.toggle();
    this.container!.appendChild(button);
  }

  private createChatWindow() {
    const window = document.createElement("div");
    window.className = "chatbot-window";
    window.innerHTML = `
      <div class="chatbot-header">
        <span>Chat Support</span>
        <button class="chatbot-close">&times;</button>
      </div>
      <div class="chatbot-messages">
        <div class="chatbot-message assistant">${this.config.greeting}</div>
      </div>
      <div class="chatbot-input-area">
        <input type="text" class="chatbot-input" placeholder="Type your message..." />
        <button class="chatbot-send">Send</button>
      </div>
    `;

    const closeBtn = window.querySelector(".chatbot-close") as HTMLButtonElement;
    closeBtn.onclick = () => this.toggle();

    const input = window.querySelector(".chatbot-input") as HTMLInputElement;
    const sendBtn = window.querySelector(".chatbot-send") as HTMLButtonElement;

    const sendMessage = () => {
      const message = input.value.trim();
      if (!message) return;

      this.addMessage("user", message);
      input.value = "";
      sendBtn.disabled = true;

      // Simulate response (in production, call chat engine API)
      setTimeout(() => {
        this.addMessage(
          "assistant",
          `Thank you for your message. Our team will get back to you soon.`
        );
        sendBtn.disabled = false;
      }, 1000);
    };

    input.onkeypress = (e) => {
      if (e.key === "Enter") sendMessage();
    };
    sendBtn.onclick = sendMessage;

    this.container!.appendChild(window);
  }

  private toggle() {
    this.isOpen = !this.isOpen;
    const window = this.container!.querySelector(".chatbot-window");
    if (this.isOpen) {
      window?.classList.add("open");
    } else {
      window?.classList.remove("open");
    }
  }

  private addMessage(role: "user" | "assistant", content: string) {
    const messages = this.container!.querySelector(".chatbot-messages");
    const messageEl = document.createElement("div");
    messageEl.className = `chatbot-message ${role}`;
    messageEl.textContent = content;
    messages?.appendChild(messageEl);
    messages?.scrollTo(0, messages.scrollHeight);

    this.messages.push({
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toISOString(),
    });
  }
}

// Initialize widget when script loads
declare global {
  interface Window {
    ChatBotConfig: ChatBotConfig;
  }
}

const config = window.ChatBotConfig;
if (config) {
  new ChatBotWidget(config);
}

export interface WebWidgetConfig {
  botId: string;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  position?: "bottom-right" | "bottom-left";
  greeting?: string;
}

export function generateWebWidgetScript(config: WebWidgetConfig): string {
  const theme = JSON.stringify(config.theme || {});
  const position = config.position || "bottom-right";

  return `
<!-- ChatBot Widget -->
<script>
  window.ChatBotConfig = {
    botId: "${config.botId}",
    theme: ${theme},
    position: "${position}",
    greeting: "${config.greeting || "Hello! How can I help you?"}"
  };
</script>
<script src="/widget.js" async></script>
<!-- End ChatBot Widget -->
  `.trim();
}

export function generateWebWidgetEmbed(config: WebWidgetConfig): string {
  const script = generateWebWidgetScript(config);

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Chat Support</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  ${script}
</body>
</html>
  `.trim();
}

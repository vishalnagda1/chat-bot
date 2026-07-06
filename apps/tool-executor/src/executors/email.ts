import nodemailer from "nodemailer";

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  username?: string;
  password?: string;
  from: string;
  secure?: boolean;
}

export interface EmailInput {
  to: string | string[];
  subject: string;
  body: string;
  html?: boolean;
}

export async function executeSendEmail(
  config: EmailConfig,
  input: EmailInput
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.secure ?? config.smtpPort === 465,
      auth: config.username
        ? {
            user: config.username,
            pass: config.password,
          }
        : undefined,
    });

    const recipients = Array.isArray(input.to) ? input.to.join(", ") : input.to;

    const info = await transporter.sendMail({
      from: config.from,
      to: recipients,
      subject: input.subject,
      [input.html ? "html" : "text"]: input.body,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

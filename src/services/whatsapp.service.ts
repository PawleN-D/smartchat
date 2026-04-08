import { AppError } from "../utils/errors.js";
import { withRetry } from "../utils/retry.js";

export class WhatsAppService {
  accessToken: string;
  phoneNumberId: string;
  graphVersion: string;
  logger: any;
  maxRetries: number;

  constructor({ accessToken, phoneNumberId, graphVersion, logger }: any) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.graphVersion = graphVersion;
    this.logger = logger;
    this.maxRetries = 2;
  }

  get messagesUrl() {
    return `https://graph.facebook.com/${this.graphVersion}/${this.phoneNumberId}/messages`;
  }

  async sendTextMessage({ to, text, replyToMessageId }) {
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
      ...(replyToMessageId
        ? {
            context: {
              message_id: replyToMessageId,
            },
          }
        : {}),
    };

    return withRetry(
      async () => {
        const response = await fetch(this.messagesUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          const retryable = response.status >= 500;
          throw new AppError("Failed to send WhatsApp message", {
            statusCode: retryable ? 503 : 502,
            code: "WHATSAPP_SEND_FAILED",
            retryable,
            details: {
              status: response.status,
              body,
            },
          });
        }

        return body;
      },
      {
        retries: this.maxRetries,
        minDelayMs: 400,
        factor: 2,
        shouldRetry: (error) => Boolean((error as any)?.retryable),
      }
    );
  }
}

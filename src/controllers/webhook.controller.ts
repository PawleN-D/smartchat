import type { FastifyReply, FastifyRequest } from "fastify";
import type { AppLogger, EnvConfig } from "../types/app.js";
import type {
  NormalizedInboundMessage,
  WhatsAppWebhookPayload,
} from "../types/webhook.js";
import { extractInboundMessages } from "../utils/normalizers.js";
import { verifySignature } from "../utils/verifySignature.js";
import type { WebhookService } from "../services/webhook.service.js";

interface WebhookVerifyQuerystring {
  "hub.mode": string;
  "hub.verify_token": string;
  "hub.challenge": string;
}

interface WebhookVerifyRequest {
  Params: Record<string, never>;
  Headers: Record<string, string | undefined>;
  Querystring: WebhookVerifyQuerystring;
}

interface WebhookReceiveHeaders {
  "x-hub-signature-256": string;
}

interface WebhookReceiveRequest {
  Params: Record<string, never>;
  Querystring: Record<string, never>;
  Headers: WebhookReceiveHeaders;
  Body: WhatsAppWebhookPayload;
}

interface CreateWebhookControllerOptions {
  env: EnvConfig;
  webhookService: WebhookService;
  logger: AppLogger;
}

export function createWebhookController({
  env,
  webhookService,
  logger,
}: CreateWebhookControllerOptions) {
  return {
    verifyWebhook: async (
      request: FastifyRequest<WebhookVerifyRequest>,
      reply: FastifyReply
    ) => {
      const mode = request.query["hub.mode"];
      const token = request.query["hub.verify_token"];
      const challenge = request.query["hub.challenge"];

      if (mode !== "subscribe" || token !== env.WHATSAPP_VERIFY_TOKEN) {
        logger.warn({ mode }, "Webhook verification failed");
        return reply.status(403).send("Forbidden");
      }

      return reply.status(200).send(challenge);
    },

    receiveWebhook: async (
      request: FastifyRequest<WebhookReceiveRequest>,
      reply: FastifyReply
    ) => {
      const signatureHeader = request.headers["x-hub-signature-256"];
      const signatureValid = verifySignature({
        rawBody: request.rawBody ?? "",
        signatureHeader,
        appSecret: env.WHATSAPP_APP_SECRET,
      });

      if (!signatureValid) {
        logger.warn("Rejected webhook with invalid signature");
        return reply.status(401).send({
          error: "UNAUTHORIZED",
          message: "Invalid webhook signature",
        });
      }

      const payload = request.body;
      const inboundMessages = extractInboundMessages(payload);

      if (inboundMessages.length === 0) {
        logger.debug("No inbound messages to process");
        return reply.status(200).send({ received: true, processed: 0 });
      }

      reply.status(200).send({
        received: true,
        processed: inboundMessages.length,
      });

      void webhookService
        .processInboundMessages(inboundMessages)
        .catch((error: unknown) => {
          logger.error(
            {
              err: error,
              inboundCount: inboundMessages.length,
              waIds: collectDistinctWaIds(inboundMessages),
            },
            "Asynchronous webhook processing failed"
          );
        });
    },
  };
}

function collectDistinctWaIds(messages: NormalizedInboundMessage[]): string[] {
  const ids = new Set<string>();
  for (const message of messages) {
    ids.add(message.waId);
  }
  return [...ids];
}

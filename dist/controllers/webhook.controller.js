import { extractInboundMessages } from "../utils/normalizers.js";
import { verifySignature } from "../utils/verifySignature.js";
export function createWebhookController({ env, webhookService, logger, }) {
    return {
        verifyWebhook: async (request, reply) => {
            const mode = request.query["hub.mode"];
            const token = request.query["hub.verify_token"];
            const challenge = request.query["hub.challenge"];
            if (mode !== "subscribe" || token !== env.WHATSAPP_VERIFY_TOKEN) {
                logger.warn({ mode }, "Webhook verification failed");
                return reply.status(403).send("Forbidden");
            }
            return reply.status(200).send(challenge);
        },
        receiveWebhook: async (request, reply) => {
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
                .catch((error) => {
                logger.error({
                    err: error,
                    inboundCount: inboundMessages.length,
                }, "Asynchronous webhook processing failed");
            });
        },
    };
}

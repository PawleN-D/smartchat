import { extractInboundMessages } from "../utils/normalizers.js";
export function createWebhookController({ env, webhookService, logger }) {
    return {
        verifyWebhook: async (request, reply) => {
            const query = request.query;
            const mode = query["hub.mode"];
            const token = query["hub.verify_token"];
            const challenge = query["hub.challenge"];
            if (mode !== "subscribe" || token !== env.WHATSAPP_VERIFY_TOKEN) {
                logger.warn({ mode }, "Webhook verification failed");
                return reply.status(403).send("Forbidden");
            }
            return reply.status(200).send(challenge);
        },
        receiveWebhook: async (request, reply) => {
            const payload = request.body;
            const inboundMessages = extractInboundMessages(payload);
            if (inboundMessages.length === 0) {
                logger.debug("No inbound messages to process");
                return reply.status(200).send({ received: true, processed: 0 });
            }
            await webhookService.processInboundMessages(inboundMessages);
            return reply
                .status(200)
                .send({ received: true, processed: inboundMessages.length });
        },
    };
}

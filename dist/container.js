import { createPrismaClient } from "./db/prisma.js";
import { AILogService } from "./services/ai-log.service.js";
import { ClassificationService } from "./services/classification.service.js";
import { ContactService } from "./services/contact.service.js";
import { MessageLogService } from "./services/message-log.service.js";
import { OpenAIService } from "./services/openai.service.js";
import { RoutingService } from "./services/routing.service.js";
import { SessionService } from "./services/session.service.js";
import { WebhookService } from "./services/webhook.service.js";
import { WhatsAppService } from "./services/whatsapp.service.js";
export function buildContainer({ env, logger, }) {
    const prisma = createPrismaClient();
    const contactService = new ContactService({ prisma });
    const messageLogService = new MessageLogService({ prisma });
    const aiLogService = new AILogService({ prisma });
    const sessionService = new SessionService({ prisma });
    const openaiService = new OpenAIService({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
        logger,
    });
    const classificationService = new ClassificationService({
        openaiService,
        logger,
    });
    const routingService = new RoutingService();
    const whatsappService = new WhatsAppService({
        accessToken: env.WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
        graphVersion: env.WHATSAPP_GRAPH_VERSION,
        logger,
    });
    const webhookService = new WebhookService({
        contactService,
        messageLogService,
        aiLogService,
        sessionService,
        classificationService,
        routingService,
        openaiService,
        whatsappService,
        logger,
    });
    return {
        prisma,
        services: {
            contactService,
            messageLogService,
            aiLogService,
            sessionService,
            openaiService,
            classificationService,
            routingService,
            whatsappService,
            webhookService,
        },
    };
}

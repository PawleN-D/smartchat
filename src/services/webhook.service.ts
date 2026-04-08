import { DISAMBIGUATION_QUESTION } from "../config/prompts.js";
import type { AppLogger } from "../types/app.js";
import type { NormalizedInboundMessage } from "../types/webhook.js";
import type { AILogService } from "./ai-log.service.js";
import type { ClassificationService } from "./classification.service.js";
import type { ContactService } from "./contact.service.js";
import type { MessageLogService } from "./message-log.service.js";
import type { OpenAIService } from "./openai.service.js";
import { RouteAction } from "./routing.service.js";
import type { RoutingService } from "./routing.service.js";
import type { SessionService } from "./session.service.js";
import type { WhatsAppService } from "./whatsapp.service.js";

interface WebhookServiceDeps {
  contactService: ContactService;
  messageLogService: MessageLogService;
  aiLogService: AILogService;
  sessionService: SessionService;
  classificationService: ClassificationService;
  routingService: RoutingService;
  openaiService: OpenAIService;
  whatsappService: WhatsAppService;
  logger: AppLogger;
}

export class WebhookService {
  contactService: ContactService;
  messageLogService: MessageLogService;
  aiLogService: AILogService;
  sessionService: SessionService;
  classificationService: ClassificationService;
  routingService: RoutingService;
  openaiService: OpenAIService;
  whatsappService: WhatsAppService;
  logger: AppLogger;

  constructor({
    contactService,
    messageLogService,
    aiLogService,
    sessionService,
    classificationService,
    routingService,
    openaiService,
    whatsappService,
    logger,
  }: WebhookServiceDeps) {
    this.contactService = contactService;
    this.messageLogService = messageLogService;
    this.aiLogService = aiLogService;
    this.sessionService = sessionService;
    this.classificationService = classificationService;
    this.routingService = routingService;
    this.openaiService = openaiService;
    this.whatsappService = whatsappService;
    this.logger = logger;
  }

  async processInboundMessages(messages: NormalizedInboundMessage[]): Promise<void> {
    for (const message of messages) {
      await this.processSingleInboundMessage(message);
    }
  }

  async processSingleInboundMessage(
    message: NormalizedInboundMessage
  ): Promise<void> {
    const { contact: initialContact } = await this.contactService.getOrCreate({
      waId: message.waId,
      name: message.name,
    });

    const inboundLog = await this.messageLogService.logInbound(
      initialContact.id,
      message
    );

    if (inboundLog.status === "duplicate") {
      this.logger.info(
        {
          waId: message.waId,
          waMessageId: inboundLog.waMessageId,
        },
        "Skipping duplicate inbound message"
      );
      return;
    }

    await this.sessionService.touchInbound(initialContact.id, message.timestamp);

    const inboundCount = await this.messageLogService.countInboundForContact(
      initialContact.id
    );

    let contact = initialContact;
    if (contact.type === "unknown") {
      const classification = await this.classificationService.classify({
        text: message.text,
        isFirstMessage: inboundCount === 1,
      });

      await this.aiLogService.logClassification({
        contactId: contact.id,
        model: classification.model ?? "heuristic",
        input: message.text,
        output: classification.output ?? classification.reason,
        classification: classification.type,
        confidence: classification.confidence,
        metadata: {
          source: classification.source,
          isFirstMessage: inboundCount === 1,
        },
      });

      if (classification.type !== "unknown") {
        contact = await this.contactService.updateType(
          contact.id,
          classification.type
        );
      }
    }

    const routeAction = this.routingService.resolve(contact);

    if (routeAction === RouteAction.SILENCE) {
      this.logger.info(
        { waId: message.waId, type: contact.type },
        "Message silenced by router"
      );
      return;
    }

    if (routeAction === RouteAction.ASK_DISAMBIGUATION) {
      const waResponse = await this.whatsappService.sendTextMessage({
        to: message.waId,
        text: DISAMBIGUATION_QUESTION,
        replyToMessageId: message.messageId,
      });

      await this.messageLogService.logOutbound(
        contact.id,
        DISAMBIGUATION_QUESTION,
        waResponse?.messages?.[0]?.id ?? null,
        { routeAction }
      );

      await this.contactService.markDisambiguationAsked(contact.id);
      await this.sessionService.touchOutbound(contact.id);
      return;
    }

    if (routeAction === RouteAction.RESPOND_AI) {
      const ai = await this.openaiService.generateBusinessReply({
        contactName: contact.name,
        userMessage: message.text,
      });

      const waResponse = await this.whatsappService.sendTextMessage({
        to: message.waId,
        text: ai.text,
        replyToMessageId: message.messageId,
      });

      await this.aiLogService.logReply({
        contactId: contact.id,
        model: ai.model,
        input: message.text,
        output: ai.text,
        metadata: {
          routeAction,
        },
      });

      await this.messageLogService.logOutbound(
        contact.id,
        ai.text,
        waResponse?.messages?.[0]?.id ?? null,
        { routeAction }
      );

      await this.sessionService.touchOutbound(contact.id);
    }
  }
}

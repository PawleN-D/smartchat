import type { PrismaClient } from "@prisma/client";
import type { AILogService } from "../services/ai-log.service.js";
import type { ClassificationService } from "../services/classification.service.js";
import type { ContactService } from "../services/contact.service.js";
import type { MessageLogService } from "../services/message-log.service.js";
import type { OpenAIService } from "../services/openai.service.js";
import type { RoutingService } from "../services/routing.service.js";
import type { SessionService } from "../services/session.service.js";
import type { WebhookService } from "../services/webhook.service.js";
import type { WhatsAppService } from "../services/whatsapp.service.js";

export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  LOG_LEVEL: string;
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_GRAPH_VERSION: string;
  WHATSAPP_APP_SECRET: string;
}

export interface AppServices {
  contactService: ContactService;
  messageLogService: MessageLogService;
  aiLogService: AILogService;
  sessionService: SessionService;
  openaiService: OpenAIService;
  classificationService: ClassificationService;
  routingService: RoutingService;
  whatsappService: WhatsAppService;
  webhookService: WebhookService;
}

export interface AppContainer {
  prisma: PrismaClient;
  services: AppServices;
}

export interface AppLogger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  debug(...args: unknown[]): void;
}

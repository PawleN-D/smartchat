import type { ContactType } from "@prisma/client";
import OpenAI from "openai";
import {
  BUSINESS_ASSISTANT_SYSTEM_PROMPT,
  CLASSIFIER_SYSTEM_PROMPT,
} from "../config/prompts.js";
import type { AppLogger } from "../types/app.js";
import { normalizeIntent } from "../utils/classification-helpers.js";
import { AppError } from "../utils/errors.js";

interface ClassifyContactIntentInput {
  text: string;
  hasKeywords: boolean;
  greetingOnly: boolean;
  isFirstMessage: boolean;
}

interface ClassifyContactIntentOutput {
  type: ContactType;
  confidence: number | null;
  reason: string;
  rawOutput: string;
  model: string;
}

interface GenerateBusinessReplyInput {
  contactName: string | null;
  userMessage: string;
}

interface GenerateBusinessReplyOutput {
  text: string;
  model: string;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  if (!text) return null;

  const directParse = (() => {
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  })();

  if (directParse) return directParse;

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function normalizeConfidence(value: unknown): number | null {
  const asNumber = Number(value);
  if (Number.isNaN(asNumber)) return null;
  return Math.max(0, Math.min(1, asNumber));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export class OpenAIService {
  client: OpenAI;
  model: string;
  logger: AppLogger;

  constructor({
    apiKey,
    model,
    logger,
  }: {
    apiKey: string;
    model: string;
    logger: AppLogger;
  }) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.logger = logger;
  }

  async classifyContactIntent({
    text,
    hasKeywords,
    greetingOnly,
    isFirstMessage,
  }: ClassifyContactIntentInput): Promise<ClassifyContactIntentOutput> {
    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions: CLASSIFIER_SYSTEM_PROMPT,
        input: JSON.stringify(
          {
            text,
            hasKeywords,
            greetingOnly,
            isFirstMessage,
          },
          null,
          2
        ),
        temperature: 0,
        max_output_tokens: 120,
      });

      const outputText = String(response.output_text ?? "").trim();
      const parsed = extractJsonObject(outputText) ?? {};

      return {
        type: normalizeIntent(parsed.type),
        confidence: normalizeConfidence(parsed.confidence),
        reason: String(parsed.reason ?? "model_classification"),
        rawOutput: outputText,
        model: String(response.model ?? this.model),
      };
    } catch (error) {
      this.logger.error({ err: error }, "OpenAI classification call failed");
      throw new AppError("OpenAI classification failed", {
        statusCode: 502,
        code: "OPENAI_CLASSIFICATION_ERROR",
        details: {
          message: getErrorMessage(error),
        },
      });
    }
  }

  async generateBusinessReply({
    contactName,
    userMessage,
  }: GenerateBusinessReplyInput): Promise<GenerateBusinessReplyOutput> {
    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions: BUSINESS_ASSISTANT_SYSTEM_PROMPT,
        input: `Customer name: ${contactName ?? "Unknown"}\nInbound message: ${userMessage}`,
        temperature: 0.4,
        max_output_tokens: 300,
      });

      const text = String(response.output_text ?? "").trim();
      if (!text) {
        return {
          text: "Thanks for reaching out. Could you share a bit more detail so we can assist you?",
          model: String(response.model ?? this.model),
        };
      }

      return {
        text,
        model: String(response.model ?? this.model),
      };
    } catch (error) {
      this.logger.error({ err: error }, "OpenAI reply generation failed");
      throw new AppError("OpenAI reply generation failed", {
        statusCode: 502,
        code: "OPENAI_REPLY_ERROR",
        details: {
          message: getErrorMessage(error),
        },
      });
    }
  }
}

import type { ContactType } from "@prisma/client";
import type { AppLogger } from "../types/app.js";
import {
  hasBusinessKeywords,
  isGreetingOnly,
  normalizeIntent,
} from "../utils/classification-helpers.js";
import type { OpenAIService } from "./openai.service.js";

interface ClassifyInput {
  text: string;
  isFirstMessage: boolean;
}

export interface ClassificationResult {
  type: ContactType;
  confidence: number | null;
  reason: string;
  source: "heuristic" | "openai" | "fallback";
  model: string | null;
  output: string | null;
}

export class ClassificationService {
  openaiService: OpenAIService;
  logger: AppLogger;

  constructor({
    openaiService,
    logger,
  }: {
    openaiService: OpenAIService;
    logger: AppLogger;
  }) {
    this.openaiService = openaiService;
    this.logger = logger;
  }

  async classify({
    text,
    isFirstMessage,
  }: ClassifyInput): Promise<ClassificationResult> {
    const content = String(text ?? "").trim();
    const greetingOnly = isGreetingOnly(content);
    const hasKeywords = hasBusinessKeywords(content);

    if (!content) {
      return {
        type: "unknown",
        confidence: 1,
        reason: "empty_message",
        source: "heuristic",
        model: null,
        output: null,
      };
    }

    if (isFirstMessage && greetingOnly) {
      return {
        type: "unknown",
        confidence: 0.98,
        reason: "greeting_only_first_message",
        source: "heuristic",
        model: null,
        output: null,
      };
    }

    try {
      const ai = await this.openaiService.classifyContactIntent({
        text: content,
        hasKeywords,
        greetingOnly,
        isFirstMessage,
      });

      let type = normalizeIntent(ai.type);

      if (type === "unknown" && hasKeywords) {
        type = "business";
      }

      return {
        type,
        confidence: ai.confidence,
        reason: ai.reason,
        source: "openai",
        model: ai.model,
        output: ai.rawOutput,
      };
    } catch (error) {
      this.logger.warn(
        { err: error, content, isFirstMessage },
        "Classification fallback triggered"
      );

      return {
        type: hasKeywords ? "business" : "unknown",
        confidence: hasKeywords ? 0.6 : 0.4,
        reason: hasKeywords ? "keyword_fallback" : "unknown_fallback",
        source: "fallback",
        model: null,
        output: null,
      };
    }
  }
}

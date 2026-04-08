import { hasBusinessKeywords, isGreetingOnly, normalizeIntent, } from "../utils/classification-helpers.js";
export class ClassificationService {
    openaiService;
    logger;
    constructor({ openaiService, logger, }) {
        this.openaiService = openaiService;
        this.logger = logger;
    }
    async classify({ text, isFirstMessage, }) {
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
        }
        catch (error) {
            this.logger.warn({ err: error, content, isFirstMessage }, "Classification fallback triggered");
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

const REDACTED_FIELDS = new Set([
    "authorization",
    "access_token",
    "token",
    "appsecret_proof",
]);
function buildContactNameMap(value) {
    const map = new Map();
    const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
    for (const contact of contacts) {
        const waId = contact?.wa_id;
        if (!waId)
            continue;
        map.set(waId, contact?.profile?.name ?? null);
    }
    return map;
}
function normalizeMessageText(message) {
    if (!message)
        return "";
    if (message.type === "text") {
        return message.text?.body?.trim() ?? "";
    }
    if (message.type === "interactive") {
        return (message.interactive?.button_reply?.title ??
            message.interactive?.list_reply?.title ??
            "");
    }
    if (message.type === "image" || message.type === "video") {
        return message[message.type]?.caption ?? `[${message.type} message]`;
    }
    return `[${message.type ?? "unknown"} message]`;
}
function toRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}
export function sanitizeRawObject(value) {
    if (value === undefined) {
        return null;
    }
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeRawObject(item));
    }
    if (!value || typeof value !== "object") {
        return value;
    }
    const rawObject = value;
    const sanitized = {};
    for (const [key, nestedValue] of Object.entries(rawObject)) {
        const loweredKey = key.toLowerCase();
        if (REDACTED_FIELDS.has(loweredKey)) {
            sanitized[key] = "[REDACTED]";
            continue;
        }
        sanitized[key] = sanitizeRawObject(nestedValue);
    }
    return sanitized;
}
export function extractInboundMessages(payload) {
    const normalized = [];
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];
    for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
            const value = change?.value;
            if (!value)
                continue;
            const contactNameMap = buildContactNameMap(value);
            const messages = Array.isArray(value?.messages) ? value.messages : [];
            for (const message of messages) {
                const waId = message?.from;
                if (!waId)
                    continue;
                normalized.push({
                    messageId: message?.id ?? null,
                    waId,
                    name: contactNameMap.get(waId) ?? null,
                    timestamp: message?.timestamp ?? null,
                    type: message?.type ?? "unknown",
                    text: normalizeMessageText(message),
                    raw: toRecord(message),
                });
            }
        }
    }
    return normalized;
}

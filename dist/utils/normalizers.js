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
                    raw: message,
                });
            }
        }
    }
    return normalized;
}

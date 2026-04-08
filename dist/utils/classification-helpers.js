export const BUSINESS_KEYWORDS = [
    "quote",
    "booking",
    "book",
    "price",
    "pricing",
    "service",
    "services",
    "product",
    "products",
    "invoice",
    "cost",
    "support",
    "help",
    "consultation",
    "appointment",
    "order",
    "purchase",
];
const GREETING_ONLY_REGEX = /^(hi+|hello+|hey+|howzit|good (morning|afternoon|evening)|yo+|sup+|hiya|molo|sawubona|dumela|sanibonani)[!.?, ]*$/i;
export function normalizeIntent(intent) {
    const value = String(intent || "").toLowerCase().trim();
    if (value === "business" || value === "personal" || value === "unknown") {
        return value;
    }
    return "unknown";
}
export function hasBusinessKeywords(text) {
    const value = String(text || "").toLowerCase();
    return BUSINESS_KEYWORDS.some((keyword) => value.includes(keyword));
}
export function isGreetingOnly(text) {
    const value = String(text || "").trim();
    if (!value)
        return false;
    return GREETING_ONLY_REGEX.test(value);
}

const REQUIRED_ENV_VARS = [
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "WHATSAPP_VERIFY_TOKEN",
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_APP_SECRET",
];
function toInt(value, fallback) {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}
export function loadEnv(rawEnv = process.env) {
    const missing = REQUIRED_ENV_VARS.filter((key) => !rawEnv[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
    return Object.freeze({
        NODE_ENV: rawEnv.NODE_ENV ?? "development",
        PORT: toInt(rawEnv.PORT, 3000),
        LOG_LEVEL: rawEnv.LOG_LEVEL ?? "info",
        DATABASE_URL: rawEnv.DATABASE_URL,
        OPENAI_API_KEY: rawEnv.OPENAI_API_KEY,
        OPENAI_MODEL: rawEnv.OPENAI_MODEL ?? "gpt-4.1-mini",
        WHATSAPP_VERIFY_TOKEN: rawEnv.WHATSAPP_VERIFY_TOKEN,
        WHATSAPP_ACCESS_TOKEN: rawEnv.WHATSAPP_ACCESS_TOKEN,
        WHATSAPP_PHONE_NUMBER_ID: rawEnv.WHATSAPP_PHONE_NUMBER_ID,
        WHATSAPP_GRAPH_VERSION: rawEnv.WHATSAPP_GRAPH_VERSION ?? "v20.0",
        WHATSAPP_APP_SECRET: rawEnv.WHATSAPP_APP_SECRET,
    });
}

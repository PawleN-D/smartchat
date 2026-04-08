export default async function healthRoutes(app) {
    app.get("/health", async () => {
        return {
            ok: true,
            service: "whatsapp-ai-crm",
            timestamp: new Date().toISOString(),
        };
    });
}

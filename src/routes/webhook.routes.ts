import { createWebhookController } from "../controllers/webhook.controller.js";

export default async function webhookRoutes(app: any, options: any) {
  const controller = createWebhookController({
    env: options.env,
    webhookService: options.services.webhookService,
    logger: app.log,
  });

  app.get("/", controller.verifyWebhook);
  app.post("/", controller.receiveWebhook);
}

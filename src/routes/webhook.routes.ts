import { createWebhookController } from "../controllers/webhook.controller.js";
import type { AppServices, EnvConfig } from "../types/app.js";
import type { FastifyPluginAsync } from "fastify";

const EMPTY_OBJECT_SCHEMA = {
  type: "object",
  additionalProperties: false,
} as const;

const VERIFY_WEBHOOK_SCHEMA = {
  params: EMPTY_OBJECT_SCHEMA,
  headers: {
    type: "object",
    additionalProperties: true,
  },
  querystring: {
    type: "object",
    required: ["hub.mode", "hub.verify_token", "hub.challenge"],
    additionalProperties: false,
    properties: {
      "hub.mode": { type: "string", minLength: 1 },
      "hub.verify_token": { type: "string", minLength: 1 },
      "hub.challenge": { type: "string", minLength: 1 },
    },
  },
} as const;

const RECEIVE_WEBHOOK_SCHEMA = {
  params: EMPTY_OBJECT_SCHEMA,
  querystring: EMPTY_OBJECT_SCHEMA,
  headers: {
    type: "object",
    required: ["x-hub-signature-256"],
    additionalProperties: true,
    properties: {
      "x-hub-signature-256": { type: "string", minLength: 10 },
    },
  },
  body: {
    type: "object",
    required: ["entry"],
    additionalProperties: true,
    properties: {
      entry: { type: "array" },
    },
  },
} as const;

interface WebhookRouteOptions {
  env: EnvConfig;
  services: AppServices;
}

const webhookRoutes: FastifyPluginAsync<WebhookRouteOptions> = async (
  app,
  options
) => {
  const controller = createWebhookController({
    env: options.env,
    webhookService: options.services.webhookService,
    logger: app.log,
  });

  app.get("/", { schema: VERIFY_WEBHOOK_SCHEMA }, controller.verifyWebhook);
  app.post("/", { schema: RECEIVE_WEBHOOK_SCHEMA }, controller.receiveWebhook);
};

export default webhookRoutes;

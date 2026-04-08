import Fastify from "fastify";
import healthRoutes from "./routes/health.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import { isAppError } from "./utils/errors.js";

export function buildApp({ env, container, logger }: any) {
  const app = Fastify({
    logger,
    trustProxy: true,
  });

  app.register(healthRoutes);
  app.register(webhookRoutes, {
    prefix: "/webhook",
    env,
    services: container.services,
  });

  app.setErrorHandler((error: any, request, reply) => {
    const isKnown = isAppError(error);
    const statusCode = isKnown
      ? error.statusCode
      : Number.isInteger(error.statusCode)
        ? error.statusCode
        : 500;
    const errorCode = isKnown ? error.code : "INTERNAL_SERVER_ERROR";

    request.log.error(
      {
        err: error,
        code: errorCode,
        details: isKnown ? error.details : undefined,
      },
      "Request failed"
    );

    const message =
      statusCode >= 500 ? "Internal Server Error" : error.message;

    reply.status(statusCode).send({
      error: errorCode,
      message,
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: "NOT_FOUND",
      message: `Route not found: ${request.method} ${request.url}`,
    });
  });

  return app;
}

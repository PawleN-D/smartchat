import Fastify, { type FastifyBaseLogger, type FastifyError } from "fastify";
import healthRoutes from "./routes/health.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import type { AppContainer, EnvConfig } from "./types/app.js";
import { isAppError } from "./utils/errors.js";

interface BuildAppOptions {
  env: EnvConfig;
  container: AppContainer;
  logger: FastifyBaseLogger;
}

export function buildApp({ env, container, logger }: BuildAppOptions) {
  const app = Fastify({
    logger,
    trustProxy: true,
  });

  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (request, body, done) => {
      const rawBody = typeof body === "string" ? body : body.toString("utf8");
      request.rawBody = rawBody;

      if (rawBody.length === 0) {
        done(null, {});
        return;
      }

      try {
        done(null, JSON.parse(rawBody));
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  );

  app.register(healthRoutes);
  app.register(webhookRoutes, {
    prefix: "/webhook",
    env,
    services: container.services,
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const isKnown = isAppError(error);
    const rawStatusCode = (error as { statusCode?: unknown }).statusCode;
    const statusCode = isKnown
      ? error.statusCode
      : Number.isInteger(rawStatusCode)
        ? Number(rawStatusCode)
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

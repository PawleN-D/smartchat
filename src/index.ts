import "dotenv/config";
import pino from "pino";
import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { buildContainer } from "./container.js";

const env = loadEnv(process.env);
const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

const container = buildContainer({ env, logger });
const app = buildApp({ env, container, logger });

async function start() {
  try {
    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });
    app.log.info({ port: env.PORT }, "Server started");
  } catch (error) {
    app.log.error({ err: error }, "Failed to start server");
    await container.prisma.$disconnect();
    process.exit(1);
  }
}

let isShuttingDown = false;
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, "Shutdown initiated");
  try {
    await app.close();
    await container.prisma.$disconnect();
    logger.info("Shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Shutdown failed");
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

start();

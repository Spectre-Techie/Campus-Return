import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { initRealtime } from "./socket/realtime.js";
import { logger } from "./utils/logger.js";

const server = createServer(app);

initRealtime(server);

server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`Frontend URL: ${env.FRONTEND_URL}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");
  process.exit(1);
});

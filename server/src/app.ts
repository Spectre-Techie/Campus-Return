import express from "express";
import { randomUUID } from "node:crypto";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { clerkMiddleware } from "./middleware/clerkAuth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { webhookRouter } from "./routes/webhooks.routes.js";
import { itemRouter } from "./routes/items.routes.js";
import { claimRouter } from "./routes/claims.routes.js";
import { notificationRouter } from "./routes/notifications.routes.js";
import { configRouter } from "./routes/config.routes.js";
import { env } from "./config/env.js";
import { getAllowedOrigins, isAllowedOrigin } from "./config/cors.js";
import { prisma } from "./config/database.js";
import { logger } from "./utils/logger.js";

const app: express.Express = express();

app.disable("x-powered-by");

// --- Global Middleware ---

// Security headers
app.use(helmet());

// CORS -- whitelist frontend only
const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    logger.warn({ origin, allowedOrigins: getAllowedOrigins() }, "CORS blocked request origin");
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Compression
app.use(compression());

// Request trace ID for log correlation
app.use((req, res, next) => {
  const incomingRequestId = req.header("x-request-id");
  const requestId = incomingRequestId && incomingRequestId.trim() ? incomingRequestId : randomUUID();
  res.setHeader("x-request-id", requestId);
  res.locals.requestId = requestId;

  const startedAt = Date.now();
  logger.info({ requestId, method: req.method, path: req.originalUrl }, "Request started");

  res.on("finish", () => {
    logger.info(
      {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      },
      "Request completed"
    );
  });

  next();
});

// Rate limiting
app.use(generalLimiter);

// Webhook routes MUST come before express.json() because
// Clerk webhooks need the raw body for signature verification
app.use("/api/webhooks", webhookRouter);

// JSON body parser (after webhooks)
app.use(express.json({ limit: "1mb", strict: true }));

// Clerk session middleware -- attaches auth to every request
app.use(
  clerkMiddleware({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
  })
);

// --- Health Check ---
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", checks: { database: "ok" }, timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "not_ready", checks: { database: "unavailable" } });
  }
});

// --- API Routes ---
app.use("/api/items", itemRouter);
app.use("/api/claims", claimRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/config", configRouter);

// --- Error Handler (must be last) ---
app.use(errorHandler);

// --- 404 Handler ---
app.use((_req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

export { app };

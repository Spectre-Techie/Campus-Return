import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

function isDatabaseConnectivityError(err: Error): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return err.code === "P2024" || err.code === "P1001";
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const message = typeof err.message === "string" ? err.message : "";
    return (
      message.includes("Timed out fetching a new connection from the connection pool") ||
      message.includes("Can't reach database server") ||
      message.includes("Connection terminated unexpectedly")
    );
  }

  const message = typeof err.message === "string" ? err.message : "";
  return (
    message.includes("Timed out fetching a new connection from the connection pool") ||
    message.includes("Can't reach database server")
  );
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  // Database connectivity failures from Prisma
  if (isDatabaseConnectivityError(err)) {
    logger.error({ err }, "Database connectivity error");
    res.status(503).json({
      status: "error",
      message: "Database temporarily unavailable. Please try again shortly.",
    });
    return;
  }

  // Unknown / unexpected errors
  logger.error({ err }, "Unhandled error");

  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}

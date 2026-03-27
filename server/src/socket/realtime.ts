import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let io: Server | null = null;

export function initRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const userIdFromHandshake = socket.handshake.query.userId;
    const userId = typeof userIdFromHandshake === "string" ? userIdFromHandshake : null;

    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("claim:join", (claimId: string) => {
      if (typeof claimId === "string" && claimId.length > 0) {
        socket.join(`claim:${claimId}`);
      }
    });

    socket.on("claim:leave", (claimId: string) => {
      if (typeof claimId === "string" && claimId.length > 0) {
        socket.leave(`claim:${claimId}`);
      }
    });

    socket.on("disconnect", () => {
      logger.debug({ socketId: socket.id, userId }, "Realtime client disconnected");
    });
  });

  logger.info("Realtime socket server initialized");
}

export function emitToUser(userId: string, event: string, payload?: Record<string, unknown>) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload ?? {});
}

export function emitToClaim(claimId: string, event: string, payload?: Record<string, unknown>) {
  if (!io) return;
  io.to(`claim:${claimId}`).emit(event, payload ?? {});
}

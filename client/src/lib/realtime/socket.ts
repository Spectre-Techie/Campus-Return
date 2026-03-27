"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let socketUserId: string | null = null;

export function getRealtimeSocket(userId: string): Socket {
  if (socket && socketUserId === userId) return socket;

  if (socket && socketUserId !== userId) {
    socket.disconnect();
    socket = null;
    socketUserId = null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  socket = io(baseUrl, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    query: { userId },
  });
  socketUserId = userId;

  return socket;
}

export function closeRealtimeSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  socketUserId = null;
}

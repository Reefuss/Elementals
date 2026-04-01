import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./events";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(playerId?: string): AppSocket {
  // Always return the existing socket instance — never create a second one.
  // A second socket would have different socket.id, so server events emitted
  // to the first socket.id would never be received.
  if (socket) return socket;

  // Derive URL: use env var if set, otherwise connect to the same origin
  // (works for both local dev and Railway/Render production).
  const url =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  socket = io(url, {
    transports:           ["websocket", "polling"],
    autoConnect:          true,
    reconnection:         true,
    reconnectionDelay:    1000,
    reconnectionAttempts: 20,
    query: playerId ? { playerId } : {},
  }) as AppSocket;

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

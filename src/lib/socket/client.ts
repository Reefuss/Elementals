import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./events";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(playerId?: string): AppSocket {
  if (socket?.connected) return socket;

  const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";

  socket = io(url, {
    transports:         ["websocket", "polling"],
    autoConnect:        true,
    reconnection:       true,
    reconnectionDelay:  1000,
    reconnectionAttempts: 10,
    query: playerId ? { playerId } : {},
  }) as AppSocket;

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

"use client";

import { getSocket, AppSocket } from "@/lib/socket/client";

/** Returns the singleton socket. Safe to call anywhere — always the same instance. */
export function useSocket(): AppSocket {
  const storedId =
    typeof window !== "undefined"
      ? localStorage.getItem("elementals_player_id") ?? undefined
      : undefined;
  return getSocket(storedId);
}

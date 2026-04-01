import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../src/lib/socket/events";
import { Matchmaker } from "./matchmaker";
import { GameManager } from "./gameManager";
import { Element, MatchResult } from "../src/lib/game/types";
import { RECONNECT_GRACE_MS } from "../src/lib/game/constants";

type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/** Bootstraps all socket event handlers. */
export function registerSocketHandlers(io: AppServer): void {
  const matchmaker   = new Matchmaker();
  const gameManager  = new GameManager();

  // ── GameManager callbacks ────────────────────────────────────

  gameManager.onStateSync = (roomId: string) => {
    const game = gameManager.getGame(roomId);
    if (!game) return;

    for (const player of game.players) {
      const socket = io.sockets.sockets.get(player.socketId);
      const state  = gameManager.getClientState(roomId, player.id);
      if (socket && state) {
        socket.emit("game:state", state);
      }
    }
  };

  gameManager.onGameOver = (roomId: string, _result: MatchResult) => {
    // State is already synced with phase=GAME_OVER; the client reads matchResult from there.
    // Schedule cleanup after players have had time to see the result screen.
    setTimeout(() => gameManager.destroyGame(roomId), 120_000);
  };

  gameManager.onAutoPlay = (roomId: string, playerId: string, cardId: string) => {
    gameManager.processPlay(roomId, playerId, cardId);
  };

  // ── Connection ───────────────────────────────────────────────

  io.on("connection", (socket: AppSocket) => {
    // Assign a stable playerId — sent as query param on reconnect
    const queryId = socket.handshake.query.playerId as string | undefined;
    socket.data.playerId = queryId || uuidv4();
    socket.data.roomId   = null;

    // ── Reconnect to in-progress game ──
    if (queryId) {
      const roomId = gameManager.getPlayerRoom(queryId);
      if (roomId) {
        socket.data.roomId = roomId;
        socket.join(roomId);
        const reconnected = gameManager.handleReconnect(roomId, queryId, socket.id);
        if (reconnected) {
          const state = gameManager.getClientState(roomId, queryId);
          if (state) socket.emit("game:state", state);

          // Notify opponent
          const game = gameManager.getGame(roomId);
          const opp  = game?.players.find((p) => p.id !== queryId);
          if (opp) {
            const oppSocket = io.sockets.sockets.get(opp.socketId);
            oppSocket?.emit("game:opponent_reconnected", {
              username: socket.data.username ?? "Opponent",
            });
          }
        }
      }
    }

    // ── queue:join ──────────────────────────────────────────────
    socket.on("queue:join", ({ username }, ack) => {
      if (!username?.trim()) {
        ack("Username required.");
        return;
      }
      socket.data.username = username.trim();

      const position = matchmaker.enqueue({
        playerId: socket.data.playerId,
        username:  socket.data.username,
        socketId:  socket.id,
        joinedAt:  Date.now(),
      });

      ack(null);
      socket.emit("queue:status", { position });

      // Try to form a match
      const match = matchmaker.tryMatch();
      if (match) {
        const { roomId, player1, player2 } = match;

        const s1 = io.sockets.sockets.get(player1.socketId);
        const s2 = io.sockets.sockets.get(player2.socketId);
        if (!s1 || !s2) {
          // One player disconnected; re-enqueue the surviving one
          if (s1) matchmaker.enqueue(player1);
          if (s2) matchmaker.enqueue(player2);
          return;
        }

        s1.data.roomId = roomId;
        s2.data.roomId = roomId;
        s1.join(roomId);
        s2.join(roomId);

        s1.emit("match:found", {
          roomId,
          opponent: { id: player2.playerId, username: player2.username },
        });
        s2.emit("match:found", {
          roomId,
          opponent: { id: player1.playerId, username: player1.username },
        });

        gameManager.createGame(
          { id: player1.playerId, username: player1.username, socketId: player1.socketId },
          { id: player2.playerId, username: player2.username, socketId: player2.socketId },
          roomId
        );
      }
    });

    // ── queue:leave ─────────────────────────────────────────────
    socket.on("queue:leave", () => {
      matchmaker.dequeue(socket.data.playerId);
    });

    // ── game:play ───────────────────────────────────────────────
    socket.on("game:play", ({ cardId }, ack) => {
      const roomId = socket.data.roomId;
      if (!roomId) { ack("Not in a game."); return; }

      const result = gameManager.processPlay(roomId, socket.data.playerId, cardId);
      if (result.error) { ack(result.error); return; }

      ack(null);

      // Notify opponent that a card has been played (not which one)
      socket.to(roomId).emit("game:opponent_played");
    });

    // ── game:rainbow_choice ─────────────────────────────────────
    socket.on("game:rainbow_choice", ({ element }, ack) => {
      const roomId = socket.data.roomId;
      if (!roomId) { ack("Not in a game."); return; }

      const result = gameManager.processRainbowChoice(
        roomId,
        socket.data.playerId,
        element as Element
      );
      if (result.error) { ack(result.error); return; }

      ack(null);
      // Notify opponent they're waiting
      socket.to(roomId).emit("game:rainbow_waiting");
    });

    // ── disconnect ──────────────────────────────────────────────
    socket.on("disconnect", () => {
      // Remove from queue if waiting
      matchmaker.dequeue(socket.data.playerId);

      const roomId = socket.data.roomId;
      if (!roomId) return;

      gameManager.handleDisconnect(roomId, socket.data.playerId);

      const game = gameManager.getGame(roomId);
      const opp  = game?.players.find((p) => p.id !== socket.data.playerId);
      if (opp) {
        const oppSocket = io.sockets.sockets.get(opp.socketId);
        oppSocket?.emit("game:opponent_disconnected", {
          username:         socket.data.username ?? "Opponent",
          reconnectGraceMs: RECONNECT_GRACE_MS,
        });
      }
    });
  });
}

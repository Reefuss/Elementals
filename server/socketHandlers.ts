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

export function registerSocketHandlers(io: AppServer): void {
  const matchmaker  = new Matchmaker();
  const gameManager = new GameManager();

  // ── GameManager callbacks ─────────────────────────────────────

  gameManager.onStateSync = (roomId: string) => {
    const game = gameManager.getGame(roomId);
    if (!game) return;
    for (const player of game.players) {
      const state = gameManager.getClientState(roomId, player.id);
      if (state) {
        io.to(player.socketId).emit("game:state", state);
      }
    }
  };

  gameManager.onGameOver = (_roomId: string, _result: MatchResult) => {
    setTimeout(() => gameManager.destroyGame(_roomId), 120_000);
  };

  gameManager.onAutoPlay = (roomId: string, playerId: string, cardId: string) => {
    gameManager.processPlay(roomId, playerId, cardId);
  };

  // ── Helper: update roomId on a socket's data ──────────────────

  function setSocketRoom(socketId: string, roomId: string) {
    const s = io.sockets.sockets.get(socketId);
    if (s) s.data.roomId = roomId;
  }

  // ── Connection ───────────────────────────────────────────────

  io.on("connection", (socket: AppSocket) => {
    const queryId = socket.handshake.query.playerId as string | undefined;
    const isReturning = !!queryId && queryId !== "undefined";
    socket.data.playerId = isReturning ? queryId : uuidv4();
    socket.data.roomId   = null;

    console.log(`[connect] id=${socket.id} player=${socket.data.playerId} returning=${isReturning}`);

    // ── Reconnect to in-progress game ────────────────────────────
    if (isReturning) {
      const roomId = gameManager.getPlayerRoom(queryId);
      if (roomId) {
        socket.data.roomId = roomId;
        socket.join(roomId);
        const ok = gameManager.handleReconnect(roomId, queryId, socket.id);
        if (ok) {
          const state = gameManager.getClientState(roomId, queryId);
          if (state) socket.emit("game:state", state);

          const game = gameManager.getGame(roomId);
          const opp  = game?.players.find((p) => p.id !== queryId);
          if (opp) {
            io.to(opp.socketId).emit("game:opponent_reconnected", {
              username: socket.data.username ?? "Opponent",
            });
          }
        }
      }
    }

    // ── queue:join ────────────────────────────────────────────────
    socket.on("queue:join", ({ username }, ack) => {
      if (!username?.trim()) { ack("Username required."); return; }

      socket.data.username = username.trim();

      const position = matchmaker.enqueue({
        playerId: socket.data.playerId,
        username:  socket.data.username,
        socketId:  socket.id,
        joinedAt:  Date.now(),
      });

      ack(null);
      socket.emit("queue:status", { position });
      console.log(`[queue] ${socket.data.username} pos=${position} qsize=${matchmaker.size()}`);

      // Try to form a match
      const match = matchmaker.tryMatch();
      if (!match) return;

      const { roomId, player1, player2 } = match;
      console.log(`[match] ${player1.username} vs ${player2.username} room=${roomId}`);

      // Join both sockets to the room
      io.in(player1.socketId).socketsJoin(roomId);
      io.in(player2.socketId).socketsJoin(roomId);

      // Update roomId on both socket.data objects
      setSocketRoom(player1.socketId, roomId);
      setSocketRoom(player2.socketId, roomId);

      // Notify both players
      io.to(player1.socketId).emit("match:found", {
        roomId,
        opponent: { id: player2.playerId, username: player2.username },
      });
      io.to(player2.socketId).emit("match:found", {
        roomId,
        opponent: { id: player1.playerId, username: player1.username },
      });

      // Create authoritative game — this triggers onStateSync which pushes game:state
      gameManager.createGame(
        { id: player1.playerId, username: player1.username, socketId: player1.socketId },
        { id: player2.playerId, username: player2.username, socketId: player2.socketId },
        roomId
      );
    });

    // ── queue:leave ───────────────────────────────────────────────
    socket.on("queue:leave", () => {
      matchmaker.dequeue(socket.data.playerId);
    });

    // ── game:request_state ────────────────────────────────────────
    // Called by the game page on mount to recover state after page navigation.
    socket.on("game:request_state", () => {
      const roomId = socket.data.roomId ?? gameManager.getPlayerRoom(socket.data.playerId);
      if (!roomId) return;
      socket.data.roomId = roomId;
      const state = gameManager.getClientState(roomId, socket.data.playerId);
      if (state) socket.emit("game:state", state);
    });

    // ── game:play ─────────────────────────────────────────────────
    socket.on("game:play", ({ cardId }, ack) => {
      const roomId = socket.data.roomId ?? gameManager.getPlayerRoom(socket.data.playerId);
      if (!roomId) { ack("Not in a game."); return; }
      socket.data.roomId = roomId;

      const result = gameManager.processPlay(roomId, socket.data.playerId, cardId);
      if (result.error) { ack(result.error); return; }

      ack(null);
      const game = gameManager.getGame(roomId);
      const opp  = game?.players.find((p) => p.id !== socket.data.playerId);
      if (opp) io.to(opp.socketId).emit("game:opponent_played");
    });

    // ── game:rainbow_choice ───────────────────────────────────────
    socket.on("game:rainbow_choice", ({ element }, ack) => {
      const roomId = socket.data.roomId ?? gameManager.getPlayerRoom(socket.data.playerId);
      if (!roomId) { ack("Not in a game."); return; }

      const result = gameManager.processRainbowChoice(roomId, socket.data.playerId, element as Element);
      if (result.error) { ack(result.error); return; }

      ack(null);
      const game = gameManager.getGame(roomId);
      const opp  = game?.players.find((p) => p.id !== socket.data.playerId);
      if (opp) io.to(opp.socketId).emit("game:rainbow_waiting");
    });

    // ── game:forfeit ──────────────────────────────────────────────
    socket.on("game:forfeit", (ack) => {
      const roomId = socket.data.roomId ?? gameManager.getPlayerRoom(socket.data.playerId);
      if (!roomId) { ack("Not in a game."); return; }
      const ok = gameManager.forfeitGame(roomId, socket.data.playerId);
      if (!ok) { ack("Cannot forfeit at this time."); return; }
      ack(null);
      const game = gameManager.getGame(roomId);
      const opp  = game?.players.find((p) => p.id !== socket.data.playerId);
      if (opp) {
        io.to(opp.socketId).emit("game:opponent_forfeited", {
          username: socket.data.username ?? "Opponent",
        });
      }
    });

    // ── disconnect ────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[disconnect] id=${socket.id} player=${socket.data.playerId} reason=${reason}`);
      matchmaker.dequeue(socket.data.playerId);

      const roomId = socket.data.roomId ?? gameManager.getPlayerRoom(socket.data.playerId);
      if (!roomId) return;

      gameManager.handleDisconnect(roomId, socket.data.playerId);
      const game = gameManager.getGame(roomId);
      const opp  = game?.players.find((p) => p.id !== socket.data.playerId);
      if (opp) {
        io.to(opp.socketId).emit("game:opponent_disconnected", {
          username:         socket.data.username ?? "Opponent",
          reconnectGraceMs: RECONNECT_GRACE_MS,
        });
      }
    });
  });
}

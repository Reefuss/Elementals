/**
 * Custom server entry point.
 * Runs Next.js + Socket.IO on a single port.
 *
 * Dev:  `npm run dev`  →  tsx watch server/index.ts
 * Prod: `npm run build && npm start`
 */

import { createServer } from "http";
import { parse }        from "url";
import next             from "next";
import express          from "express";
import { Server }       from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../src/lib/socket/events";
import { registerSocketHandlers } from "./socketHandlers";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const dev  = process.env.NODE_ENV !== "production";

async function main() {
  // ── Next.js app ──
  const nextApp     = next({ dev, hostname: "localhost", port: PORT });
  const nextHandler = nextApp.getRequestHandler();
  await nextApp.prepare();

  // ── Express + HTTP ──
  const app        = express();
  const httpServer = createServer(app);

  // ── Socket.IO ──
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    // credentials:true + origin:"*" is invalid — omit credentials in production
    cors: dev
      ? { origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true }
      : { origin: "*" },
    transports: ["websocket", "polling"],
  });

  registerSocketHandlers(io);

  // ── Pass all HTTP requests to Next.js ──
  app.all("*", (req, res) => {
    const parsedUrl = parse(req.url!, true);
    nextHandler(req, res, parsedUrl);
  });

  httpServer.listen(PORT, () => {
    console.log(
      `\n🌟 Elementals server running at http://localhost:${PORT}\n` +
      `   Socket.IO ready on the same port.\n` +
      `   Mode: ${dev ? "development" : "production"}\n`
    );
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { GAME_CONFIG } from './config.js';
import { globalRoomManager } from './rooms/roomManager.js';
import { ClientToServerEvents, ServerToClientEvents } from './socket/events.js';
import { setupSocketHandlers } from './socket/handler.js';

dotenv.config();

const app = createApp();
const server = http.createServer(app);

const allowedOrigins = GAME_CONFIG.CORS_ORIGIN.split(',').map((o) => o.trim());

export interface SocketData {
  roomCode?: string;
  playerId?: string;
  playerToken?: string;
}

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by Socket.IO CORS`));
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 25000,
});

setupSocketHandlers(io);

// Periodically clean stale abandoned rooms every 5 minutes
setInterval(() => {
  globalRoomManager.cleanStaleRooms();
}, 5 * 60 * 1000);

const PORT = GAME_CONFIG.PORT;
server.listen(PORT, () => {
  console.log(`[SeaBattle Server] Persistent game server listening on port ${PORT}`);
  console.log(`[SeaBattle Server] CORS allowed origins: ${GAME_CONFIG.CORS_ORIGIN}`);
});

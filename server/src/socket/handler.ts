import { Server, Socket } from 'socket.io';
import { GAME_CONFIG } from '../config.js';
import { SocketData } from '../index.js';
import { globalRoomManager } from '../rooms/roomManager.js';
import {
  attackSchema,
  createRoomSchema,
  joinRoomSchema,
  powerUpSchema,
  shipPlacementSchema,
} from '../validation/schemas.js';
import { ClientToServerEvents, ServerToClientEvents } from './events.js';

type CustomSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>): void {
  // Broadcast filtered game state snapshot to both players safely
  function broadcastRoomState(roomCode: string) {
    const room = globalRoomManager.getRoom(roomCode);
    if (!room) return;

    for (const player of room.engine.players.values()) {
      if (player.socketId && player.isConnected) {
        const filtered = room.engine.getFilteredGameState(player.playerId);
        if (filtered) {
          io.to(player.socketId).emit('room-state', filtered);
        }
      }
    }
  }

  io.on('connection', (socket: CustomSocket) => {
    // 1. CREATE ROOM
    socket.on('create-room', (data, callback) => {
      try {
        const parsed = createRoomSchema.parse(data);
        const { room, playerToken, playerId } = globalRoomManager.createRoom(
          parsed.displayName,
          socket.id,
          parsed.mode,
          parsed.boardSize
        );

        socket.data.roomCode = room.roomCode;
        socket.data.playerId = playerId;
        socket.data.playerToken = playerToken;

        socket.join(`room:${room.roomCode}`);

        callback({
          success: true,
          roomCode: room.roomCode,
          playerToken,
          playerId,
        });

        const state = room.engine.getFilteredGameState(playerId);
        if (state) {
          socket.emit('room-state', state);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid room configuration';
        callback({ success: false, error: message });
      }
    });

    // 2. JOIN ROOM
    socket.on('join-room', (data, callback) => {
      try {
        const parsed = joinRoomSchema.parse(data);
        const joinResult = globalRoomManager.joinRoom(
          parsed.roomCode,
          parsed.displayName,
          socket.id,
          parsed.playerToken
        );

        if (!joinResult.success || !joinResult.room || !joinResult.playerId || !joinResult.playerToken) {
          callback({ success: false, error: joinResult.error || 'Failed to join room' });
          return;
        }

        const room = joinResult.room;
        socket.data.roomCode = room.roomCode;
        socket.data.playerId = joinResult.playerId;
        socket.data.playerToken = joinResult.playerToken;

        socket.join(`room:${room.roomCode}`);

        callback({
          success: true,
          roomCode: room.roomCode,
          playerToken: joinResult.playerToken,
          playerId: joinResult.playerId,
        });

        // Notify opponent
        const opponent = room.engine.getOpponent(joinResult.playerId);
        if (opponent && opponent.socketId) {
          if (joinResult.isReconnect) {
            io.to(opponent.socketId).emit('opponent-reconnected');
          } else {
            io.to(opponent.socketId).emit('opponent-joined', { displayName: parsed.displayName });
          }
        }

        broadcastRoomState(room.roomCode);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to join room';
        callback({ success: false, error: message });
      }
    });

    // 3. PLACE SHIPS
    socket.on('place-ships', (data, callback) => {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) {
        callback({ success: false, error: 'Unauthorized: not in a room' });
        return;
      }

      const room = globalRoomManager.getRoom(roomCode);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      try {
        const parsed = shipPlacementSchema.parse(data);
        const result = room.engine.setFleet(playerId, parsed.ships);
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }

        room.touch();
        callback({ success: true });
        broadcastRoomState(roomCode);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid ship placement data';
        callback({ success: false, error: message });
      }
    });

    // 4. RANDOMIZE FLEET
    socket.on('randomize-fleet', (callback) => {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) {
        callback({ success: false, error: 'Unauthorized: not in a room' });
        return;
      }

      const room = globalRoomManager.getRoom(roomCode);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const result = room.engine.setRandomFleet(playerId);
      if (!result.success || !result.ships) {
        callback({ success: false, error: result.error });
        return;
      }

      room.touch();
      callback({ success: true, ships: result.ships });
      broadcastRoomState(roomCode);
    });

    // 5. PLAYER READY
    socket.on('player-ready', (callback) => {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) {
        callback({ success: false, error: 'Unauthorized: not in a room' });
        return;
      }

      const room = globalRoomManager.getRoom(roomCode);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const result = room.engine.setPlayerReady(playerId);
      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      room.touch();
      callback({ success: true });

      if (result.matchStarted) {
        io.to(`room:${roomCode}`).emit('match-started', {
          firstTurnPlayerId: room.engine.currentTurnPlayerId,
        });
      }

      broadcastRoomState(roomCode);
    });

    // 6. STANDARD ATTACK
    socket.on('standard-attack', (data, callback) => {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) {
        callback({ success: false, error: 'Unauthorized: not in a room' });
        return;
      }

      const room = globalRoomManager.getRoom(roomCode);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      try {
        const parsed = attackSchema.parse(data);
        const result = room.engine.attack(playerId, { x: parsed.x, y: parsed.y });
        if (!result.success || !result.resolution) {
          callback({ success: false, error: result.error });
          return;
        }

        room.touch();
        callback({ success: true, resolution: result.resolution });
        io.to(`room:${roomCode}`).emit('action-resolved', result.resolution);
        broadcastRoomState(roomCode);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid attack coordinate';
        callback({ success: false, error: message });
      }
    });

    // 7. EXECUTE POWER-UP
    socket.on('execute-power-up', (data, callback) => {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) {
        callback({ success: false, error: 'Unauthorized: not in a room' });
        return;
      }

      const room = globalRoomManager.getRoom(roomCode);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      try {
        const parsed = powerUpSchema.parse(data);
        const result = room.engine.powerUp(playerId, parsed.powerUp, parsed.target);
        if (!result.success || !result.resolution) {
          callback({ success: false, error: result.error });
          return;
        }

        room.touch();
        callback({ success: true, resolution: result.resolution });
        io.to(`room:${roomCode}`).emit('action-resolved', result.resolution);
        broadcastRoomState(roomCode);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid power-up request';
        callback({ success: false, error: message });
      }
    });

    // 8. REQUEST REMATCH
    socket.on('request-rematch', (callback) => {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) {
        callback({ success: false, error: 'Unauthorized: not in a room' });
        return;
      }

      const room = globalRoomManager.getRoom(roomCode);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      room.rematchVotes.add(playerId);
      callback({ success: true });

      io.to(`room:${roomCode}`).emit('rematch-requested', { byPlayerId: playerId });

      // If both players have voted for rematch, restart match!
      if (room.rematchVotes.size >= 2) {
        room.rematchVotes.clear();
        room.engine.resetForRematch();
        io.to(`room:${roomCode}`).emit('rematch-started');
        broadcastRoomState(roomCode);
      }
    });

    // 9. LEAVE ROOM
    socket.on('leave-room', (callback) => {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (roomCode && playerId) {
        socket.leave(`room:${roomCode}`);
        const room = globalRoomManager.getRoom(roomCode);
        if (room) {
          room.engine.players.delete(playerId);
          io.to(`room:${roomCode}`).emit('player-left');
          if (room.engine.players.size === 0) {
            globalRoomManager.removeRoom(roomCode);
          } else {
            broadcastRoomState(roomCode);
          }
        }
      }
      socket.data.roomCode = undefined;
      socket.data.playerId = undefined;
      socket.data.playerToken = undefined;
      callback({ success: true });
    });

    // 10. DISCONNECT
    socket.on('disconnect', () => {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) return;

      const room = globalRoomManager.getRoom(roomCode);
      if (!room) return;

      const player = room.engine.getPlayer(playerId);
      if (!player) return;

      player.isConnected = false;
      const opponent = room.engine.getOpponent(playerId);
      if (opponent && opponent.socketId) {
        io.to(opponent.socketId).emit('opponent-disconnected', {
          gracePeriodSeconds: GAME_CONFIG.RECONNECT_GRACE_PERIOD_MS / 1000,
        });
      }

      // Schedule reconnect timeout
      player.reconnectTimeout = setTimeout(() => {
        // Grace period expired
        if (!player.isConnected && room.engine.phase === 'IN_PROGRESS') {
          // Forfeit match to opponent
          room.engine.phase = 'FINISHED';
          if (opponent) {
            room.engine.winnerPlayerId = opponent.playerId;
            opponent.combatState.coins += GAME_CONFIG.REWARDS.VICTORY;
            broadcastRoomState(roomCode);
          }
        }
      }, GAME_CONFIG.RECONNECT_GRACE_PERIOD_MS);

      broadcastRoomState(roomCode);
    });
  });
}

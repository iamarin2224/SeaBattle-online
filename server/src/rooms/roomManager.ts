import { GAME_CONFIG } from '../config.js';
import { PlayerSession } from '../game/state.js';
import { generatePlayerToken, generateRoomCode, hashToken, Room } from './room.js';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  public createRoom(
    displayName: string,
    socketId: string,
    mode: 'classic' | 'advanced' = 'advanced',
    boardSize: number = GAME_CONFIG.DEFAULT_BOARD_SIZE
  ): { room: Room; playerToken: string; playerId: string } {
    let roomCode = generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const playerToken = generatePlayerToken();
    const tokenHash = hashToken(playerToken);

    const hostPlayer = new PlayerSession(playerId, tokenHash, displayName, socketId);
    const room = new Room(roomCode, hostPlayer, boardSize, mode);
    this.rooms.set(roomCode, room);

    return { room, playerToken, playerId };
  }

  public getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public joinRoom(
    roomCode: string,
    displayName: string,
    socketId: string,
    existingPlayerToken?: string
  ): {
    success: boolean;
    error?: string;
    room?: Room;
    playerToken?: string;
    playerId?: string;
    isReconnect?: boolean;
  } {
    const room = this.getRoom(roomCode);
    if (!room) {
      return { success: false, error: 'Room does not exist' };
    }

    room.touch();

    // Check reconnection with existing token
    if (existingPlayerToken) {
      const existingPlayer = room.getPlayerByToken(existingPlayerToken);
      if (existingPlayer) {
        // Reconnecting to existing seat!
        if (existingPlayer.reconnectTimeout) {
          clearTimeout(existingPlayer.reconnectTimeout);
          existingPlayer.reconnectTimeout = null;
        }
        existingPlayer.socketId = socketId;
        existingPlayer.isConnected = true;
        if (displayName) {
          existingPlayer.displayName = displayName;
        }

        return {
          success: true,
          room,
          playerToken: existingPlayerToken,
          playerId: existingPlayer.playerId,
          isReconnect: true,
        };
      }
    }

    // New player trying to join
    if (room.isFull()) {
      return { success: false, error: 'Room is already full with two players' };
    }

    const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const playerToken = generatePlayerToken();
    const tokenHash = hashToken(playerToken);

    const newPlayer = new PlayerSession(playerId, tokenHash, displayName, socketId);
    const added = room.engine.addPlayer(newPlayer);
    if (!added) {
      return { success: false, error: 'Could not join room' };
    }

    return {
      success: true,
      room,
      playerToken,
      playerId,
      isReconnect: false,
    };
  }

  public removeRoom(roomCode: string): void {
    this.rooms.delete(roomCode.toUpperCase());
  }

  public cleanStaleRooms(maxInactivityMs: number = 30 * 60 * 1000): void {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (now - room.lastActivityAt > maxInactivityMs) {
        this.rooms.delete(code);
      }
    }
  }
}

export const globalRoomManager = new RoomManager();


import crypto from 'crypto';
import { GAME_CONFIG } from '../config.js';
import { GameEngine, PlayerSession } from '../game/state.js';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRoomCode(): string {
  // 6 chars alphanumeric excluding ambiguous characters (0, O, 1, I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generatePlayerToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export class Room {
  public readonly roomCode: string;
  public readonly engine: GameEngine;
  public readonly createdAt: number = Date.now();
  public lastActivityAt: number = Date.now();
  public rematchVotes: Set<string> = new Set();

  constructor(roomCode: string, hostPlayer: PlayerSession, boardSize = GAME_CONFIG.DEFAULT_BOARD_SIZE, mode: 'classic' | 'advanced' = 'advanced') {
    this.roomCode = roomCode;
    this.engine = new GameEngine(roomCode, hostPlayer, boardSize, mode);
  }

  public touch(): void {
    this.lastActivityAt = Date.now();
  }

  public getPlayerByToken(token: string): PlayerSession | undefined {
    const hashed = hashToken(token);
    for (const player of this.engine.players.values()) {
      if (player.tokenHash === hashed) {
        return player;
      }
    }
    return undefined;
  }

  public getPlayerBySocketId(socketId: string): PlayerSession | undefined {
    for (const player of this.engine.players.values()) {
      if (player.socketId === socketId) {
        return player;
      }
    }
    return undefined;
  }

  public isFull(): boolean {
    return this.engine.players.size >= 2;
  }
}


import {
  AttackResolution,
  FilteredGameState,
  PlacedShip,
  PowerUpType,
  ShipOrientation,
  ShipType,
} from '../types/index.js';

export interface ClientToServerEvents {
  'create-room': (
    data: { displayName: string; mode?: 'classic' | 'advanced'; boardSize?: number },
    callback: (res: { success: boolean; roomCode?: string; playerToken?: string; playerId?: string; error?: string }) => void
  ) => void;

  'join-room': (
    data: { roomCode: string; displayName: string; playerToken?: string },
    callback: (res: { success: boolean; roomCode?: string; playerToken?: string; playerId?: string; error?: string }) => void
  ) => void;

  'place-ships': (
    data: { ships: Array<{ type: ShipType; x: number; y: number; orientation: ShipOrientation }> },
    callback: (res: { success: boolean; error?: string }) => void
  ) => void;

  'randomize-fleet': (
    callback: (res: { success: boolean; ships?: PlacedShip[]; error?: string }) => void
  ) => void;

  'player-ready': (
    callback: (res: { success: boolean; error?: string }) => void
  ) => void;

  'standard-attack': (
    data: { x: number; y: number },
    callback: (res: { success: boolean; error?: string; resolution?: AttackResolution }) => void
  ) => void;

  'execute-power-up': (
    data: {
      powerUp: PowerUpType;
      target: { coord?: { x: number; y: number }; row?: number };
    },
    callback: (res: { success: boolean; error?: string; resolution?: AttackResolution }) => void
  ) => void;

  'request-rematch': (
    callback: (res: { success: boolean; error?: string }) => void
  ) => void;

  'leave-room': (
    callback: (res: { success: boolean }) => void
  ) => void;
}

export interface ServerToClientEvents {
  'room-state': (state: FilteredGameState) => void;
  'opponent-joined': (data: { displayName: string }) => void;
  'opponent-disconnected': (data: { gracePeriodSeconds: number }) => void;
  'opponent-reconnected': () => void;
  'match-started': (data: { firstTurnPlayerId: string }) => void;
  'action-resolved': (resolution: AttackResolution) => void;
  'rematch-requested': (data: { byPlayerId: string }) => void;
  'rematch-started': () => void;
  'player-left': () => void;
  'error-message': (data: { message: string }) => void;
}


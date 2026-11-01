export type Coordinate = {
  x: number; // 0-indexed column (0..14)
  y: number; // 0-indexed row (0..14)
};

export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export type ShipOrientation = 'H' | 'V';

export interface ShipConfig {
  type: ShipType;
  name: string;
  length: number;
}

export interface PlacedShip {
  id: string;
  type: ShipType;
  name: string;
  length: number;
  x: number; // origin x (leftmost if H, top if V)
  y: number; // origin y
  orientation: ShipOrientation;
  coordinates: Coordinate[];
  hits: Coordinate[]; // Coordinates that have been damaged
  isSunk: boolean;
}

export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export type PowerUpType = 'row_airstrike' | 'carpet_bomb' | 'radar_scan' | 'air_defence' | 'precision_strike';

export interface PowerUpConfig {
  id: PowerUpType;
  name: string;
  description: string;
  cost: number;
  maxUsesPerMatch?: number;
}

export type GamePhase =
  | 'WAITING_FOR_PLAYERS'
  | 'PLACING_SHIPS'
  | 'READY_CHECK'
  | 'IN_PROGRESS'
  | 'FINISHED';

export interface PlayerStats {
  shotsFired: number;
  hits: number;
  misses: number;
  shipsDestroyed: number;
  coinsEarned: number;
  coinsSpent: number;
  abilitiesUsed: number;
}

export interface RadarScanResult {
  center: Coordinate;
  radius: number; // usually 1 for 3x3
  shipCellsFound: number; // count of ship cells in the scan area
  timestamp: number;
}

export interface AttackResultCell {
  x: number;
  y: number;
  status: 'hit' | 'miss' | 'blocked';
  shipType?: ShipType;
  sunkShip?: PlacedShip; // revealed only if sunk
}

export interface AttackResolution {
  type: 'standard' | PowerUpType;
  attackerId: string;
  cells: AttackResultCell[];
  sunkShips: PlacedShip[]; // Any ships that were newly sunk in this action
  radarIntel?: RadarScanResult;
  coinsDeducted: number;
  coinsAwarded: number;
  isGameOver: boolean;
  winnerId?: string;
  blockedByAirDefence?: boolean;
}

// Filtered representation safe to send to a specific player
export interface FilteredPlayerState {
  playerId: string;
  displayName: string;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
  coins: number;
  inventory: Record<PowerUpType, number>;
  activeDefences: number[]; // row indices with active air defence
  stats: PlayerStats;
}

export interface FilteredGameState {
  gameId: string;
  phase: GamePhase;
  boardSize: number;
  mode: 'classic' | 'advanced';
  currentTurnPlayerId: string;
  turnNumber: number;
  winnerPlayerId?: string;
  
  // Own fleet & status
  own: {
    player: FilteredPlayerState;
    ships: PlacedShip[];
    board: CellState[][]; // Complete knowledge of own board
    activeDefences: number[];
  };
  
  // Opponent view (NO un-hit ship locations)
  opponent: {
    player: FilteredPlayerState;
    board: CellState[][]; // Only 'empty', 'hit', 'miss', or 'sunk'
    sunkShips: PlacedShip[]; // Publicly known sunk ships with locations
    activeDefences: number[]; // e.g. rows visibly defended if public or known
  };
  
  lastAction?: AttackResolution;
  radarHistory: RadarScanResult[]; // Intel collected by this player
}


import { GAME_CONFIG } from '../config.js';
import {
  AttackResolution,
  CellState,
  Coordinate,
  FilteredGameState,
  FilteredPlayerState,
  GamePhase,
  PlacedShip,
  PowerUpType,
  ShipOrientation,
  ShipType,
} from '../types/index.js';
import { toCoordKey } from './board.js';
import { CombatPlayerState, executePowerUpAttack, executeStandardAttack } from './combat.js';
import { generateRandomFleet, validateFleet } from './ship.js';

export class PlayerSession {
  public readonly playerId: string;
  public readonly tokenHash: string;
  public displayName: string;
  public socketId: string | null = null;
  public isConnected: boolean = true;
  public isReady: boolean = false;
  public reconnectTimeout: NodeJS.Timeout | null = null;

  // Combat state
  public combatState: CombatPlayerState;

  constructor(playerId: string, tokenHash: string, displayName: string, socketId: string) {
    this.playerId = playerId;
    this.tokenHash = tokenHash;
    this.displayName = displayName;
    this.socketId = socketId;

    this.combatState = {
      playerId,
      displayName,
      ships: [],
      attackHistory: new Map(),
      coins: GAME_CONFIG.STARTING_COINS,
      inventory: {
        row_airstrike: 0,
        carpet_bomb: 0,
        radar_scan: 0,
        air_defence: 0,
        precision_strike: 0,
      },
      activeDefences: new Set(),
      radarHistory: [],
      shotsFired: 0,
      hitsCount: 0,
      missesCount: 0,
      shipsDestroyedCount: 0,
      coinsEarned: 0,
      coinsSpent: 0,
      abilitiesUsed: 0,
    };
  }

  public resetForMatch(freshStartingCoins = GAME_CONFIG.STARTING_COINS) {
    this.isReady = false;
    this.combatState = {
      playerId: this.playerId,
      displayName: this.displayName,
      ships: [],
      attackHistory: new Map(),
      coins: freshStartingCoins,
      inventory: {
        row_airstrike: 0,
        carpet_bomb: 0,
        radar_scan: 0,
        air_defence: 0,
        precision_strike: 0,
      },
      activeDefences: new Set(),
      radarHistory: [],
      shotsFired: 0,
      hitsCount: 0,
      missesCount: 0,
      shipsDestroyedCount: 0,
      coinsEarned: 0,
      coinsSpent: 0,
      abilitiesUsed: 0,
    };
  }
}

export class GameEngine {
  public readonly gameId: string;
  public readonly boardSize: number;
  public readonly mode: 'classic' | 'advanced';
  public phase: GamePhase = 'PLACING_SHIPS';
  public currentTurnPlayerId: string = '';
  public turnNumber: number = 0;
  public winnerPlayerId?: string;
  public lastAction?: AttackResolution;

  public players: Map<string, PlayerSession> = new Map();
  public hostPlayerId: string;

  constructor(
    gameId: string,
    hostPlayer: PlayerSession,
    boardSize: number = GAME_CONFIG.DEFAULT_BOARD_SIZE,
    mode: 'classic' | 'advanced' = 'advanced'
  ) {
    this.gameId = gameId;
    this.boardSize = boardSize;
    this.mode = mode;
    this.hostPlayerId = hostPlayer.playerId;
    this.players.set(hostPlayer.playerId, hostPlayer);
  }

  public addPlayer(player: PlayerSession): boolean {
    if (this.players.size >= 2) return false;
    this.players.set(player.playerId, player);
    return true;
  }

  public getPlayer(playerId: string): PlayerSession | undefined {
    return this.players.get(playerId);
  }

  public getOpponent(playerId: string): PlayerSession | undefined {
    for (const [id, player] of this.players.entries()) {
      if (id !== playerId) return player;
    }
    return undefined;
  }

  /**
   * Sets fleet for a player. Fleet is validated strictly.
   */
  public setFleet(
    playerId: string,
    ships: Array<{ type: ShipType; x: number; y: number; orientation: ShipOrientation }>
  ): { success: boolean; error?: string } {
    if (this.phase !== 'PLACING_SHIPS' && this.phase !== 'READY_CHECK') {
      return { success: false, error: 'Fleet placement is only allowed during placement phase' };
    }

    const player = this.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found' };
    if (player.isReady) return { success: false, error: 'Player is already ready, fleet is locked' };

    const validation = validateFleet(ships, this.boardSize);
    if (!validation.valid || !validation.placedShips) {
      return { success: false, error: validation.error || 'Invalid ship placement' };
    }

    player.combatState.ships = validation.placedShips;
    return { success: true };
  }

  public setRandomFleet(playerId: string): { success: boolean; error?: string; ships?: PlacedShip[] } {
    if (this.phase !== 'PLACING_SHIPS' && this.phase !== 'READY_CHECK') {
      return { success: false, error: 'Cannot randomize fleet after placement phase' };
    }

    const player = this.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found' };
    if (player.isReady) return { success: false, error: 'Player is already ready, fleet is locked' };

    try {
      const ships = generateRandomFleet(this.boardSize);
      player.combatState.ships = ships;
      return { success: true, ships };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate fleet';
      return { success: false, error: message };
    }
  }

  public setPlayerReady(playerId: string): { success: boolean; error?: string; matchStarted: boolean } {
    const player = this.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found', matchStarted: false };

    if (player.combatState.ships.length !== GAME_CONFIG.FLEET.length) {
      return { success: false, error: 'All ships must be placed before confirming readiness', matchStarted: false };
    }

    player.isReady = true;

    // If both players ready and 2 players present, start combat!
    if (this.players.size === 2) {
      const allReady = Array.from(this.players.values()).every((p) => p.isReady);
      if (allReady) {
        this.phase = 'IN_PROGRESS';
        this.turnNumber = 1;
        // Randomly pick first player
        const playerIds = Array.from(this.players.keys());
        this.currentTurnPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];
        return { success: true, matchStarted: true };
      }
    }

    this.phase = 'READY_CHECK';
    return { success: true, matchStarted: false };
  }

  public attack(
    attackerId: string,
    target: Coordinate
  ): { success: boolean; error?: string; resolution?: AttackResolution } {
    if (this.phase !== 'IN_PROGRESS') {
      return { success: false, error: 'Game is not in progress' };
    }

    if (this.currentTurnPlayerId !== attackerId) {
      return { success: false, error: "Not player's turn" };
    }

    const attacker = this.players.get(attackerId);
    const defender = this.getOpponent(attackerId);
    if (!attacker || !defender) {
      return { success: false, error: 'Missing combatants' };
    }

    const result = executeStandardAttack(
      attacker.combatState,
      defender.combatState,
      target,
      this.boardSize
    );

    if (!result.success || !result.resolution) {
      return result;
    }

    this.lastAction = result.resolution;

    if (result.resolution.isGameOver) {
      this.phase = 'FINISHED';
      this.winnerPlayerId = result.resolution.winnerId;
    } else {
      // Advance turn to opponent
      this.currentTurnPlayerId = defender.playerId;
      this.turnNumber++;
    }

    return result;
  }

  public powerUp(
    attackerId: string,
    powerUp: PowerUpType,
    target: { coord?: Coordinate; row?: number }
  ): { success: boolean; error?: string; resolution?: AttackResolution } {
    if (this.phase !== 'IN_PROGRESS') {
      return { success: false, error: 'Game is not in progress' };
    }

    if (this.mode !== 'advanced') {
      return { success: false, error: 'Power-ups are only allowed in Advanced Mode' };
    }

    if (this.currentTurnPlayerId !== attackerId) {
      return { success: false, error: "Not player's turn" };
    }

    const attacker = this.players.get(attackerId);
    const defender = this.getOpponent(attackerId);
    if (!attacker || !defender) {
      return { success: false, error: 'Missing combatants' };
    }

    const result = executePowerUpAttack(
      attacker.combatState,
      defender.combatState,
      powerUp,
      target,
      this.boardSize
    );

    if (!result.success || !result.resolution) {
      return result;
    }

    this.lastAction = result.resolution;

    if (result.resolution.isGameOver) {
      this.phase = 'FINISHED';
      this.winnerPlayerId = result.resolution.winnerId;
    } else {
      // Advance turn to opponent
      this.currentTurnPlayerId = defender.playerId;
      this.turnNumber++;
    }

    return result;
  }

  public resetForRematch(): void {
    this.phase = 'PLACING_SHIPS';
    this.turnNumber = 0;
    this.winnerPlayerId = undefined;
    this.lastAction = undefined;

    for (const player of this.players.values()) {
      player.resetForMatch(GAME_CONFIG.STARTING_COINS);
    }
  }

  /**
   * Generates a completely secure, filtered view of game state for a specific player.
   * NEVER contains opponent's un-hit ship positions!
   */
  public getFilteredGameState(forPlayerId: string): FilteredGameState | null {
    const player = this.players.get(forPlayerId);
    if (!player) return null;

    const opponent = this.getOpponent(forPlayerId);

    // Build own complete board matrix
    const ownBoard: CellState[][] = Array.from({ length: this.boardSize }, () =>
      Array(this.boardSize).fill('empty')
    );

    // Mark own ships
    for (const ship of player.combatState.ships) {
      for (const c of ship.coordinates) {
        ownBoard[c.y][c.x] = ship.isSunk ? 'sunk' : 'ship';
      }
    }

    // Mark damage received from opponent on own board
    if (opponent) {
      for (const [coordKey, status] of opponent.combatState.attackHistory.entries()) {
        const [x, y] = coordKey.split(',').map(Number);
        if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
          // If a ship is sunk, keep it 'sunk'; otherwise 'hit' or 'miss'
          if (status === 'hit') {
            const hitShip = player.combatState.ships.find((s) =>
              s.coordinates.some((c) => c.x === x && c.y === y)
            );
            ownBoard[y][x] = hitShip && hitShip.isSunk ? 'sunk' : 'hit';
          } else if (status === 'miss') {
            ownBoard[y][x] = 'miss';
          }
        }
      }
    }

    // Build opponent board view (STRICTLY FILTERED: only attacker's past shots and announced sunk ships)
    const opponentBoard: CellState[][] = Array.from({ length: this.boardSize }, () =>
      Array(this.boardSize).fill('empty')
    );

    const opponentSunkShips: PlacedShip[] = [];
    if (opponent) {
      for (const ship of opponent.combatState.ships) {
        if (ship.isSunk) {
          opponentSunkShips.push(ship);
        }
      }

      for (const [coordKey, status] of player.combatState.attackHistory.entries()) {
        const [x, y] = coordKey.split(',').map(Number);
        if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
          if (status === 'hit') {
            const hitShip = opponent.combatState.ships.find((s) =>
              s.coordinates.some((c) => c.x === x && c.y === y)
            );
            opponentBoard[y][x] = hitShip && hitShip.isSunk ? 'sunk' : 'hit';
          } else {
            opponentBoard[y][x] = 'miss';
          }
        }
      }
    }

    const ownFilter: FilteredPlayerState = {
      playerId: player.playerId,
      displayName: player.displayName,
      isHost: player.playerId === this.hostPlayerId,
      isConnected: player.isConnected,
      isReady: player.isReady,
      coins: player.combatState.coins,
      inventory: player.combatState.inventory,
      activeDefences: Array.from(player.combatState.activeDefences),
      stats: {
        shotsFired: player.combatState.shotsFired,
        hits: player.combatState.hitsCount,
        misses: player.combatState.missesCount,
        shipsDestroyed: player.combatState.shipsDestroyedCount,
        coinsEarned: player.combatState.coinsEarned,
        coinsSpent: player.combatState.coinsSpent,
        abilitiesUsed: player.combatState.abilitiesUsed,
      },
    };

    const opponentFilter: FilteredPlayerState = opponent
      ? {
          playerId: opponent.playerId,
          displayName: opponent.displayName,
          isHost: opponent.playerId === this.hostPlayerId,
          isConnected: opponent.isConnected,
          isReady: opponent.isReady,
          coins: opponent.combatState.coins,
          inventory: opponent.combatState.inventory,
          activeDefences: Array.from(opponent.combatState.activeDefences),
          stats: {
            shotsFired: opponent.combatState.shotsFired,
            hits: opponent.combatState.hitsCount,
            misses: opponent.combatState.missesCount,
            shipsDestroyed: opponent.combatState.shipsDestroyedCount,
            coinsEarned: opponent.combatState.coinsEarned,
            coinsSpent: opponent.combatState.coinsSpent,
            abilitiesUsed: opponent.combatState.abilitiesUsed,
          },
        }
      : {
          playerId: 'waiting',
          displayName: 'Waiting for opponent...',
          isHost: false,
          isConnected: false,
          isReady: false,
          coins: 0,
          inventory: {
            row_airstrike: 0,
            carpet_bomb: 0,
            radar_scan: 0,
            air_defence: 0,
            precision_strike: 0,
          },
          activeDefences: [],
          stats: {
            shotsFired: 0,
            hits: 0,
            misses: 0,
            shipsDestroyed: 0,
            coinsEarned: 0,
            coinsSpent: 0,
            abilitiesUsed: 0,
          },
        };

    return {
      gameId: this.gameId,
      phase: this.phase,
      boardSize: this.boardSize,
      mode: this.mode,
      currentTurnPlayerId: this.currentTurnPlayerId,
      turnNumber: this.turnNumber,
      winnerPlayerId: this.winnerPlayerId,
      own: {
        player: ownFilter,
        ships: player.combatState.ships,
        board: ownBoard,
        activeDefences: Array.from(player.combatState.activeDefences),
      },
      opponent: {
        player: opponentFilter,
        board: opponentBoard,
        sunkShips: opponentSunkShips,
        activeDefences: opponent ? Array.from(opponent.combatState.activeDefences) : [],
      },
      lastAction: this.lastAction,
      radarHistory: player.combatState.radarHistory,
    };
  }
}


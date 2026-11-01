import { FLEET_CONFIG } from './constants';
import {
  AttackResolution,
  AttackResultCell,
  Coordinate,
  FilteredGameState,
  PlacedShip,
  PowerUpType,
  ShipOrientation,
  ShipType,
} from '../types/game';

export class LocalAIEngine {
  private boardSize: number;
  private mode: 'classic' | 'advanced';
  private botShips: PlacedShip[] = [];
  private playerShips: PlacedShip[] = [];
  private botAttacks: Map<string, 'hit' | 'miss'> = new Map();
  private playerAttacks: Map<string, 'hit' | 'miss'> = new Map();
  private botCoins: number = 100;
  private playerCoins: number = 100;
  private botDefences: Set<number> = new Set();
  private playerDefences: Set<number> = new Set();
  private isPlayerTurn: boolean = true;
  private turnNumber: number = 1;
  private lastResolution?: AttackResolution;
  private huntQueue: Coordinate[] = []; // Potential hit targets after a hit

  constructor(boardSize: number = 15, mode: 'classic' | 'advanced' = 'advanced') {
    this.boardSize = boardSize;
    this.mode = mode;
    this.botShips = this.generateRandomFleet();
  }

  public setPlayerShips(ships: PlacedShip[]) {
    this.playerShips = ships;
  }

  private generateRandomFleet(): PlacedShip[] {
    const ships: PlacedShip[] = [];
    const occupied = new Set<string>();

    for (const config of FLEET_CONFIG) {
      let placed = false;
      for (let attempt = 0; attempt < 200; attempt++) {
        const orientation: ShipOrientation = Math.random() < 0.5 ? 'H' : 'V';
        const maxX = orientation === 'H' ? this.boardSize - config.length : this.boardSize - 1;
        const maxY = orientation === 'V' ? this.boardSize - config.length : this.boardSize - 1;

        const x = Math.floor(Math.random() * (maxX + 1));
        const y = Math.floor(Math.random() * (maxY + 1));

        const coords: Coordinate[] = [];
        let valid = true;
        for (let i = 0; i < config.length; i++) {
          const cx = orientation === 'H' ? x + i : x;
          const cy = orientation === 'V' ? y + i : y;
          const key = `${cx},${cy}`;
          if (occupied.has(key)) {
            valid = false;
            break;
          }
          coords.push({ x: cx, y: cy });
        }

        if (valid) {
          coords.forEach((c) => occupied.add(`${c.x},${c.y}`));
          ships.push({
            id: `bot_ship_${config.type}`,
            type: config.type,
            name: config.name,
            length: config.length,
            x,
            y,
            orientation,
            coordinates: coords,
            hits: [],
            isSunk: false,
          });
          placed = true;
          break;
        }
      }
    }
    return ships;
  }

  public playerAttack(target: Coordinate): AttackResolution {
    const key = `${target.x},${target.y}`;
    let hitShip: PlacedShip | undefined;
    for (const ship of this.botShips) {
      if (ship.coordinates.some((c) => c.x === target.x && c.y === target.y)) {
        hitShip = ship;
        break;
      }
    }

    const newlySunk: PlacedShip[] = [];
    let cellStatus: 'hit' | 'miss' = 'miss';

    if (hitShip) {
      this.playerAttacks.set(key, 'hit');
      cellStatus = 'hit';
      this.playerCoins += 2;
      if (!hitShip.hits.some((c) => c.x === target.x && c.y === target.y)) {
        hitShip.hits.push(target);
      }
      if (hitShip.hits.length >= hitShip.length && !hitShip.isSunk) {
        hitShip.isSunk = true;
        newlySunk.push(hitShip);
        this.playerCoins += 5;
      }
    } else {
      this.playerAttacks.set(key, 'miss');
    }

    const allSunk = this.botShips.every((s) => s.isSunk);
    const res: AttackResolution = {
      type: 'standard',
      attackerId: 'player',
      cells: [
        {
          x: target.x,
          y: target.y,
          status: cellStatus,
          shipType: hitShip?.type,
          sunkShip: hitShip?.isSunk ? hitShip : undefined,
        },
      ],
      sunkShips: newlySunk,
      coinsDeducted: 0,
      coinsAwarded: hitShip ? 2 : 0,
      isGameOver: allSunk,
      winnerId: allSunk ? 'player' : undefined,
    };

    this.lastResolution = res;
    this.isPlayerTurn = false;
    this.turnNumber++;
    return res;
  }

  public botTakeTurn(): AttackResolution {
    // Pick target using hunt & seek
    let target: Coordinate = { x: 0, y: 0 };
    let found = false;

    while (this.huntQueue.length > 0) {
      const candidate = this.huntQueue.shift()!;
      const key = `${candidate.x},${candidate.y}`;
      if (!this.botAttacks.has(key)) {
        target = candidate;
        found = true;
        break;
      }
    }

    if (!found) {
      // Pick random unattacked cell
      const unattacked: Coordinate[] = [];
      for (let y = 0; y < this.boardSize; y++) {
        for (let x = 0; x < this.boardSize; x++) {
          if (!this.botAttacks.has(`${x},${y}`)) {
            unattacked.push({ x, y });
          }
        }
      }
      target = unattacked[Math.floor(Math.random() * unattacked.length)] || { x: 0, y: 0 };
    }

    const key = `${target.x},${target.y}`;
    let hitShip: PlacedShip | undefined;
    for (const ship of this.playerShips) {
      if (ship.coordinates.some((c) => c.x === target.x && c.y === target.y)) {
        hitShip = ship;
        break;
      }
    }

    const newlySunk: PlacedShip[] = [];
    let cellStatus: 'hit' | 'miss' = 'miss';

    if (hitShip) {
      this.botAttacks.set(key, 'hit');
      cellStatus = 'hit';
      this.botCoins += 2;
      if (!hitShip.hits.some((c) => c.x === target.x && c.y === target.y)) {
        hitShip.hits.push(target);
      }
      if (hitShip.hits.length >= hitShip.length && !hitShip.isSunk) {
        hitShip.isSunk = true;
        newlySunk.push(hitShip);
        this.botCoins += 5;
      }

      // Add adjacent orthogonal cells to hunt queue
      const neighbors: Coordinate[] = [
        { x: target.x + 1, y: target.y },
        { x: target.x - 1, y: target.y },
        { x: target.x, y: target.y + 1 },
        { x: target.x, y: target.y - 1 },
      ].filter(
        (c) =>
          c.x >= 0 &&
          c.x < this.boardSize &&
          c.y >= 0 &&
          c.y < this.boardSize &&
          !this.botAttacks.has(`${c.x},${c.y}`)
      );
      this.huntQueue.push(...neighbors);
    } else {
      this.botAttacks.set(key, 'miss');
    }

    const allSunk = this.playerShips.every((s) => s.isSunk);
    const res: AttackResolution = {
      type: 'standard',
      attackerId: 'bot',
      cells: [
        {
          x: target.x,
          y: target.y,
          status: cellStatus,
          shipType: hitShip?.type,
          sunkShip: hitShip?.isSunk ? hitShip : undefined,
        },
      ],
      sunkShips: newlySunk,
      coinsDeducted: 0,
      coinsAwarded: hitShip ? 2 : 0,
      isGameOver: allSunk,
      winnerId: allSunk ? 'bot' : undefined,
    };

    this.lastResolution = res;
    this.isPlayerTurn = true;
    this.turnNumber++;
    return res;
  }

  public getGameState(): FilteredGameState {
    // Build own board matrix (player ships + bot attacks)
    const ownBoard = Array.from({ length: this.boardSize }, () =>
      Array(this.boardSize).fill('empty')
    );
    for (const ship of this.playerShips) {
      for (const c of ship.coordinates) {
        ownBoard[c.y][c.x] = ship.isSunk ? 'sunk' : 'ship';
      }
    }
    for (const [key, status] of this.botAttacks.entries()) {
      const [x, y] = key.split(',').map(Number);
      if (status === 'hit') {
        const hitShip = this.playerShips.find((s) =>
          s.coordinates.some((c) => c.x === x && c.y === y)
        );
        ownBoard[y][x] = hitShip && hitShip.isSunk ? 'sunk' : 'hit';
      } else {
        ownBoard[y][x] = 'miss';
      }
    }

    // Build enemy board matrix (strictly filtered: only player attacks + sunk ships)
    const enemyBoard = Array.from({ length: this.boardSize }, () =>
      Array(this.boardSize).fill('empty')
    );
    for (const [key, status] of this.playerAttacks.entries()) {
      const [x, y] = key.split(',').map(Number);
      if (status === 'hit') {
        const hitShip = this.botShips.find((s) =>
          s.coordinates.some((c) => c.x === x && c.y === y)
        );
        enemyBoard[y][x] = hitShip && hitShip.isSunk ? 'sunk' : 'hit';
      } else {
        enemyBoard[y][x] = 'miss';
      }
    }

    const sunkBotShips = this.botShips.filter((s) => s.isSunk);
    const isGameOver =
      this.botShips.every((s) => s.isSunk) || this.playerShips.every((s) => s.isSunk);

    return {
      gameId: 'vs_ai_session',
      phase: isGameOver ? 'FINISHED' : 'IN_PROGRESS',
      boardSize: this.boardSize,
      mode: this.mode,
      currentTurnPlayerId: this.isPlayerTurn ? 'player' : 'bot',
      turnNumber: this.turnNumber,
      winnerPlayerId: this.botShips.every((s) => s.isSunk)
        ? 'player'
        : this.playerShips.every((s) => s.isSunk)
        ? 'bot'
        : undefined,
      own: {
        player: {
          playerId: 'player',
          displayName: 'Player',
          isHost: true,
          isConnected: true,
          isReady: true,
          coins: this.playerCoins,
          inventory: {
            row_airstrike: 0,
            carpet_bomb: 0,
            radar_scan: 0,
            air_defence: 0,
            precision_strike: 0,
          },
          activeDefences: Array.from(this.playerDefences),
          stats: {
            shotsFired: this.playerAttacks.size,
            hits: Array.from(this.playerAttacks.values()).filter((v) => v === 'hit').length,
            misses: Array.from(this.playerAttacks.values()).filter((v) => v === 'miss').length,
            shipsDestroyed: sunkBotShips.length,
            coinsEarned: this.playerCoins - 100,
            coinsSpent: 0,
            abilitiesUsed: 0,
          },
        },
        ships: this.playerShips,
        board: ownBoard,
        activeDefences: Array.from(this.playerDefences),
      },
      opponent: {
        player: {
          playerId: 'bot',
          displayName: 'Naval AI (Bot)',
          isHost: false,
          isConnected: true,
          isReady: true,
          coins: this.botCoins,
          inventory: {
            row_airstrike: 0,
            carpet_bomb: 0,
            radar_scan: 0,
            air_defence: 0,
            precision_strike: 0,
          },
          activeDefences: Array.from(this.botDefences),
          stats: {
            shotsFired: this.botAttacks.size,
            hits: Array.from(this.botAttacks.values()).filter((v) => v === 'hit').length,
            misses: Array.from(this.botAttacks.values()).filter((v) => v === 'miss').length,
            shipsDestroyed: this.playerShips.filter((s) => s.isSunk).length,
            coinsEarned: this.botCoins - 100,
            coinsSpent: 0,
            abilitiesUsed: 0,
          },
        },
        board: enemyBoard,
        sunkShips: sunkBotShips,
        activeDefences: Array.from(this.botDefences),
      },
      lastAction: this.lastResolution,
      radarHistory: [],
    };
  }
}


import { GAME_CONFIG } from '../config.js';
import {
  AttackResolution,
  AttackResultCell,
  Coordinate,
  PlacedShip,
  PowerUpType,
  RadarScanResult,
} from '../types/index.js';
import {
  getArea3x3Coordinates,
  getRowCoordinates,
  isValidCoordinate,
  toCoordKey,
} from './board.js';

export interface CombatPlayerState {
  playerId: string;
  displayName: string;
  ships: PlacedShip[];
  attackHistory: Map<string, 'hit' | 'miss'>; // coordKey -> result
  coins: number;
  inventory: Record<PowerUpType, number>;
  activeDefences: Set<number>; // Row indices currently guarded by air defence
  radarHistory: RadarScanResult[];
  shotsFired: number;
  hitsCount: number;
  missesCount: number;
  shipsDestroyedCount: number;
  coinsEarned: number;
  coinsSpent: number;
  abilitiesUsed: number;
}

export function executeStandardAttack(
  attacker: CombatPlayerState,
  defender: CombatPlayerState,
  target: Coordinate,
  boardSize: number
): { success: boolean; error?: string; resolution?: AttackResolution } {
  if (!isValidCoordinate(target, boardSize)) {
    return { success: false, error: `Invalid target coordinate (${target.x + 1}, ${target.y + 1})` };
  }

  const coordKey = toCoordKey(target);
  if (attacker.attackHistory.has(coordKey)) {
    return { success: false, error: 'Cell has already been attacked' };
  }

  attacker.shotsFired++;
  const newlySunkShips: PlacedShip[] = [];
  let coinsAwarded = 0;

  // Check if any ship of defender is at this coordinate
  let hitShip: PlacedShip | undefined;
  for (const ship of defender.ships) {
    if (ship.coordinates.some((c) => c.x === target.x && c.y === target.y)) {
      hitShip = ship;
      break;
    }
  }

  let cellResult: AttackResultCell;
  if (hitShip) {
    attacker.attackHistory.set(coordKey, 'hit');
    attacker.hitsCount++;
    coinsAwarded += GAME_CONFIG.REWARDS.HIT;
    attacker.coins += GAME_CONFIG.REWARDS.HIT;
    attacker.coinsEarned += GAME_CONFIG.REWARDS.HIT;

    // Record hit on ship if not already present
    if (!hitShip.hits.some((c) => c.x === target.x && c.y === target.y)) {
      hitShip.hits.push(target);
    }

    // Check if ship is sunk
    if (hitShip.hits.length >= hitShip.length && !hitShip.isSunk) {
      hitShip.isSunk = true;
      newlySunkShips.push(hitShip);
      attacker.shipsDestroyedCount++;
      coinsAwarded += GAME_CONFIG.REWARDS.SINK_SHIP;
      attacker.coins += GAME_CONFIG.REWARDS.SINK_SHIP;
      attacker.coinsEarned += GAME_CONFIG.REWARDS.SINK_SHIP;
    }

    cellResult = {
      x: target.x,
      y: target.y,
      status: 'hit',
      shipType: hitShip.type,
      sunkShip: hitShip.isSunk ? hitShip : undefined,
    };
  } else {
    attacker.attackHistory.set(coordKey, 'miss');
    attacker.missesCount++;
    cellResult = {
      x: target.x,
      y: target.y,
      status: 'miss',
    };
  }

  // Check victory
  const allSunk = defender.ships.every((s) => s.isSunk);
  if (allSunk) {
    attacker.coins += GAME_CONFIG.REWARDS.VICTORY;
    attacker.coinsEarned += GAME_CONFIG.REWARDS.VICTORY;
    defender.coins += GAME_CONFIG.REWARDS.DEFEAT;
    defender.coinsEarned += GAME_CONFIG.REWARDS.DEFEAT;
  }

  const resolution: AttackResolution = {
    type: 'standard',
    attackerId: attacker.playerId,
    cells: [cellResult],
    sunkShips: newlySunkShips,
    coinsDeducted: 0,
    coinsAwarded,
    isGameOver: allSunk,
    winnerId: allSunk ? attacker.playerId : undefined,
  };

  return { success: true, resolution };
}

export function executePowerUpAttack(
  attacker: CombatPlayerState,
  defender: CombatPlayerState,
  powerUp: PowerUpType,
  target: { coord?: Coordinate; row?: number },
  boardSize: number
): { success: boolean; error?: string; resolution?: AttackResolution } {
  const config = GAME_CONFIG.POWER_UPS[powerUp];
  if (!config) {
    return { success: false, error: `Invalid power-up type: ${powerUp}` };
  }

  // Check coin balance
  if (attacker.coins < config.cost) {
    return {
      success: false,
      error: `Insufficient coins. Required: ${config.cost}, available: ${attacker.coins}`,
    };
  }

  // Check inventory/uses limit if applicable
  if (config.maxUsesPerMatch && attacker.inventory[powerUp] >= config.maxUsesPerMatch) {
    return {
      success: false,
      error: `Maximum uses reached for ${config.name} (${config.maxUsesPerMatch})`,
    };
  }

  // 1. Air Defence (deployed on friendly board)
  if (powerUp === 'air_defence') {
    if (target.row === undefined || target.row < 0 || target.row >= boardSize) {
      return { success: false, error: 'A valid row index must be selected for Air Defence' };
    }
    if (attacker.activeDefences.has(target.row)) {
      return { success: false, error: `Row ${target.row + 1} already has active Air Defence` };
    }

    attacker.coins -= config.cost;
    attacker.coinsSpent += config.cost;
    attacker.inventory[powerUp] = (attacker.inventory[powerUp] || 0) + 1;
    attacker.abilitiesUsed++;
    attacker.activeDefences.add(target.row);

    const resolution: AttackResolution = {
      type: 'air_defence',
      attackerId: attacker.playerId,
      cells: [],
      sunkShips: [],
      coinsDeducted: config.cost,
      coinsAwarded: 0,
      isGameOver: false,
    };

    return { success: true, resolution };
  }

  // 2. Radar Scan (intelligence gathering, no physical strike)
  if (powerUp === 'radar_scan') {
    if (!target.coord || !isValidCoordinate(target.coord, boardSize)) {
      return { success: false, error: 'A valid center coordinate must be selected for Radar Scan' };
    }

    const areaCoords = getArea3x3Coordinates(target.coord, boardSize);
    let shipCellsFound = 0;

    for (const c of areaCoords) {
      for (const ship of defender.ships) {
        if (ship.coordinates.some((sc) => sc.x === c.x && sc.y === c.y)) {
          shipCellsFound++;
          break; // Count each cell once
        }
      }
    }

    attacker.coins -= config.cost;
    attacker.coinsSpent += config.cost;
    attacker.inventory[powerUp] = (attacker.inventory[powerUp] || 0) + 1;
    attacker.abilitiesUsed++;

    const radarIntel: RadarScanResult = {
      center: target.coord,
      radius: 1,
      shipCellsFound,
      timestamp: Date.now(),
    };
    attacker.radarHistory.push(radarIntel);

    const resolution: AttackResolution = {
      type: 'radar_scan',
      attackerId: attacker.playerId,
      cells: [],
      sunkShips: [],
      radarIntel,
      coinsDeducted: config.cost,
      coinsAwarded: 0,
      isGameOver: false,
    };

    return { success: true, resolution };
  }

  // 3. Row Airstrike (attacks entire row)
  if (powerUp === 'row_airstrike') {
    if (target.row === undefined || target.row < 0 || target.row >= boardSize) {
      return { success: false, error: 'A valid row index must be selected for Row Airstrike' };
    }

    // Deduct coins & record ability usage
    attacker.coins -= config.cost;
    attacker.coinsSpent += config.cost;
    attacker.inventory[powerUp] = (attacker.inventory[powerUp] || 0) + 1;
    attacker.abilitiesUsed++;

    // Check if defender has active Air Defence on this row!
    if (defender.activeDefences.has(target.row)) {
      // Intercepted and blocked! Consume defender's air defence
      defender.activeDefences.delete(target.row);

      const resolution: AttackResolution = {
        type: 'row_airstrike',
        attackerId: attacker.playerId,
        cells: [],
        sunkShips: [],
        coinsDeducted: config.cost,
        coinsAwarded: 0,
        isGameOver: false,
        blockedByAirDefence: true,
      };

      return { success: true, resolution };
    }

    // Resolve strike across all cells in row
    const rowCoords = getRowCoordinates(target.row, boardSize);
    return resolveAreaStrike(attacker, defender, rowCoords, 'row_airstrike', config.cost);
  }

  // 4. Carpet Bomb (3x3 area)
  if (powerUp === 'carpet_bomb') {
    if (!target.coord || !isValidCoordinate(target.coord, boardSize)) {
      return { success: false, error: 'A valid center coordinate must be selected for Carpet Bomb' };
    }

    attacker.coins -= config.cost;
    attacker.coinsSpent += config.cost;
    attacker.inventory[powerUp] = (attacker.inventory[powerUp] || 0) + 1;
    attacker.abilitiesUsed++;

    const areaCoords = getArea3x3Coordinates(target.coord, boardSize);
    return resolveAreaStrike(attacker, defender, areaCoords, 'carpet_bomb', config.cost);
  }

  // 5. Precision Strike (single cell high-value strike)
  if (powerUp === 'precision_strike') {
    if (!target.coord || !isValidCoordinate(target.coord, boardSize)) {
      return { success: false, error: 'A valid coordinate must be selected for Precision Strike' };
    }

    attacker.coins -= config.cost;
    attacker.coinsSpent += config.cost;
    attacker.inventory[powerUp] = (attacker.inventory[powerUp] || 0) + 1;
    attacker.abilitiesUsed++;

    return resolveAreaStrike(attacker, defender, [target.coord], 'precision_strike', config.cost);
  }

  return { success: false, error: 'Unsupported power-up action' };
}

function resolveAreaStrike(
  attacker: CombatPlayerState,
  defender: CombatPlayerState,
  coords: Coordinate[],
  abilityType: PowerUpType,
  cost: number
): { success: boolean; resolution: AttackResolution } {
  const newlySunkShips: PlacedShip[] = [];
  const cells: AttackResultCell[] = [];
  let coinsAwarded = 0;

  for (const c of coords) {
    const key = toCoordKey(c);
    const wasAlreadyAttacked = attacker.attackHistory.has(key);

    let hitShip: PlacedShip | undefined;
    for (const ship of defender.ships) {
      if (ship.coordinates.some((sc) => sc.x === c.x && sc.y === c.y)) {
        hitShip = ship;
        break;
      }
    }

    if (hitShip) {
      if (!wasAlreadyAttacked) {
        attacker.attackHistory.set(key, 'hit');
        attacker.hitsCount++;
        coinsAwarded += GAME_CONFIG.REWARDS.HIT;
        attacker.coins += GAME_CONFIG.REWARDS.HIT;
        attacker.coinsEarned += GAME_CONFIG.REWARDS.HIT;

        if (!hitShip.hits.some((hc) => hc.x === c.x && hc.y === c.y)) {
          hitShip.hits.push(c);
        }

        if (hitShip.hits.length >= hitShip.length && !hitShip.isSunk) {
          hitShip.isSunk = true;
          newlySunkShips.push(hitShip);
          attacker.shipsDestroyedCount++;
          coinsAwarded += GAME_CONFIG.REWARDS.SINK_SHIP;
          attacker.coins += GAME_CONFIG.REWARDS.SINK_SHIP;
          attacker.coinsEarned += GAME_CONFIG.REWARDS.SINK_SHIP;
        }
      }

      cells.push({
        x: c.x,
        y: c.y,
        status: 'hit',
        shipType: hitShip.type,
        sunkShip: hitShip.isSunk ? hitShip : undefined,
      });
    } else {
      if (!wasAlreadyAttacked) {
        attacker.attackHistory.set(key, 'miss');
        attacker.missesCount++;
      }
      cells.push({
        x: c.x,
        y: c.y,
        status: 'miss',
      });
    }
  }

  const allSunk = defender.ships.every((s) => s.isSunk);
  if (allSunk) {
    attacker.coins += GAME_CONFIG.REWARDS.VICTORY;
    attacker.coinsEarned += GAME_CONFIG.REWARDS.VICTORY;
    defender.coins += GAME_CONFIG.REWARDS.DEFEAT;
    defender.coinsEarned += GAME_CONFIG.REWARDS.DEFEAT;
  }

  const resolution: AttackResolution = {
    type: abilityType,
    attackerId: attacker.playerId,
    cells,
    sunkShips: newlySunkShips,
    coinsDeducted: cost,
    coinsAwarded,
    isGameOver: allSunk,
    winnerId: allSunk ? attacker.playerId : undefined,
  };

  return { success: true, resolution };
}


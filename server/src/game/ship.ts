import { GAME_CONFIG } from '../config.js';
import { Coordinate, PlacedShip, ShipConfig, ShipOrientation, ShipType } from '../types/index.js';
import { calculateShipCoordinates, isValidCoordinate, toCoordKey } from './board.js';

export function getShipConfig(type: ShipType): ShipConfig | undefined {
  return GAME_CONFIG.FLEET.find((s) => s.type === type);
}

export function validatePlacement(
  shipType: ShipType,
  x: number,
  y: number,
  orientation: ShipOrientation,
  existingShips: PlacedShip[],
  boardSize: number
): { valid: boolean; error?: string; coordinates?: Coordinate[] } {
  const config = getShipConfig(shipType);
  if (!config) {
    return { valid: false, error: `Unknown ship type: ${shipType}` };
  }

  const coordinates = calculateShipCoordinates(x, y, config.length, orientation);

  // 1. Check out of bounds
  for (const coord of coordinates) {
    if (!isValidCoordinate(coord, boardSize)) {
      return {
        valid: false,
        error: `Ship ${config.name} extends outside the board at (${coord.x + 1}, ${coord.y + 1})`,
      };
    }
  }

  // 2. Check overlap with existing ships
  const occupiedSet = new Set<string>();
  for (const existing of existingShips) {
    for (const c of existing.coordinates) {
      occupiedSet.add(toCoordKey(c));
    }
  }

  for (const coord of coordinates) {
    if (occupiedSet.has(toCoordKey(coord))) {
      return {
        valid: false,
        error: `Ship ${config.name} overlaps with an existing ship at (${coord.x + 1}, ${coord.y + 1})`,
      };
    }
  }

  return { valid: true, coordinates };
}

export function validateFleet(
  shipsToPlace: Array<{
    type: ShipType;
    x: number;
    y: number;
    orientation: ShipOrientation;
  }>,
  boardSize: number
): { valid: boolean; error?: string; placedShips?: PlacedShip[] } {
  // Must match standard fleet ship types
  const requiredTypes = GAME_CONFIG.FLEET.map((s) => s.type);
  if (shipsToPlace.length !== requiredTypes.length) {
    return {
      valid: false,
      error: `Expected ${requiredTypes.length} ships, but got ${shipsToPlace.length}`,
    };
  }

  const placedTypes = new Set<ShipType>();
  const placedShips: PlacedShip[] = [];

  for (const shipInput of shipsToPlace) {
    if (placedTypes.has(shipInput.type)) {
      return { valid: false, error: `Duplicate ship type: ${shipInput.type}` };
    }
    const config = getShipConfig(shipInput.type);
    if (!config) {
      return { valid: false, error: `Invalid ship type: ${shipInput.type}` };
    }

    const result = validatePlacement(
      shipInput.type,
      shipInput.x,
      shipInput.y,
      shipInput.orientation,
      placedShips,
      boardSize
    );

    if (!result.valid || !result.coordinates) {
      return { valid: false, error: result.error };
    }

    placedTypes.add(shipInput.type);
    placedShips.push({
      id: `ship_${shipInput.type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: shipInput.type,
      name: config.name,
      length: config.length,
      x: shipInput.x,
      y: shipInput.y,
      orientation: shipInput.orientation,
      coordinates: result.coordinates,
      hits: [],
      isSunk: false,
    });
  }

  // Ensure all required ship types were provided
  for (const required of requiredTypes) {
    if (!placedTypes.has(required)) {
      return { valid: false, error: `Missing required ship: ${required}` };
    }
  }

  return { valid: true, placedShips };
}

export function generateRandomFleet(boardSize: number): PlacedShip[] {
  const fleetConfig = [...GAME_CONFIG.FLEET].sort((a, b) => b.length - a.length);
  const maxAttemptsPerShip = 200;

  let overallAttempts = 0;
  while (overallAttempts < 50) {
    overallAttempts++;
    const placedShips: PlacedShip[] = [];
    let success = true;

    for (const config of fleetConfig) {
      let placed = false;
      for (let attempt = 0; attempt < maxAttemptsPerShip; attempt++) {
        const orientation: ShipOrientation = Math.random() < 0.5 ? 'H' : 'V';
        const maxX = orientation === 'H' ? boardSize - config.length : boardSize - 1;
        const maxY = orientation === 'V' ? boardSize - config.length : boardSize - 1;

        const x = Math.floor(Math.random() * (maxX + 1));
        const y = Math.floor(Math.random() * (maxY + 1));

        const validation = validatePlacement(config.type, x, y, orientation, placedShips, boardSize);
        if (validation.valid && validation.coordinates) {
          placedShips.push({
            id: `ship_${config.type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: config.type,
            name: config.name,
            length: config.length,
            x,
            y,
            orientation,
            coordinates: validation.coordinates,
            hits: [],
            isSunk: false,
          });
          placed = true;
          break;
        }
      }

      if (!placed) {
        success = false;
        break;
      }
    }

    if (success && placedShips.length === fleetConfig.length) {
      return placedShips;
    }
  }

  throw new Error('Failed to generate random fleet after multiple attempts');
}


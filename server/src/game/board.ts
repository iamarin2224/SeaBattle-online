import { Coordinate, ShipOrientation } from '../types/index.js';

export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] as const;

export function isValidCoordinate(coord: Coordinate, boardSize: number): boolean {
  return (
    Number.isInteger(coord.x) &&
    Number.isInteger(coord.y) &&
    coord.x >= 0 &&
    coord.x < boardSize &&
    coord.y >= 0 &&
    coord.y < boardSize
  );
}

export function toCoordKey(coord: Coordinate): string {
  return `${coord.x},${coord.y}`;
}

export function fromCoordKey(key: string): Coordinate {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

export function toHumanCoordinate(coord: Coordinate): string {
  const row = ROW_LABELS[coord.y] ?? `R${coord.y + 1}`;
  const col = coord.x + 1;
  return `${row}${col}`;
}

export function calculateShipCoordinates(
  x: number,
  y: number,
  length: number,
  orientation: ShipOrientation
): Coordinate[] {
  const coordinates: Coordinate[] = [];
  for (let i = 0; i < length; i++) {
    coordinates.push({
      x: orientation === 'H' ? x + i : x,
      y: orientation === 'V' ? y + i : y,
    });
  }
  return coordinates;
}

/**
 * Generates 3x3 target coordinates centered at (centerX, centerY),
 * clamped strictly to valid board bounds.
 */
export function getArea3x3Coordinates(center: Coordinate, boardSize: number): Coordinate[] {
  const result: Coordinate[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
        result.push({ x, y });
      }
    }
  }
  return result;
}

/**
 * Returns all coordinates belonging to a given row.
 */
export function getRowCoordinates(rowIndex: number, boardSize: number): Coordinate[] {
  if (rowIndex < 0 || rowIndex >= boardSize) {
    return [];
  }
  const result: Coordinate[] = [];
  for (let x = 0; x < boardSize; x++) {
    result.push({ x, y: rowIndex });
  }
  return result;
}


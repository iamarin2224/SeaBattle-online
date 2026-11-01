import { PowerUpConfig, ShipConfig } from '../types/game';

export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] as const;

export const FLEET_CONFIG: ShipConfig[] = [
  { type: 'carrier', name: 'Aircraft Carrier', length: 5 },
  { type: 'battleship', name: 'Battleship', length: 4 },
  { type: 'cruiser', name: 'Cruiser', length: 3 },
  { type: 'submarine', name: 'Submarine', length: 3 },
  { type: 'destroyer', name: 'Destroyer', length: 2 },
];

export const POWER_UPS: Record<string, PowerUpConfig> = {
  row_airstrike: {
    id: 'row_airstrike',
    name: 'Row Airstrike',
    description: 'Carpet-bombs an entire horizontal row across the enemy grid.',
    cost: 10,
    maxUsesPerMatch: 3,
  },
  carpet_bomb: {
    id: 'carpet_bomb',
    name: 'Carpet Bomb',
    description: 'Heavy bomber blankets a 3x3 tactical sector.',
    cost: 15,
    maxUsesPerMatch: 3,
  },
  radar_scan: {
    id: 'radar_scan',
    name: 'Radar Scan',
    description: 'Scans a 3x3 sector, returning the count of ship cells detected.',
    cost: 8,
    maxUsesPerMatch: 5,
  },
  air_defence: {
    id: 'air_defence',
    name: 'Air Defence',
    description: 'Deploys anti-air batteries on a friendly row to intercept airstrikes.',
    cost: 12,
    maxUsesPerMatch: 3,
  },
  precision_strike: {
    id: 'precision_strike',
    name: 'Precision Strike',
    description: 'Pinpoint guided missile strike targeting a single cell.',
    cost: 6,
    maxUsesPerMatch: 5,
  },
};


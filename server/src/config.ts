import dotenv from 'dotenv';
dotenv.config();

import { PowerUpConfig, ShipConfig } from './types/index.js';

export const GAME_CONFIG = {
  DEFAULT_BOARD_SIZE: 15,
  CLASSIC_BOARD_SIZE: 10,
  STARTING_COINS: 100,
  
  // Coin rewards
  REWARDS: {
    HIT: 2,
    SINK_SHIP: 5,
    VICTORY: 25,
    DEFEAT: 10,
  },
  
  // Default Fleet
  FLEET: [
    { type: 'carrier', name: 'Aircraft Carrier', length: 5 },
    { type: 'battleship', name: 'Battleship', length: 4 },
    { type: 'cruiser', name: 'Cruiser', length: 3 },
    { type: 'submarine', name: 'Submarine', length: 3 },
    { type: 'destroyer', name: 'Destroyer', length: 2 },
  ] as ShipConfig[],

  // Power-Ups
  POWER_UPS: {
    row_airstrike: {
      id: 'row_airstrike',
      name: 'Row Airstrike',
      description: 'Air wing bombs an entire row across the enemy grid.',
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
      description: 'Reveals the count of enemy ship cells in a 3x3 sector without attacking.',
      cost: 8,
      maxUsesPerMatch: 5,
    },
    air_defence: {
      id: 'air_defence',
      name: 'Air Defence',
      description: 'Deploys anti-air batteries on a friendly row to intercept enemy airstrikes.',
      cost: 12,
      maxUsesPerMatch: 3,
    },
    precision_strike: {
      id: 'precision_strike',
      name: 'Precision Strike',
      description: 'Guided missile strike targeting a high-value single coordinate.',
      cost: 6,
      maxUsesPerMatch: 5,
    },
  } as Record<string, PowerUpConfig>,

  RECONNECT_GRACE_PERIOD_MS: 60 * 1000, // 60 seconds
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

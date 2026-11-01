import { z } from 'zod';

export const createRoomSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(20, 'Display name cannot exceed 20 characters'),
  mode: z.enum(['classic', 'advanced']).default('advanced'),
  boardSize: z.number().int().min(10).max(20).default(15),
});

export const joinRoomSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .min(4, 'Room code must be at least 4 characters')
    .max(8, 'Room code too long')
    .toUpperCase(),
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(20, 'Display name cannot exceed 20 characters'),
  playerToken: z.string().optional(),
});

export const shipPlacementSchema = z.object({
  ships: z.array(
    z.object({
      type: z.enum(['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer']),
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      orientation: z.enum(['H', 'V']),
    })
  ),
});

export const attackSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

export const powerUpSchema = z.object({
  powerUp: z.enum(['row_airstrike', 'carpet_bomb', 'radar_scan', 'air_defence', 'precision_strike']),
  target: z.object({
    coord: z
      .object({
        x: z.number().int().min(0),
        y: z.number().int().min(0),
      })
      .optional(),
    row: z.number().int().min(0).optional(),
  }),
});


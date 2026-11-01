import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { GAME_CONFIG } from './config.js';
import { globalRoomManager } from './rooms/roomManager.js';

export function createApp(): Express {
  const app = express();

  const allowedOrigins = GAME_CONFIG.CORS_ORIGIN.split(',').map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(origin) ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    })
  );

  app.use(express.json());

  // Health-check endpoint for Render / monitoring
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      version: '1.0.0',
    });
  });

  // Room status endpoint (helpful for diagnostics)
  app.get('/api/status', (_req: Request, res: Response) => {
    res.status(200).json({
      activeRooms: 0, // In-memory count
      serverTime: Date.now(),
    });
  });

  return app;
}


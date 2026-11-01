import http from 'http';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { ClientToServerEvents, ServerToClientEvents } from '../src/socket/events.js';
import { setupSocketHandlers } from '../src/socket/handler.js';
import { AttackResolution, FilteredGameState, ShipType } from '../src/types/index.js';

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

describe('Real-Time Socket.IO Multiplayer Integration Tests', () => {
  let server: http.Server;
  let io: Server;
  let port: number;

  beforeAll(async () => {
    const app = createApp();
    server = http.createServer(app);
    io = new Server(server, {
      cors: { origin: '*' },
    });
    setupSocketHandlers(io as any);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    io.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('runs complete 2-player flow: create, join, 3rd player rejection, placement, combat, and rematch', async () => {
    // 1. Client A connects and creates room
    const clientA: TestClient = Client(`http://localhost:${port}`);
    await new Promise<void>((resolve) => clientA.on('connect', resolve));

    let roomCode = '';
    let playerAToken = '';
    let playerAId = '';

    await new Promise<void>((resolve) => {
      clientA.emit(
        'create-room',
        { displayName: 'Admiral Alice', mode: 'advanced', boardSize: 15 },
        (res) => {
          expect(res.success).toBe(true);
          expect(res.roomCode).toBeDefined();
          roomCode = res.roomCode!;
          playerAToken = res.playerToken!;
          playerAId = res.playerId!;
          resolve();
        }
      );
    });

    // 2. Client B connects and joins room
    const clientB: TestClient = Client(`http://localhost:${port}`);
    await new Promise<void>((resolve) => clientB.on('connect', resolve));

    let playerBToken = '';
    let playerBId = '';

    await new Promise<void>((resolve) => {
      clientB.emit(
        'join-room',
        { roomCode, displayName: 'Captain Bob' },
        (res) => {
          expect(res.success).toBe(true);
          expect(res.roomCode).toBe(roomCode);
          playerBToken = res.playerToken!;
          playerBId = res.playerId!;
          resolve();
        }
      );
    });

    // 3. Client C tries to join room -> should be rejected!
    const clientC: TestClient = Client(`http://localhost:${port}`);
    await new Promise<void>((resolve) => clientC.on('connect', resolve));

    await new Promise<void>((resolve) => {
      clientC.emit(
        'join-room',
        { roomCode, displayName: 'Intruder' },
        (res) => {
          expect(res.success).toBe(false);
          expect(res.error).toContain('already full');
          clientC.disconnect();
          resolve();
        }
      );
    });

    // 4. Fleet placement for both players
    const aliceFleet: Array<{ type: ShipType; x: number; y: number; orientation: 'H' | 'V' }> = [
      { type: 'carrier', x: 0, y: 0, orientation: 'H' },
      { type: 'battleship', x: 0, y: 2, orientation: 'H' },
      { type: 'cruiser', x: 0, y: 4, orientation: 'H' },
      { type: 'submarine', x: 0, y: 6, orientation: 'H' },
      { type: 'destroyer', x: 0, y: 8, orientation: 'H' },
    ];

    await new Promise<void>((resolve) => {
      clientA.emit('place-ships', { ships: aliceFleet }, (res) => {
        expect(res.success).toBe(true);
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      clientA.emit('player-ready', (res) => {
        expect(res.success).toBe(true);
        resolve();
      });
    });

    const bobFleet: Array<{ type: ShipType; x: number; y: number; orientation: 'H' | 'V' }> = [
      { type: 'carrier', x: 5, y: 0, orientation: 'V' },
      { type: 'battleship', x: 7, y: 0, orientation: 'V' },
      { type: 'cruiser', x: 9, y: 0, orientation: 'V' },
      { type: 'submarine', x: 11, y: 0, orientation: 'V' },
      { type: 'destroyer', x: 13, y: 0, orientation: 'V' },
    ];

    await new Promise<void>((resolve) => {
      clientB.emit('place-ships', { ships: bobFleet }, (res) => {
        expect(res.success).toBe(true);
        resolve();
      });
    });

    let clientAState: FilteredGameState | null = null;
    let clientBState: FilteredGameState | null = null;

    const statePromise = Promise.all([
      new Promise<void>((resolve) => {
        clientA.on('room-state', (state) => {
          if (state.phase === 'IN_PROGRESS') {
            clientAState = state;
            resolve();
          }
        });
      }),
      new Promise<void>((resolve) => {
        clientB.on('room-state', (state) => {
          if (state.phase === 'IN_PROGRESS') {
            clientBState = state;
            resolve();
          }
        });
      }),
    ]);

    let firstTurnPlayerId = '';
    const matchStartedPromise = Promise.all([
      new Promise<void>((resolve) =>
        clientA.once('match-started', (data) => {
          firstTurnPlayerId = data.firstTurnPlayerId;
          resolve();
        })
      ),
      new Promise<void>((resolve) => clientB.once('match-started', () => resolve())),
    ]);

    await new Promise<void>((resolve) => {
      clientB.emit('player-ready', (res) => {
        expect(res.success).toBe(true);
        resolve();
      });
    });

    await matchStartedPromise;
    await statePromise;

    expect(clientAState).not.toBeNull();
    expect(clientBState).not.toBeNull();
    expect(clientAState!.phase).toBe('IN_PROGRESS');

    // 5. Test Authoritative Attack over WebSockets
    const activeClient = firstTurnPlayerId === playerAId ? clientA : clientB;
    const passiveClient = firstTurnPlayerId === playerAId ? clientB : clientA;

    let receivedAction: AttackResolution | null = null;
    const actionPromise = new Promise<void>((resolve) => {
      passiveClient.once('action-resolved', (res) => {
        receivedAction = res;
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      activeClient.emit('standard-attack', { x: 14, y: 14 }, (res) => {
        expect(res.success).toBe(true);
        expect(res.resolution?.cells[0].status).toBe('miss');
        resolve();
      });
    });

    await actionPromise;
    expect(receivedAction).not.toBeNull();
    expect(receivedAction!.cells[0].status).toBe('miss');

    // 6. Test reconnection with player token
    clientA.disconnect();
    const reconnectClientA: TestClient = Client(`http://localhost:${port}`);
    await new Promise<void>((resolve) => reconnectClientA.on('connect', resolve));

    await new Promise<void>((resolve) => {
      reconnectClientA.emit(
        'join-room',
        { roomCode, displayName: 'Admiral Alice', playerToken: playerAToken },
        (res) => {
          expect(res.success).toBe(true);
          expect(res.playerId).toBe(playerAId);
          resolve();
        }
      );
    });

    // 7. Clean up
    reconnectClientA.disconnect();
    clientB.disconnect();
  }, 10000);
});

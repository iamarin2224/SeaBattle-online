import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../src/config.js';
import {
  calculateShipCoordinates,
  getArea3x3Coordinates,
  getRowCoordinates,
  isValidCoordinate,
} from '../src/game/board.js';
import { generateRandomFleet, validateFleet, validatePlacement } from '../src/game/ship.js';
import { GameEngine, PlayerSession } from '../src/game/state.js';
import { PlacedShip, ShipType } from '../src/types/index.js';

describe('Classic Sea Battle Core Game Engine Tests', () => {
  const boardSize = 15;

  function createTestPlayers() {
    const p1 = new PlayerSession('p1_id', 'p1_token', 'Admiral Alice', 'sock_1');
    const p2 = new PlayerSession('p2_id', 'p2_token', 'Captain Bob', 'sock_2');
    return { p1, p2 };
  }

  function setupReadyGame() {
    const { p1, p2 } = createTestPlayers();
    const game = new GameEngine('game_123', p1, boardSize, 'advanced');
    game.addPlayer(p2);

    // Give Alice valid fleet
    const aliceFleet: Array<{ type: ShipType; x: number; y: number; orientation: 'H' | 'V' }> = [
      { type: 'carrier', x: 0, y: 0, orientation: 'H' }, // (0,0) to (4,0)
      { type: 'battleship', x: 0, y: 2, orientation: 'H' }, // (0,2) to (3,2)
      { type: 'cruiser', x: 0, y: 4, orientation: 'H' }, // (0,4) to (2,4)
      { type: 'submarine', x: 0, y: 6, orientation: 'H' }, // (0,6) to (2,6)
      { type: 'destroyer', x: 0, y: 8, orientation: 'H' }, // (0,8) to (1,8)
    ];
    game.setFleet(p1.playerId, aliceFleet);
    game.setPlayerReady(p1.playerId);

    // Give Bob valid fleet
    const bobFleet: Array<{ type: ShipType; x: number; y: number; orientation: 'H' | 'V' }> = [
      { type: 'carrier', x: 5, y: 0, orientation: 'V' }, // (5,0) to (5,4)
      { type: 'battleship', x: 7, y: 0, orientation: 'V' }, // (7,0) to (7,3)
      { type: 'cruiser', x: 9, y: 0, orientation: 'V' }, // (9,0) to (9,2)
      { type: 'submarine', x: 11, y: 0, orientation: 'V' }, // (11,0) to (11,2)
      { type: 'destroyer', x: 13, y: 0, orientation: 'V' }, // (13,0) to (13,1)
    ];
    game.setFleet(p2.playerId, bobFleet);
    game.setPlayerReady(p2.playerId);

    return { game, p1, p2 };
  }

  // 1. Valid horizontal placement
  it('1. validates horizontal ship placement correctly', () => {
    const coords = calculateShipCoordinates(0, 0, 5, 'H');
    expect(coords).toHaveLength(5);
    expect(coords[0]).toEqual({ x: 0, y: 0 });
    expect(coords[4]).toEqual({ x: 4, y: 0 });

    const result = validatePlacement('carrier', 0, 0, 'H', [], boardSize);
    expect(result.valid).toBe(true);
    expect(result.coordinates).toEqual(coords);
  });

  // 2. Valid vertical placement
  it('2. validates vertical ship placement correctly', () => {
    const coords = calculateShipCoordinates(3, 2, 4, 'V');
    expect(coords).toHaveLength(4);
    expect(coords[0]).toEqual({ x: 3, y: 2 });
    expect(coords[3]).toEqual({ x: 3, y: 5 });

    const result = validatePlacement('battleship', 3, 2, 'V', [], boardSize);
    expect(result.valid).toBe(true);
    expect(result.coordinates).toEqual(coords);
  });

  // 3. Out-of-bounds placement rejection
  it('3. rejects out-of-bounds ship placement', () => {
    // Carrier of length 5 at x=12, H would go to x=16 (out of 15x15 board)
    const result = validatePlacement('carrier', 12, 0, 'H', [], boardSize);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('extends outside the board');

    // Negative coordinates
    const negResult = validatePlacement('destroyer', -1, 5, 'H', [], boardSize);
    expect(negResult.valid).toBe(false);
  });

  // 4. Overlapping ship rejection
  it('4. rejects overlapping ship placement', () => {
    const existing: PlacedShip[] = [
      {
        id: 's1',
        type: 'destroyer',
        name: 'Destroyer',
        length: 2,
        x: 4,
        y: 4,
        orientation: 'H',
        coordinates: [
          { x: 4, y: 4 },
          { x: 5, y: 4 },
        ],
        hits: [],
        isSunk: false,
      },
    ];

    // Try placing Cruiser at (4, 3) vertical, occupying (4,3), (4,4), (4,5) -> overlaps (4,4)!
    const result = validatePlacement('cruiser', 4, 3, 'V', existing, boardSize);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('overlaps with an existing ship');
  });

  // 5. Random fleet placement validity
  it('5. generates complete, valid, non-overlapping random fleets', () => {
    for (let i = 0; i < 5; i++) {
      const fleet = generateRandomFleet(boardSize);
      expect(fleet).toHaveLength(5);

      const allCoords = fleet.flatMap((s) => s.coordinates);
      expect(allCoords).toHaveLength(17); // 5 + 4 + 3 + 3 + 2 = 17

      // No coordinate duplicates
      const coordSet = new Set(allCoords.map((c) => `${c.x},${c.y}`));
      expect(coordSet.size).toBe(17);

      // All within bounds
      allCoords.forEach((c) => {
        expect(isValidCoordinate(c, boardSize)).toBe(true);
      });
    }
  });

  // 6. Correct hit and miss outcomes
  it('6. resolves hit and miss outcomes accurately', () => {
    const { game, p1, p2 } = setupReadyGame();
    // Bob has carrier at (5, 0..4).
    // Ensure it is p1's turn
    game.currentTurnPlayerId = p1.playerId;

    // Shot at (5, 0) is a HIT
    const hitResult = game.attack(p1.playerId, { x: 5, y: 0 });
    expect(hitResult.success).toBe(true);
    expect(hitResult.resolution?.cells[0].status).toBe('hit');

    // Turn alternates to p2
    expect(game.currentTurnPlayerId).toBe(p2.playerId);

    // p2 shoots at (14, 14) which is water -> MISS
    const missResult = game.attack(p2.playerId, { x: 14, y: 14 });
    expect(missResult.success).toBe(true);
    expect(missResult.resolution?.cells[0].status).toBe('miss');
  });

  // 7. Repeated attack rejection
  it('7. rejects repeated attacks on the same cell', () => {
    const { game, p1, p2 } = setupReadyGame();
    game.currentTurnPlayerId = p1.playerId;

    // p1 attacks (0, 10)
    game.attack(p1.playerId, { x: 0, y: 10 });

    // p2 attacks (0, 10)
    game.attack(p2.playerId, { x: 0, y: 10 });

    // p1 tries to attack (0, 10) again
    const repeatResult = game.attack(p1.playerId, { x: 0, y: 10 });
    expect(repeatResult.success).toBe(false);
    expect(repeatResult.error).toContain('already been attacked');
  });

  // 8. Correct ship sinking detection
  it('8. detects ship sinking when all segments are hit', () => {
    const { game, p1, p2 } = setupReadyGame();
    // Bob's destroyer is at (13,0) and (13,1)
    game.currentTurnPlayerId = p1.playerId;
    const shot1 = game.attack(p1.playerId, { x: 13, y: 0 });
    expect(shot1.resolution?.sunkShips).toHaveLength(0);

    // p2 takes turn
    game.attack(p2.playerId, { x: 14, y: 14 });

    // p1 hits second segment of destroyer
    const shot2 = game.attack(p1.playerId, { x: 13, y: 1 });
    expect(shot2.resolution?.sunkShips).toHaveLength(1);
    expect(shot2.resolution?.sunkShips[0].type).toBe('destroyer');
    expect(shot2.resolution?.sunkShips[0].isSunk).toBe(true);
  });

  // 9. Victory detection
  it('9. detects victory when all enemy ships are destroyed', () => {
    const { game, p1, p2 } = setupReadyGame();
    // Manually mark all Bob's ships as sunk except last destroyer segment
    const bobShips = p2.combatState.ships;
    for (const ship of bobShips) {
      if (ship.type !== 'destroyer') {
        ship.isSunk = true;
        ship.hits = [...ship.coordinates];
      }
    }
    // Destroyer has 1 hit
    const destroyer = bobShips.find((s) => s.type === 'destroyer')!;
    destroyer.hits = [{ x: 13, y: 0 }];

    game.currentTurnPlayerId = p1.playerId;
    const finalShot = game.attack(p1.playerId, { x: 13, y: 1 });
    expect(finalShot.resolution?.isGameOver).toBe(true);
    expect(finalShot.resolution?.winnerId).toBe(p1.playerId);
    expect(game.phase).toBe('FINISHED');
  });

  // 10. Correct turn progression
  it('10. alternates turns correctly between players', () => {
    const { game, p1, p2 } = setupReadyGame();
    game.currentTurnPlayerId = p1.playerId;
    expect(game.currentTurnPlayerId).toBe(p1.playerId);

    game.attack(p1.playerId, { x: 0, y: 11 });
    expect(game.currentTurnPlayerId).toBe(p2.playerId);

    game.attack(p2.playerId, { x: 0, y: 11 });
    expect(game.currentTurnPlayerId).toBe(p1.playerId);
  });

  // 11. Coin deduction
  it('11. deducts coins correctly when executing power-ups', () => {
    const { game, p1 } = setupReadyGame();
    game.currentTurnPlayerId = p1.playerId;
    const initialCoins = p1.combatState.coins; // 100

    // Air defence costs 12
    const res = game.powerUp(p1.playerId, 'air_defence', { row: 3 });
    expect(res.success).toBe(true);
    expect(p1.combatState.coins).toBe(initialCoins - 12);
  });

  // 12. Reward idempotency
  it('12. ensures hits on already resolved cells do not award double rewards', () => {
    const { game, p1, p2 } = setupReadyGame();
    game.currentTurnPlayerId = p1.playerId;
    // p1 attacks (5, 0) -> hit
    const res1 = game.attack(p1.playerId, { x: 5, y: 0 });
    const coinsAfterHit1 = p1.combatState.coins;
    expect(res1.resolution?.coinsAwarded).toBe(GAME_CONFIG.REWARDS.HIT);

    // Second attack on same cell is rejected, no coins awarded
    game.currentTurnPlayerId = p1.playerId;
    const res2 = game.attack(p1.playerId, { x: 5, y: 0 });
    expect(res2.success).toBe(false);
    expect(p1.combatState.coins).toBe(coinsAfterHit1);
  });

  // 13. Insufficient-funds rejection
  it('13. rejects power-up when coins are insufficient', () => {
    const { game, p1 } = setupReadyGame();
    game.currentTurnPlayerId = p1.playerId;
    p1.combatState.coins = 5; // Less than carpet bomb (15)

    const res = game.powerUp(p1.playerId, 'carpet_bomb', { coord: { x: 5, y: 5 } });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Insufficient coins');
    expect(p1.combatState.coins).toBe(5); // Not deducted
  });

  // 14. Correct 3x3 target generation at board edges
  it('14. clamps 3x3 targets correctly at board corners and edges', () => {
    // Corner at (0, 0) should return 4 coordinates: (0,0), (1,0), (0,1), (1,1)
    const corner = getArea3x3Coordinates({ x: 0, y: 0 }, boardSize);
    expect(corner).toHaveLength(4);
    expect(corner).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);

    // Center cell (5, 5) should return full 9 coordinates
    const center = getArea3x3Coordinates({ x: 5, y: 5 }, boardSize);
    expect(center).toHaveLength(9);
  });

  // 15. Row airstrike targeting
  it('15. executes row airstrike across all coordinates of target row', () => {
    const { game, p1 } = setupReadyGame();
    game.currentTurnPlayerId = p1.playerId;

    const rowRes = game.powerUp(p1.playerId, 'row_airstrike', { row: 14 });
    expect(rowRes.success).toBe(true);
    expect(rowRes.resolution?.cells).toHaveLength(15);
  });

  // 16. Air-defence blocking
  it('16. intercepts and blocks enemy row airstrike with air defence', () => {
    const { game, p1, p2 } = setupReadyGame();
    // Bob sets up air defence on row 2 (cost 12)
    p2.combatState.activeDefences.add(2);

    // Alice uses row airstrike on row 2
    game.currentTurnPlayerId = p1.playerId;
    const strikeRes = game.powerUp(p1.playerId, 'row_airstrike', { row: 2 });
    expect(strikeRes.success).toBe(true);
    expect(strikeRes.resolution?.blockedByAirDefence).toBe(true);
    expect(strikeRes.resolution?.cells).toHaveLength(0); // No ship damage

    // Defender's air defence on row 2 is consumed
    expect(p2.combatState.activeDefences.has(2)).toBe(false);
  });

  // 17. Radar information filtering
  it('17. returns ship count without revealing specific coordinates in radar scan', () => {
    const { game, p1, p2 } = setupReadyGame();
    // Bob has carrier at (5, 0..4). A 3x3 scan at (5, 1) covers (4..6, 0..2)
    // which contains Bob's carrier segments at (5,0), (5,1), (5,2) -> exactly 3 ship cells!
    game.currentTurnPlayerId = p1.playerId;
    const radarRes = game.powerUp(p1.playerId, 'radar_scan', { coord: { x: 5, y: 1 } });
    expect(radarRes.success).toBe(true);
    expect(radarRes.resolution?.radarIntel).toBeDefined();
    expect(radarRes.resolution?.radarIntel?.shipCellsFound).toBe(3);
    // Does NOT return cell coordinate list
    expect(radarRes.resolution?.cells).toHaveLength(0);
  });

  // 18. Hidden enemy ship positions never being transmitted
  it('18. NEVER leaks un-hit enemy ship positions in filtered game state', () => {
    const { game, p1, p2 } = setupReadyGame();
    const aliceState = game.getFilteredGameState(p1.playerId);
    expect(aliceState).not.toBeNull();

    // Alice's view of Bob's board must only have 'empty' before any attacks
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        expect(aliceState!.opponent.board[y][x]).toBe('empty');
      }
    }

    // Alice's view has own ships
    expect(aliceState!.own.ships).toHaveLength(5);
  });

  // 19. Unauthorized player actions being rejected
  it("19. rejects attacks when it is not the player's turn", () => {
    const { game, p1, p2 } = setupReadyGame();
    game.currentTurnPlayerId = p1.playerId;

    // Bob tries to attack during Alice's turn
    const bobAttack = game.attack(p2.playerId, { x: 0, y: 0 });
    expect(bobAttack.success).toBe(false);
    expect(bobAttack.error).toContain("Not player's turn");
  });

  // 20. Reconnection restoring the correct seat and state
  it('20. preserves game state for reconnecting players', () => {
    const { game, p1 } = setupReadyGame();
    // Simulate disconnect
    p1.isConnected = false;

    // Reconnect with same playerId
    const player = game.getPlayer(p1.playerId);
    expect(player).toBeDefined();
    player!.isConnected = true;
    player!.socketId = 'new_socket_id';

    const restoredState = game.getFilteredGameState(p1.playerId);
    expect(restoredState).not.toBeNull();
    expect(restoredState?.own.player.playerId).toBe(p1.playerId);
    expect(restoredState?.own.player.isConnected).toBe(true);
  });

  // 21. Rematch resetting match-specific state
  it('21. resets fleet and coins to fresh starting balance on rematch', () => {
    const { game, p1, p2 } = setupReadyGame();
    p1.combatState.coins = 45;
    p2.combatState.coins = 20;

    game.resetForRematch();
    expect(game.phase).toBe('PLACING_SHIPS');
    expect(p1.combatState.coins).toBe(GAME_CONFIG.STARTING_COINS);
    expect(p2.combatState.coins).toBe(GAME_CONFIG.STARTING_COINS);
    expect(p1.isReady).toBe(false);
    expect(p2.isReady).toBe(false);
    expect(p1.combatState.ships).toHaveLength(0);
    expect(p2.combatState.ships).toHaveLength(0);
  });

  // 22. Finished matches rejecting additional attacks
  it('22. rejects any attacks once match is finished', () => {
    const { game, p1, p2 } = setupReadyGame();
    game.phase = 'FINISHED';
    game.winnerPlayerId = p1.playerId;

    const res = game.attack(p1.playerId, { x: 0, y: 0 });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Game is not in progress');
  });
});


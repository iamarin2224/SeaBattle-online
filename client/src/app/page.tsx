'use client';

import React, { useEffect, useRef, useState } from 'react';
import { soundManager } from '../lib/audio';
import { LocalAIEngine } from '../lib/bot';
import {
  clearSession,
  getSavedSession,
  getSocket,
  saveSession,
} from '../lib/socket';
import {
  AttackResolution,
  Coordinate,
  FilteredGameState,
  PlacedShip,
  PowerUpType,
  ShipType,
} from '../types/game';

// Components & Features
import { BattleScreen } from '../features/battle/BattleScreen';
import { CreateRoomModal } from '../features/lobby/CreateRoomModal';
import { JoinRoomModal } from '../features/lobby/JoinRoomModal';
import { MainMenu } from '../features/lobby/MainMenu';
import { WaitingRoom } from '../features/lobby/WaitingRoom';
import { PlacementScreen } from '../features/placement/PlacementScreen';
import { VictoryModal } from '../features/results/VictoryModal';

type AppScreen = 'MENU' | 'WAITING' | 'PLACEMENT' | 'BATTLE';

interface SocketResponse {
  success: boolean;
  roomCode?: string;
  playerToken?: string;
  playerId?: string;
  error?: string;
  ships?: PlacedShip[];
  resolution?: AttackResolution;
}

export default function GamePage() {
  const [screen, setScreen] = useState<AppScreen>('MENU');
  const [displayName, setDisplayName] = useState<string>('Commander');
  const [roomCode, setRoomCode] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [mode, setMode] = useState<'classic' | 'advanced'>('advanced');
  const [boardSize, setBoardSize] = useState<number>(15);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [urlRoomCode, setUrlRoomCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Game & Combat State
  const [gameState, setGameState] = useState<FilteredGameState | null>(null);
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [opponentReady, setOpponentReady] = useState<boolean>(false);
  const [hasRequestedRematch, setHasRequestedRematch] = useState<boolean>(false);
  const [rematchRequestedByOpponent, setRematchRequestedByOpponent] = useState<boolean>(false);

  // Solo AI Engine
  const aiEngineRef = useRef<LocalAIEngine | null>(null);
  const [isVsAI, setIsVsAI] = useState<boolean>(false);

  // On mount: restore session, check URL query param, init audio state
  useEffect(() => {
    setIsMuted(soundManager.getMuted());

    const saved = getSavedSession();
    if (saved.displayName) {
      setDisplayName(saved.displayName);
    }

    // Check URL search parameters (e.g., ?room=K7PX4Q)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setUrlRoomCode(roomParam.toUpperCase());
      setShowJoinModal(true);
    } else if (saved.roomCode && saved.token) {
      // Attempt auto-reconnect
      attemptReconnect(saved.roomCode, saved.token, saved.displayName || 'Commander');
    }
  }, []);

  // Socket.IO event listeners
  useEffect(() => {
    const socket = getSocket();

    const handleRoomState = (state: FilteredGameState) => {
      setGameState(state);
      setBoardSize(state.boardSize);
      setMode(state.mode);

      // Screen routing based on phase
      if (state.phase === 'WAITING_FOR_PLAYERS') {
        setScreen('WAITING');
      } else if (state.phase === 'PLACING_SHIPS' || state.phase === 'READY_CHECK') {
        setScreen('PLACEMENT');
        setIsReady(state.own.player.isReady);
        setOpponentReady(state.opponent.player.isReady);
        if (state.own.ships.length > 0) {
          setPlacedShips(state.own.ships);
        }
      } else if (state.phase === 'IN_PROGRESS' || state.phase === 'FINISHED') {
        setScreen('BATTLE');
      }
    };

    const handleOpponentJoined = () => {
      soundManager.playPencil();
      // When opponent joins waiting room, server advances to PLACING_SHIPS
    };

    const handleMatchStarted = () => {
      soundManager.playVictory();
      setScreen('BATTLE');
    };

    const handleActionResolved = (res: AttackResolution) => {
      if (res.blockedByAirDefence) {
        soundManager.playPencil();
      } else if (res.sunkShips.length > 0) {
        soundManager.playSunk();
      } else if (res.radarIntel) {
        soundManager.playRadar();
      } else if (res.cells.some((c) => c.status === 'hit')) {
        soundManager.playHit();
      } else {
        soundManager.playSplash();
      }
    };

    const handleRematchRequested = (data: { byPlayerId: string }) => {
      if (data.byPlayerId !== playerId) {
        setRematchRequestedByOpponent(true);
        soundManager.playPencil();
      }
    };

    const handleRematchStarted = () => {
      soundManager.playVictory();
      setHasRequestedRematch(false);
      setRematchRequestedByOpponent(false);
      setIsReady(false);
      setOpponentReady(false);
      setPlacedShips([]);
      setScreen('PLACEMENT');
    };

    const handlePlayerLeft = () => {
      setErrorToast('Opponent left the match.');
    };

    socket.on('room-state', handleRoomState);
    socket.on('opponent-joined', handleOpponentJoined);
    socket.on('match-started', handleMatchStarted);
    socket.on('action-resolved', handleActionResolved);
    socket.on('rematch-requested', handleRematchRequested);
    socket.on('rematch-started', handleRematchStarted);
    socket.on('player-left', handlePlayerLeft);

    return () => {
      socket.off('room-state', handleRoomState);
      socket.off('opponent-joined', handleOpponentJoined);
      socket.off('match-started', handleMatchStarted);
      socket.off('action-resolved', handleActionResolved);
      socket.off('rematch-requested', handleRematchRequested);
      socket.off('rematch-started', handleRematchStarted);
      socket.off('player-left', handlePlayerLeft);
    };
  }, [playerId]);

  const attemptReconnect = (code: string, token: string, name: string) => {
    const socket = getSocket();
    setIsLoading(true);
    socket.emit('join-room', { roomCode: code, displayName: name, playerToken: token }, (res: SocketResponse) => {
      setIsLoading(false);
      if (res.success && res.roomCode && res.playerId && res.playerToken) {
        setRoomCode(res.roomCode);
        setPlayerId(res.playerId);
        saveSession(res.roomCode, res.playerToken, res.playerId, name);
      } else {
        clearSession();
      }
    });
  };

  // 1. Create Room
  const handleCreateRoom = (name: string, selectedMode: 'classic' | 'advanced', size: number) => {
    setIsLoading(true);
    setDisplayName(name);
    setIsVsAI(false);

    const socket = getSocket();
    socket.emit(
      'create-room',
      { displayName: name, mode: selectedMode, boardSize: size },
      (res: SocketResponse) => {
        setIsLoading(false);
        if (res.success && res.roomCode && res.playerToken && res.playerId) {
          setRoomCode(res.roomCode);
          setPlayerId(res.playerId);
          setMode(selectedMode);
          setBoardSize(size);
          saveSession(res.roomCode, res.playerToken, res.playerId, name);
          setShowCreateModal(false);
          setScreen('WAITING');
        } else {
          setErrorToast(res.error || 'Failed to create room');
        }
      }
    );
  };

  // 2. Join Room
  const handleJoinRoom = (code: string, name: string) => {
    setIsLoading(true);
    setDisplayName(name);
    setIsVsAI(false);

    const socket = getSocket();
    socket.emit('join-room', { roomCode: code, displayName: name }, (res: SocketResponse) => {
      setIsLoading(false);
      if (res.success && res.roomCode && res.playerToken && res.playerId) {
        setRoomCode(res.roomCode);
        setPlayerId(res.playerId);
        saveSession(res.roomCode, res.playerToken, res.playerId, name);
        setShowJoinModal(false);
      } else {
        setErrorToast(res.error || 'Failed to join room');
      }
    });
  };

  // 3. Start Versus AI Mode
  const handleStartVersusAI = () => {
    setIsVsAI(true);
    setRoomCode('SOLO-AI');
    setPlayerId('player');
    const engine = new LocalAIEngine(boardSize, mode);
    aiEngineRef.current = engine;
    setPlacedShips([]);
    setIsReady(false);
    setOpponentReady(false);
    setScreen('PLACEMENT');
  };

  // 4. Ship Placement Actions
  const handlePlaceShip = (ship: PlacedShip) => {
    // Replace if ship of same type already placed
    const updated = placedShips.filter((s) => s.type !== ship.type);
    updated.push(ship);
    setPlacedShips(updated);
  };

  const handleRemoveShip = (shipId: string) => {
    setPlacedShips((prev) => prev.filter((s) => s.id !== shipId));
  };

  const handleRandomizeFleet = () => {
    if (isVsAI) {
      // Local randomizer
      const tempEngine = new LocalAIEngine(boardSize, mode);
      setPlacedShips((tempEngine as unknown as { botShips: PlacedShip[] }).botShips);
    } else {
      const socket = getSocket();
      socket.emit('randomize-fleet', (res: SocketResponse) => {
        if (res.success && res.ships) {
          setPlacedShips(res.ships);
        } else {
          setErrorToast(res.error || 'Randomization failed');
        }
      });
    }
  };

  const handleResetFleet = () => {
    setPlacedShips([]);
  };

  const handleConfirmReady = () => {
    if (placedShips.length < 5) return;

    if (isVsAI) {
      if (!aiEngineRef.current) return;
      aiEngineRef.current.setPlayerShips(placedShips);
      setIsReady(true);
      setOpponentReady(true);
      setGameState(aiEngineRef.current.getGameState());
      soundManager.playVictory();
      setScreen('BATTLE');
    } else {
      const socket = getSocket();
      const shipsData = placedShips.map((s) => ({
        type: s.type,
        x: s.x,
        y: s.y,
        orientation: s.orientation,
      }));

      socket.emit('place-ships', { ships: shipsData }, (res: SocketResponse) => {
        if (!res.success) {
          setErrorToast(res.error || 'Failed to place ships');
          return;
        }

        socket.emit('player-ready', (readyRes: SocketResponse) => {
          if (readyRes.success) {
            setIsReady(true);
          } else {
            setErrorToast(readyRes.error || 'Failed to confirm readiness');
          }
        });
      });
    }
  };

  // 5. Combat Actions
  const handleAttack = (coord: Coordinate) => {
    if (isVsAI) {
      if (!aiEngineRef.current) return;
      const res = aiEngineRef.current.playerAttack(coord);
      setGameState(aiEngineRef.current.getGameState());

      // Sound feedback
      if (res.sunkShips.length > 0) {
        soundManager.playSunk();
      } else if (res.cells[0]?.status === 'hit') {
        soundManager.playHit();
      } else {
        soundManager.playSplash();
      }

      // If game not over, let AI respond after brief natural delay
      if (!res.isGameOver) {
        setTimeout(() => {
          if (!aiEngineRef.current) return;
          const botRes = aiEngineRef.current.botTakeTurn();
          setGameState(aiEngineRef.current.getGameState());

          if (botRes.sunkShips.length > 0) {
            soundManager.playSunk();
          } else if (botRes.cells[0]?.status === 'hit') {
            soundManager.playHit();
          } else {
            soundManager.playSplash();
          }
        }, 800);
      }
    } else {
      const socket = getSocket();
      socket.emit('standard-attack', { x: coord.x, y: coord.y }, (res: SocketResponse) => {
        if (!res.success) {
          setErrorToast(res.error || 'Attack rejected');
        }
      });
    }
  };

  const handleExecutePowerUp = (
    powerUp: PowerUpType,
    target: { coord?: Coordinate; row?: number }
  ) => {
    if (isVsAI) {
      setErrorToast('Power-ups are available in online multiplayer mode');
      return;
    }

    const socket = getSocket();
    socket.emit('execute-power-up', { powerUp, target }, (res: SocketResponse) => {
      if (!res.success) {
        setErrorToast(res.error || 'Power-up action rejected');
      }
    });
  };

  // 6. Rematch & Return to Lobby
  const handleRequestRematch = () => {
    setHasRequestedRematch(true);
    soundManager.playPencil();

    if (isVsAI) {
      handleStartVersusAI();
    } else {
      const socket = getSocket();
      socket.emit('request-rematch', (res: SocketResponse) => {
        if (!res.success) {
          setErrorToast(res.error || 'Rematch request failed');
        }
      });
    }
  };

  const handleLeaveRoom = () => {
    soundManager.playPencil();
    if (!isVsAI) {
      const socket = getSocket();
      socket.emit('leave-room', () => {});
    }
    clearSession();
    setScreen('MENU');
    setGameState(null);
    setPlacedShips([]);
    setIsReady(false);
    setOpponentReady(false);
    setHasRequestedRematch(false);
    setRematchRequestedByOpponent(false);
  };

  const handleToggleMute = () => {
    const newMuted = soundManager.toggleMute();
    setIsMuted(newMuted);
  };

  return (
    <main className="min-h-screen py-4 px-2 sm:px-6 relative flex flex-col justify-between">
      {/* Error Toast */}
      {errorToast && (
        <div className="fixed top-4 right-4 z-50 bg-[#FFF0F0] border-2 border-[#C73538] text-[#C73538] text-xs font-bold p-3 rounded shadow-lg max-w-sm flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <span>{errorToast}</span>
          <button
            type="button"
            onClick={() => setErrorToast(null)}
            className="text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Screen Router */}
      {screen === 'MENU' && (
        <MainMenu
          displayName={displayName}
          onUpdateDisplayName={(name) => {
            setDisplayName(name);
            localStorage.setItem('sea_battle_display_name', name);
          }}
          onOpenCreateRoom={() => setShowCreateModal(true)}
          onOpenJoinRoom={() => setShowJoinModal(true)}
          onStartVersusAI={handleStartVersusAI}
          mode={mode}
          onToggleMode={() => setMode((prev) => (prev === 'advanced' ? 'classic' : 'advanced'))}
          boardSize={boardSize}
          onUpdateBoardSize={setBoardSize}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {screen === 'WAITING' && (
        <WaitingRoom
          roomCode={roomCode}
          hostName={displayName}
          opponentName={gameState?.opponent.player.displayName}
          mode={mode}
          boardSize={boardSize}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {screen === 'PLACEMENT' && (
        <PlacementScreen
          boardSize={boardSize}
          placedShips={placedShips}
          onPlaceShip={handlePlaceShip}
          onRemoveShip={handleRemoveShip}
          onRandomizeFleet={handleRandomizeFleet}
          onResetFleet={handleResetFleet}
          onConfirmReady={handleConfirmReady}
          isReady={isReady}
          opponentReady={opponentReady}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {screen === 'BATTLE' && gameState && (
        <BattleScreen
          gameState={gameState}
          myPlayerId={playerId}
          onAttack={handleAttack}
          onExecutePowerUp={handleExecutePowerUp}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* Victory / Defeat Modal */}
      {screen === 'BATTLE' && gameState && gameState.phase === 'FINISHED' && (
        <VictoryModal
          isWinner={gameState.winnerPlayerId === playerId}
          winnerName={
            gameState.winnerPlayerId === playerId
              ? gameState.own.player.displayName
              : gameState.opponent.player.displayName
          }
          stats={gameState.own.player.stats}
          rematchRequestedByOpponent={rematchRequestedByOpponent}
          hasRequestedRematch={hasRequestedRematch}
          onRequestRematch={handleRequestRematch}
          onReturnToLobby={handleLeaveRoom}
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal
          initialDisplayName={displayName}
          defaultMode={mode}
          defaultBoardSize={boardSize}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
          isLoading={isLoading}
        />
      )}

      {showJoinModal && (
        <JoinRoomModal
          initialDisplayName={displayName}
          initialRoomCode={urlRoomCode}
          onClose={() => setShowJoinModal(false)}
          onJoin={handleJoinRoom}
          isLoading={isLoading}
        />
      )}
    </main>
  );
}

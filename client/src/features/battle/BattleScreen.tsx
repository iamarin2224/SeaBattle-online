'use client';

import React, { useState } from 'react';
import { BattleshipGrid } from '../../components/board/BattleshipGrid';
import { PlayerBadge } from '../../components/ui/PlayerBadge';
import { soundManager } from '../../lib/audio';
import {
  AttackResolution,
  Coordinate,
  FilteredGameState,
  PowerUpType,
} from '../../types/game';
import { ArsenalPanel } from '../arsenal/ArsenalPanel';
import { TurnBanner } from './TurnBanner';
import { Crosshair, Shield } from 'lucide-react';

interface BattleScreenProps {
  gameState: FilteredGameState;
  myPlayerId: string;
  onAttack: (coord: Coordinate) => void;
  onExecutePowerUp: (powerUp: PowerUpType, target: { coord?: Coordinate; row?: number }) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onLeaveRoom: () => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  gameState,
  myPlayerId,
  onAttack,
  onExecutePowerUp,
  isMuted,
  onToggleMute,
  onLeaveRoom,
}) => {
  const [mobileTab, setMobileTab] = useState<'own' | 'enemy'>('enemy');
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [hoverCoord, setHoverCoord] = useState<Coordinate | null>(null);
  const [selectedCoord, setSelectedCoord] = useState<Coordinate | null>(null);

  const isMyTurn = gameState.currentTurnPlayerId === myPlayerId;
  const isAdvancedMode = gameState.mode === 'advanced';

  const handleCellClick = (coord: Coordinate, isEnemy: boolean) => {
    if (!isMyTurn) return;

    // 1. Power-up execution
    if (activePowerUp) {
      if (activePowerUp === 'air_defence') {
        if (!isEnemy) {
          // Deployed on own board
          soundManager.playPencil();
          onExecutePowerUp('air_defence', { row: coord.y });
          setActivePowerUp(null);
        }
        return;
      }

      if (isEnemy) {
        soundManager.playPencil();
        if (activePowerUp === 'carpet_bomb' || activePowerUp === 'radar_scan' || activePowerUp === 'precision_strike') {
          onExecutePowerUp(activePowerUp, { coord });
          setActivePowerUp(null);
        } else if (activePowerUp === 'row_airstrike') {
          onExecutePowerUp('row_airstrike', { row: coord.y });
          setActivePowerUp(null);
        }
      }
      return;
    }

    // 2. Standard attack on enemy board
    if (isEnemy) {
      const cellState = gameState.opponent.board[coord.y]?.[coord.x] || 'empty';
      if (cellState !== 'empty') {
        // Already attacked
        return;
      }
      setSelectedCoord(coord);
      onAttack(coord);
    }
  };

  const handleRowClick = (row: number, isEnemy: boolean) => {
    if (!isMyTurn) return;
    if (activePowerUp === 'row_airstrike' && isEnemy) {
      soundManager.playPencil();
      onExecutePowerUp('row_airstrike', { row });
      setActivePowerUp(null);
    } else if (activePowerUp === 'air_defence' && !isEnemy) {
      soundManager.playPencil();
      onExecutePowerUp('air_defence', { row });
      setActivePowerUp(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 p-2 sm:p-4">
      {/* Top Header: Player Badges, Turn Banner & Leave */}
      <div className="flex flex-col gap-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Own Badge */}
          <PlayerBadge
            displayName={gameState.own.player.displayName}
            coins={gameState.own.player.coins}
            isConnected={gameState.own.player.isConnected}
            isHost={gameState.own.player.isHost}
          />

          <div
            className="text-xs sm:text-sm font-bold text-[#302A78] tracking-widest uppercase hidden md:block"
            style={{ fontFamily: "'Special Elite', cursive, serif" }}
          >
            NAVAL CONFRONTATION • {gameState.boardSize}x{gameState.boardSize}
          </div>

          {/* Opponent Badge */}
          <PlayerBadge
            displayName={gameState.opponent.player.displayName}
            coins={gameState.opponent.player.coins}
            isConnected={gameState.opponent.player.isConnected}
            isHost={gameState.opponent.player.isHost}
          />
        </div>

        {/* Turn Banner with Audio Toggle & Feedback */}
        <TurnBanner
          isMyTurn={isMyTurn}
          turnNumber={gameState.turnNumber}
          lastAction={gameState.lastAction}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
        />
      </div>

      {/* Mobile Board Switcher Tabs */}
      <div className="flex sm:hidden grid-cols-2 gap-2 border-2 border-[#302A78] p-1 rounded bg-[#FFFCF4]">
        <button
          type="button"
          onClick={() => {
            soundManager.playPencil();
            setMobileTab('own');
          }}
          className={`flex-1 py-1.5 text-xs font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'own'
              ? 'bg-[#302A78] text-white shadow-sm'
              : 'text-[#585098] hover:bg-[#EEF4FB]'
          }`}
          style={{ fontFamily: "'Special Elite', cursive, serif" }}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>My Fleet</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playPencil();
            setMobileTab('enemy');
          }}
          className={`flex-1 py-1.5 text-xs font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'enemy'
              ? 'bg-[#C73538] text-white shadow-sm'
              : 'text-[#585098] hover:bg-[#EEF4FB]'
          }`}
          style={{ fontFamily: "'Special Elite', cursive, serif" }}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Enemy Waters</span>
        </button>
      </div>

      {/* Main Battle Area: Grids & Arsenal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Board: MY FLEET */}
        <div
          className={`lg:col-span-5 flex flex-col gap-2 ${
            mobileTab === 'own' ? 'block' : 'hidden sm:block'
          }`}
        >
          <div className="flex items-center justify-between px-2">
            <h3
              className="text-base font-bold text-[#302A78] tracking-wider uppercase flex items-center gap-2"
              style={{ fontFamily: "'Special Elite', cursive, serif" }}
            >
              <Shield className="w-4 h-4 text-[#3B7550]" />
              MY FLEET (DEFENSE)
            </h3>
            <span className="text-xs text-[#585098] font-mono">
              {gameState.own.ships.filter((s) => !s.isSunk).length} / {gameState.own.ships.length} ships afloat
            </span>
          </div>

          <BattleshipGrid
            boardSize={gameState.boardSize}
            boardState={gameState.own.board}
            ships={gameState.own.ships}
            activeDefences={gameState.own.activeDefences}
            isInteractive={activePowerUp === 'air_defence'}
            onCellClick={(coord) => handleCellClick(coord, false)}
            onRowClick={(row) => handleRowClick(row, false)}
            onCellHover={activePowerUp === 'air_defence' ? setHoverCoord : undefined}
            hoverCoord={activePowerUp === 'air_defence' ? hoverCoord : null}
            activePowerUp={activePowerUp}
          />
        </div>

        {/* Center / Right: ENEMY WATERS */}
        <div
          className={`lg:col-span-5 flex flex-col gap-2 ${
            mobileTab === 'enemy' ? 'block' : 'hidden sm:block'
          }`}
        >
          <div className="flex items-center justify-between px-2">
            <h3
              className="text-base font-bold text-[#C73538] tracking-wider uppercase flex items-center gap-2"
              style={{ fontFamily: "'Special Elite', cursive, serif" }}
            >
              <Crosshair className="w-4 h-4 text-[#C73538]" />
              ENEMY WATERS (TARGETING)
            </h3>
            <span className="text-xs text-[#585098] font-mono">
              {gameState.opponent.sunkShips.length} enemy sunk
            </span>
          </div>

          <BattleshipGrid
            boardSize={gameState.boardSize}
            boardState={gameState.opponent.board}
            ships={gameState.opponent.sunkShips}
            radarScans={gameState.radarHistory}
            isInteractive={isMyTurn}
            isEnemyBoard={true}
            onCellClick={(coord) => handleCellClick(coord, true)}
            onRowClick={(row) => handleRowClick(row, true)}
            onCellHover={isMyTurn ? setHoverCoord : undefined}
            hoverCoord={isMyTurn ? hoverCoord : null}
            selectedCoord={selectedCoord}
            activePowerUp={activePowerUp}
          />
        </div>

        {/* Tactical Arsenal Column (or below on smaller screens) */}
        {isAdvancedMode && (
          <div className="lg:col-span-2 flex flex-col gap-3">
            <ArsenalPanel
              coins={gameState.own.player.coins}
              inventory={gameState.own.player.inventory}
              activePowerUp={activePowerUp}
              onSelectPowerUp={(powerUp) => {
                soundManager.playPencil();
                setActivePowerUp(powerUp);
              }}
              isMyTurn={isMyTurn}
            />
          </div>
        )}
      </div>

      {/* Disconnection Banner if Opponent Disconnected */}
      {!gameState.opponent.player.isConnected && (
        <div className="p-3 bg-[#FFF0F0] border-2 border-[#C73538] text-[#C73538] rounded-sm text-center text-xs font-bold animate-pulse">
          ⚠️ Opponent disconnected! Awaiting reconnection (grace period: 60s)...
        </div>
      )}
    </div>
  );
};


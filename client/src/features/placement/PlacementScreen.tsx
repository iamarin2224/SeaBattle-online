'use client';

import React, { useEffect, useState } from 'react';
import { BattleshipGrid } from '../../components/board/BattleshipGrid';
import { FLEET_CONFIG } from '../../lib/constants';
import { soundManager } from '../../lib/audio';
import {
  CellState,
  Coordinate,
  PlacedShip,
  ShipOrientation,
  ShipType,
} from '../../types/game';
import { ShipInventory } from './ShipInventory';

interface PlacementScreenProps {
  boardSize: number;
  placedShips: PlacedShip[];
  onPlaceShip: (ship: PlacedShip) => void;
  onRemoveShip: (shipId: string) => void;
  onRandomizeFleet: () => void;
  onResetFleet: () => void;
  onConfirmReady: () => void;
  isReady: boolean;
  opponentReady: boolean;
  onLeaveRoom: () => void;
}

export const PlacementScreen: React.FC<PlacementScreenProps> = ({
  boardSize,
  placedShips,
  onPlaceShip,
  onRemoveShip,
  onRandomizeFleet,
  onResetFleet,
  onConfirmReady,
  isReady,
  opponentReady,
  onLeaveRoom,
}) => {
  const [selectedShipType, setSelectedShipType] = useState<ShipType | null>('carrier');
  const [orientation, setOrientation] = useState<ShipOrientation>('H');
  const [hoverCoord, setHoverCoord] = useState<Coordinate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keyboard shortcut: 'R' rotates ship
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        soundManager.playPencil();
        setOrientation((prev) => (prev === 'H' ? 'V' : 'H'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedConfig = FLEET_CONFIG.find((s) => s.type === selectedShipType);

  // Calculate validity of current placement preview
  const isPreviewValid = Boolean(
    selectedConfig &&
      hoverCoord &&
      (() => {
        const length = selectedConfig.length;
        const coords: Coordinate[] = [];
        for (let i = 0; i < length; i++) {
          const x = orientation === 'H' ? hoverCoord.x + i : hoverCoord.x;
          const y = orientation === 'V' ? hoverCoord.y + i : hoverCoord.y;
          if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
            return false;
          }
          coords.push({ x, y });
        }

        // Check overlap with OTHER placed ships (excluding current ship type if re-placing)
        for (const ship of placedShips) {
          if (ship.type === selectedConfig.type) continue;
          for (const c of ship.coordinates) {
            if (coords.some((nc) => nc.x === c.x && nc.y === c.y)) {
              return false;
            }
          }
        }
        return true;
      })()
  );

  const handleCellClick = (coord: Coordinate) => {
    if (isReady || !selectedConfig) return;

    if (!isPreviewValid) {
      soundManager.playPencil();
      setErrorMessage('Cannot place ship here: out of bounds or overlapping another vessel');
      return;
    }

    setErrorMessage(null);
    soundManager.playSplash();

    // Calculate occupied coordinates
    const coordinates: Coordinate[] = [];
    for (let i = 0; i < selectedConfig.length; i++) {
      coordinates.push({
        x: orientation === 'H' ? coord.x + i : coord.x,
        y: orientation === 'V' ? coord.y + i : coord.y,
      });
    }

    const newShip: PlacedShip = {
      id: `ship_${selectedConfig.type}_${Date.now()}`,
      type: selectedConfig.type,
      name: selectedConfig.name,
      length: selectedConfig.length,
      x: coord.x,
      y: coord.y,
      orientation,
      coordinates,
      hits: [],
      isSunk: false,
    };

    onPlaceShip(newShip);

    // Automatically select the next unplaced ship
    const remaining = FLEET_CONFIG.find(
      (s) => s.type !== selectedConfig.type && !placedShips.some((p) => p.type === s.type)
    );
    if (remaining) {
      setSelectedShipType(remaining.type);
    }
  };

  // Build empty board grid state
  const boardMatrix: CellState[][] = Array.from({ length: boardSize }, () =>
    Array(boardSize).fill('empty')
  );

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 p-2 sm:p-4">
      {/* Header Banner */}
      <div className="text-center p-3 sm:p-4 bg-[#FFFCF4] border-2 border-[#302A78] rounded-sm shadow-[3px_4px_0px_rgba(48,42,120,0.2)]">
        <h2
          className="text-xl sm:text-2xl font-black text-[#302A78] tracking-wider uppercase"
          style={{ fontFamily: "'Special Elite', cursive, serif" }}
        >
          STRATEGIC FLEET DEPLOYMENT
        </h2>
        <p className="text-xs text-[#585098] mt-1 font-mono">
          Secretly position your 5 naval vessels. Press{' '}
          <kbd className="bg-[#302A78] text-white px-1.5 py-0.5 rounded text-[11px]">R</kbd> to
          rotate.
        </p>
      </div>

      {/* Opponent Readiness Toast */}
      {opponentReady && (
        <div className="bg-[#E8F5E9] border-2 border-[#81C784] text-[#2E5B3E] p-2.5 rounded text-center text-xs font-bold animate-pulse">
          ⚓ Opponent has deployed their fleet and is ready for combat!
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-[#FFF0F0] border-2 border-[#C73538] text-[#C73538] p-2 rounded text-center text-xs font-bold">
          {errorMessage}
        </div>
      )}

      {/* Main Placement Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Board Grid */}
        <div className="md:col-span-7 flex flex-col items-center">
          <BattleshipGrid
            boardSize={boardSize}
            boardState={boardMatrix}
            ships={placedShips}
            isInteractive={!isReady}
            onCellClick={handleCellClick}
            onCellHover={setHoverCoord}
            hoverCoord={hoverCoord}
            placementPreview={
              selectedConfig && hoverCoord
                ? {
                    type: selectedConfig.type,
                    length: selectedConfig.length,
                    orientation,
                    isValid: isPreviewValid,
                  }
                : null
            }
          />
        </div>

        {/* Inventory & Actions */}
        <div className="md:col-span-5">
          <ShipInventory
            placedShips={placedShips}
            selectedShipType={selectedShipType}
            onSelectShip={(type) => {
              soundManager.playPencil();
              setSelectedShipType(type);
            }}
            orientation={orientation}
            onToggleOrientation={() => {
              soundManager.playPencil();
              setOrientation((prev) => (prev === 'H' ? 'V' : 'H'));
            }}
            onRandomize={() => {
              soundManager.playPencil();
              onRandomizeFleet();
            }}
            onReset={() => {
              soundManager.playPencil();
              onResetFleet();
            }}
            onConfirmReady={() => {
              soundManager.playPencil();
              onConfirmReady();
            }}
            isReady={isReady}
          />
        </div>
      </div>
    </div>
  );
};


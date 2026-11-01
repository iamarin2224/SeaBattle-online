'use client';

import React, { useMemo } from 'react';
import { ROW_LABELS } from '../../lib/constants';
import {
  CellState,
  Coordinate,
  PlacedShip,
  PowerUpType,
  RadarScanResult,
  ShipOrientation,
  ShipType,
} from '../../types/game';
import { HitCrossIcon, WaterSplashIcon } from '../illustrations/NauticalDecorations';
import { ShipIllustration } from '../illustrations/ShipIllustrations';

interface BattleshipGridProps {
  boardSize: number;
  boardState: CellState[][]; // [y][x]
  ships?: PlacedShip[]; // Placed or revealed sunk ships
  activeDefences?: number[]; // Active air defence row indices
  radarScans?: RadarScanResult[]; // Completed radar scans
  isInteractive?: boolean;
  onCellClick?: (coord: Coordinate) => void;
  onCellHover?: (coord: Coordinate | null) => void;
  hoverCoord?: Coordinate | null;
  selectedCoord?: Coordinate | null;
  
  // Power-up targeting preview
  activePowerUp?: PowerUpType | null;
  targetingRow?: number | null;
  onRowClick?: (row: number) => void;

  // Placement mode preview
  placementPreview?: {
    type: ShipType;
    length: number;
    orientation: ShipOrientation;
    isValid: boolean;
  } | null;

  isEnemyBoard?: boolean;
}

export const BattleshipGrid: React.FC<BattleshipGridProps> = ({
  boardSize,
  boardState,
  ships = [],
  activeDefences = [],
  radarScans = [],
  isInteractive = false,
  onCellClick,
  onCellHover,
  hoverCoord = null,
  selectedCoord = null,
  activePowerUp = null,
  targetingRow = null,
  onRowClick,
  placementPreview = null,
  isEnemyBoard = false,
}) => {
  const rowLabels = ROW_LABELS.slice(0, boardSize);
  const colLabels = useMemo(() => Array.from({ length: boardSize }, (_, i) => i + 1), [boardSize]);

  // Map of origin coordinates to ship for rendering continuous SVG vessels
  const shipOriginMap = useMemo(() => {
    const map = new Map<string, PlacedShip>();
    for (const ship of ships) {
      map.set(`${ship.x},${ship.y}`, ship);
    }
    return map;
  }, [ships]);

  // Set of occupied ship coordinates
  const occupiedSet = useMemo(() => {
    const set = new Set<string>();
    for (const ship of ships) {
      for (const c of ship.coordinates) {
        set.add(`${c.x},${c.y}`);
      }
    }
    return set;
  }, [ships]);

  // Calculate 3x3 power-up or radar affected coordinates
  const affectedCells = useMemo(() => {
    const set = new Set<string>();
    if (!hoverCoord) return set;

    if (activePowerUp === 'carpet_bomb' || activePowerUp === 'radar_scan') {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = hoverCoord.x + dx;
          const y = hoverCoord.y + dy;
          if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
            set.add(`${x},${y}`);
          }
        }
      }
    } else if (activePowerUp === 'row_airstrike' && hoverCoord) {
      for (let x = 0; x < boardSize; x++) {
        set.add(`${x},${hoverCoord.y}`);
      }
    } else if (activePowerUp === 'air_defence' && hoverCoord) {
      for (let x = 0; x < boardSize; x++) {
        set.add(`${x},${hoverCoord.y}`);
      }
    }
    return set;
  }, [hoverCoord, activePowerUp, boardSize]);

  // Calculate placement preview cells
  const placementCells = useMemo(() => {
    const set = new Set<string>();
    if (!placementPreview || !hoverCoord) return set;

    for (let i = 0; i < placementPreview.length; i++) {
      const x = placementPreview.orientation === 'H' ? hoverCoord.x + i : hoverCoord.x;
      const y = placementPreview.orientation === 'V' ? hoverCoord.y + i : hoverCoord.y;
      if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
        set.add(`${x},${y}`);
      }
    }
    return set;
  }, [placementPreview, hoverCoord, boardSize]);

  return (
    <div className="relative select-none p-1 sm:p-2 bg-[#FFFDF7] rounded-sm border-2 border-[#302A78] shadow-[4px_5px_0px_rgba(48,42,120,0.25)]">
      {/* Outer border & graph paper inner wrapper */}
      <div className="relative">
        {/* Column Headers (1 .. 15) */}
        <div
          className="grid gap-0 mb-1"
          style={{
            gridTemplateColumns: `28px repeat(${boardSize}, minmax(0, 1fr))`,
          }}
        >
          {/* Top-left corner spacer */}
          <div className="h-6 flex items-center justify-center font-bold text-[#6860A5] text-xs">
            ⚓
          </div>
          {colLabels.map((col) => (
            <div
              key={`col-${col}`}
              className="h-6 flex items-center justify-center font-bold text-[#302A78] text-[10px] sm:text-xs"
              style={{ fontFamily: "'Special Elite', cursive, serif" }}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Grid Body with Row Headers */}
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: `28px repeat(${boardSize}, minmax(0, 1fr))`,
          }}
        >
          {rowLabels.map((rowLabel, rowIndex) => (
            <React.Fragment key={`row-wrap-${rowLabel}`}>
              {/* Row Header (A .. O) */}
              <button
                type="button"
                onClick={() => onRowClick && onRowClick(rowIndex)}
                disabled={!isInteractive || (activePowerUp !== 'row_airstrike' && activePowerUp !== 'air_defence')}
                className={`h-full min-h-[22px] sm:min-h-[28px] flex items-center justify-center font-bold text-xs sm:text-sm transition-colors ${
                  activeDefences.includes(rowIndex)
                    ? 'bg-[#C73538] text-white rounded-l-sm'
                    : targetingRow === rowIndex
                    ? 'bg-[#E05054] text-white rounded-l-sm'
                    : 'text-[#302A78] hover:text-[#C73538]'
                }`}
                style={{ fontFamily: "'Special Elite', cursive, serif" }}
                title={`Row ${rowLabel}${activeDefences.includes(rowIndex) ? ' (Air Defence Active)' : ''}`}
              >
                {rowLabel}
              </button>

              {/* Row Cells */}
              {Array.from({ length: boardSize }, (_, colIndex) => {
                const coordKey = `${colIndex},${rowIndex}`;
                const state = boardState[rowIndex]?.[colIndex] || 'empty';
                const hasShip = occupiedSet.has(coordKey);
                const shipAtOrigin = shipOriginMap.get(coordKey);
                const isSelected = selectedCoord?.x === colIndex && selectedCoord?.y === rowIndex;
                const isHovered = hoverCoord?.x === colIndex && hoverCoord?.y === rowIndex;
                const isAffected = affectedCells.has(coordKey);
                const isPlacementCell = placementCells.has(coordKey);
                const isRowDefended = activeDefences.includes(rowIndex);

                return (
                  <div
                    key={`cell-${coordKey}`}
                    onClick={() => {
                      if (isInteractive && onCellClick) {
                        onCellClick({ x: colIndex, y: rowIndex });
                      }
                    }}
                    onMouseEnter={() => {
                      if (isInteractive && onCellHover) {
                        onCellHover({ x: colIndex, y: rowIndex });
                      }
                    }}
                    onMouseLeave={() => {
                      if (isInteractive && onCellHover) {
                        onCellHover(null);
                      }
                    }}
                    className={`relative aspect-square border border-[#C7D9E7] transition-all flex items-center justify-center ${
                      isInteractive ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      isRowDefended ? 'air-defense-hatching' : ''
                    } ${
                      isAffected ? 'targeting-hatching' : ''
                    } ${
                      isSelected ? 'ring-2 ring-[#302A78] bg-[#E8EEF8]' : ''
                    } ${
                      isHovered && !isAffected ? 'bg-[#EEF4FB]' : ''
                    }`}
                  >
                    {/* Render Continuous Ship Illustration at Origin */}
                    {shipAtOrigin && (
                      <div
                        className="absolute pointer-events-none z-10"
                        style={{
                          top: '2px',
                          left: '2px',
                          width:
                            shipAtOrigin.orientation === 'H'
                              ? `calc(${shipAtOrigin.length * 100}% - 4px)`
                              : 'calc(100% - 4px)',
                          height:
                            shipAtOrigin.orientation === 'V'
                              ? `calc(${shipAtOrigin.length * 100}% - 4px)`
                              : 'calc(100% - 4px)',
                        }}
                      >
                        <ShipIllustration
                          type={shipAtOrigin.type}
                          orientation={shipAtOrigin.orientation}
                          isSunk={shipAtOrigin.isSunk}
                        />
                      </div>
                    )}

                    {/* Ship Placement Preview Ghost */}
                    {isPlacementCell && placementPreview && (
                      <div
                        className={`absolute inset-0 pointer-events-none z-20 ${
                          placementPreview.isValid
                            ? 'bg-[#302A78]/20 border border-[#302A78]'
                            : 'bg-[#C73538]/30 border border-[#C73538]'
                        }`}
                      />
                    )}

                    {/* Cell State Markers */}
                    {state === 'miss' && (
                      <div className="z-20 animate-in fade-in zoom-in-50 duration-150">
                        <WaterSplashIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#585098]" />
                      </div>
                    )}

                    {state === 'hit' && (
                      <div className="z-20 animate-in fade-in zoom-in-50 duration-150">
                        <HitCrossIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    )}

                    {state === 'sunk' && (
                      <div className="z-20 relative">
                        <HitCrossIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    )}

                    {/* Hover Reticle for Enemy Board */}
                    {isInteractive && isEnemyBoard && isHovered && state === 'empty' && !isAffected && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                        <div className="w-4 h-4 border border-[#302A78] rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-[#C73538] rounded-full" />
                        </div>
                      </div>
                    )}

                    {/* Radar Pulse Marker */}
                    {radarScans.some((scan) => {
                      const dx = Math.abs(scan.center.x - colIndex);
                      const dy = Math.abs(scan.center.y - rowIndex);
                      return dx <= scan.radius && dy <= scan.radius;
                    }) && (
                      <div className="absolute inset-0 border border-dashed border-[#585098]/40 pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};


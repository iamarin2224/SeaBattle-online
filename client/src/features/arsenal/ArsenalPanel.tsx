'use client';

import React from 'react';
import { CoinIcon } from '../../components/illustrations/NauticalDecorations';
import { PowerUpIcon } from '../../components/illustrations/PowerUpIcons';
import { POWER_UPS } from '../../lib/constants';
import { PowerUpType } from '../../types/game';
import { AlertCircle, X } from 'lucide-react';

interface ArsenalPanelProps {
  coins: number;
  inventory: Record<PowerUpType, number>;
  activePowerUp: PowerUpType | null;
  onSelectPowerUp: (powerUp: PowerUpType | null) => void;
  isMyTurn: boolean;
  disabled?: boolean;
}

export const ArsenalPanel: React.FC<ArsenalPanelProps> = ({
  coins,
  inventory,
  activePowerUp,
  onSelectPowerUp,
  isMyTurn,
  disabled = false,
}) => {
  const abilities = Object.values(POWER_UPS);

  return (
    <div className="bg-[#FFFDF7] p-3 sm:p-4 rounded-sm border-2 border-[#302A78] shadow-[4px_5px_0px_rgba(48,42,120,0.2)] flex flex-col gap-3">
      {/* Header with Coin Counter */}
      <div className="flex items-center justify-between border-b-2 border-dashed border-[#C7D9E7] pb-2.5">
        <div>
          <h3
            className="text-base sm:text-lg font-bold text-[#302A78] tracking-wider"
            style={{ fontFamily: "'Special Elite', cursive, serif" }}
          >
            TACTICAL ARSENAL
          </h3>
          <p className="text-[11px] text-[#585098]">Special naval power-ups & air support</p>
        </div>

        {/* Coin Balance Counter */}
        <div className="flex items-center gap-1.5 bg-[#FFF9E6] border-2 border-[#D7AA43] px-3 py-1 rounded shadow-sm">
          <CoinIcon className="w-5 h-5" />
          <span
            className="font-bold text-base sm:text-lg text-[#946A14]"
            style={{ fontFamily: "'Courier Prime', monospace" }}
          >
            {coins}
          </span>
        </div>
      </div>

      {/* Active Targeting Banner / Instructions */}
      {activePowerUp && (
        <div className="bg-[#FFF0F0] border-2 border-[#C73538] p-2.5 rounded flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#C73538] shrink-0" />
            <div className="text-xs text-[#C73538] font-bold">
              {activePowerUp === 'row_airstrike' && 'Select an enemy row to launch airstrike'}
              {activePowerUp === 'carpet_bomb' && 'Select center of 3x3 carpet bomb'}
              {activePowerUp === 'radar_scan' && 'Select center of 3x3 radar scan'}
              {activePowerUp === 'air_defence' && 'Select a friendly row to fortify with air defence'}
              {activePowerUp === 'precision_strike' && 'Select single cell for precision missile'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectPowerUp(null)}
            className="ink-stamp-btn text-xs py-0.5 px-2 flex items-center gap-1 text-[#C73538] border-[#C73538]"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      )}

      {/* 2-column Grid of Cards inspired by Reference Image 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {abilities.map((ability) => {
          const usedCount = inventory[ability.id as PowerUpType] || 0;
          const maxUses = ability.maxUsesPerMatch || 3;
          const isSelected = activePowerUp === ability.id;
          const canAfford = coins >= ability.cost;
          const hasUsesLeft = usedCount < maxUses;
          const isUsable = isMyTurn && canAfford && hasUsesLeft && !disabled;

          return (
            <div
              key={ability.id}
              onClick={() => {
                if (isUsable) {
                  onSelectPowerUp(isSelected ? null : (ability.id as PowerUpType));
                }
              }}
              className={`relative p-2.5 rounded border-2 border-dashed transition-all flex flex-col justify-between select-none ${
                isSelected
                  ? 'border-[#C73538] bg-[#FFF0F0] shadow-[3px_4px_0px_rgba(199,53,56,0.3)] ring-2 ring-[#C73538]'
                  : isUsable
                  ? 'border-[#302A78] bg-white hover:bg-[#F9FBFF] hover:border-solid cursor-pointer shadow-[2px_3px_0px_rgba(48,42,120,0.15)]'
                  : 'border-[#C7D9E7] bg-[#F7F9FC] opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Card Header: Info icon & Cost with Coin */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] text-[#585098] font-bold border border-[#C7D9E7] rounded-full w-4 h-4 flex items-center justify-center">
                  i
                </span>
                <span
                  className="flex items-center gap-1 text-xs font-bold text-[#A47B1E]"
                  style={{ fontFamily: "'Courier Prime', monospace" }}
                >
                  <CoinIcon className="w-3.5 h-3.5" />
                  {ability.cost}
                </span>
              </div>

              {/* Center Illustrated Icon */}
              <div className="my-1.5 flex items-center justify-center h-14">
                <PowerUpIcon type={ability.id as PowerUpType} className="w-12 h-12" />
              </div>

              {/* Ability Name & Short Desc */}
              <div className="text-center mb-1">
                <div className="font-bold text-xs text-[#302A78] leading-tight">{ability.name}</div>
                <div className="text-[10px] text-[#585098] leading-tight line-clamp-1 mt-0.5">
                  {ability.description}
                </div>
              </div>

              {/* Bottom Uses Badge [ used / max ] matching Reference 3 */}
              <div className="flex justify-center mt-1">
                <div
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#302A78] text-[#302A78] bg-[#FFF9E6]"
                  style={{ fontFamily: "'Special Elite', cursive, serif" }}
                >
                  [ {maxUses - usedCount}/{maxUses} ]
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


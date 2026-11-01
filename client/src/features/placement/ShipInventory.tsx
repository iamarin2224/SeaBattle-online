'use client';

import React from 'react';
import { FLEET_CONFIG } from '../../lib/constants';
import { PlacedShip, ShipOrientation, ShipType } from '../../types/game';
import { ShipIllustration } from '../../components/illustrations/ShipIllustrations';
import { Check, Dices, RotateCw, Trash2 } from 'lucide-react';

interface ShipInventoryProps {
  placedShips: PlacedShip[];
  selectedShipType: ShipType | null;
  onSelectShip: (type: ShipType) => void;
  orientation: ShipOrientation;
  onToggleOrientation: () => void;
  onRandomize: () => void;
  onReset: () => void;
  onConfirmReady: () => void;
  isReady: boolean;
  disabled?: boolean;
}

export const ShipInventory: React.FC<ShipInventoryProps> = ({
  placedShips,
  selectedShipType,
  onSelectShip,
  orientation,
  onToggleOrientation,
  onRandomize,
  onReset,
  onConfirmReady,
  isReady,
  disabled = false,
}) => {
  const allPlaced = placedShips.length === FLEET_CONFIG.length;

  return (
    <div className="bg-[#FFFDF7] p-4 rounded-sm border-2 border-[#302A78] shadow-[4px_5px_0px_rgba(48,42,120,0.2)] flex flex-col gap-4">
      {/* Title & Orientation Control */}
      <div className="flex items-center justify-between border-b-2 border-dashed border-[#C7D9E7] pb-3">
        <div>
          <h3
            className="text-lg font-bold text-[#302A78] tracking-wider"
            style={{ fontFamily: "'Special Elite', cursive, serif" }}
          >
            FLEET INVENTORY
          </h3>
          <p className="text-xs text-[#585098]">
            {placedShips.length} of {FLEET_CONFIG.length} vessels deployed
          </p>
        </div>

        {/* Rotate Button */}
        <button
          type="button"
          onClick={onToggleOrientation}
          disabled={disabled || isReady}
          className="ink-stamp-btn text-xs py-1.5 px-3 flex items-center gap-1.5"
          title="Press R to rotate orientation"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{orientation === 'H' ? 'Horizontal' : 'Vertical'}</span>
          <span className="bg-[#302A78] text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
            R
          </span>
        </button>
      </div>

      {/* Ships List */}
      <div className="flex flex-col gap-2.5">
        {FLEET_CONFIG.map((config) => {
          const isPlaced = placedShips.some((s) => s.type === config.type);
          const isSelected = selectedShipType === config.type;

          return (
            <div
              key={config.type}
              onClick={() => {
                if (!disabled && !isReady) {
                  onSelectShip(config.type);
                }
              }}
              className={`p-2.5 border-2 rounded transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-[#302A78] bg-[#EEF4FB] shadow-[2px_3px_0px_rgba(48,42,120,0.2)]'
                  : isPlaced
                  ? 'border-[#A6C3DA] bg-[#F7F9FC] opacity-75'
                  : 'border-[#C7D9E7] bg-white hover:border-[#302A78]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-20 h-6 flex items-center justify-center">
                  <ShipIllustration type={config.type} orientation="H" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#302A78]">{config.name}</div>
                  <div className="text-[11px] text-[#585098]">Length: {config.length} cells</div>
                </div>
              </div>

              <div>
                {isPlaced ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-[#3B7550] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#81C784]">
                    <Check className="w-3 h-3" /> Placed
                  </span>
                ) : (
                  <span className="text-xs text-[#C73538] font-bold bg-[#FFEBEE] px-2 py-0.5 rounded border border-[#FFCDD2]">
                    Ready to place
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons: Randomize & Reset */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#C7D9E7]">
        <button
          type="button"
          onClick={onRandomize}
          disabled={disabled || isReady}
          className="ink-stamp-btn text-xs py-2 px-2 flex items-center justify-center gap-1.5"
        >
          <Dices className="w-4 h-4" />
          <span>Random Fleet</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={disabled || isReady || placedShips.length === 0}
          className="ink-stamp-btn ink-stamp-danger text-xs py-2 px-2 flex items-center justify-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          <span>Reset Fleet</span>
        </button>
      </div>

      {/* Ready Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onConfirmReady}
          disabled={disabled || isReady || !allPlaced}
          className={`w-full py-3 text-sm tracking-wider font-bold uppercase rounded border-2 transition-all shadow-[3px_4px_0px_rgba(48,42,120,0.3)] ${
            isReady
              ? 'bg-[#3B7550] text-white border-[#2E5B3E]'
              : allPlaced
              ? 'bg-[#302A78] text-white border-[#201D50] hover:bg-[#201D50] cursor-pointer'
              : 'bg-[#E8DCC2] text-[#8E88BE] border-[#C7D9E7] cursor-not-allowed'
          }`}
          style={{ fontFamily: "'Special Elite', cursive, serif" }}
        >
          {isReady ? '✓ READY & WAITING FOR OPPONENT' : allPlaced ? 'CONFIRM & READY FOR BATTLE!' : 'PLACE ALL SHIPS FIRST'}
        </button>
      </div>
    </div>
  );
};


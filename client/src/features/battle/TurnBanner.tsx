'use client';

import React from 'react';
import { AttackResolution } from '../../types/game';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../../lib/audio';

interface TurnBannerProps {
  isMyTurn: boolean;
  turnNumber: number;
  lastAction?: AttackResolution;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TurnBanner: React.FC<TurnBannerProps> = ({
  isMyTurn,
  turnNumber,
  lastAction,
  isMuted,
  onToggleMute,
}) => {
  // Derive feedback text from lastAction
  let actionFeedback: string | null = null;
  if (lastAction) {
    if (lastAction.blockedByAirDefence) {
      actionFeedback = '🛡️ Airstrike intercepted by anti-air defense!';
    } else if (lastAction.sunkShips.length > 0) {
      const shipNames = lastAction.sunkShips.map((s) => s.name).join(', ');
      actionFeedback = `💥 DESTROYED: ${shipNames}!`;
    } else if (lastAction.radarIntel) {
      actionFeedback = `📡 Radar detected ${lastAction.radarIntel.shipCellsFound} ship cell(s) in sector!`;
    } else if (lastAction.cells.some((c) => c.status === 'hit')) {
      const hitCount = lastAction.cells.filter((c) => c.status === 'hit').length;
      actionFeedback = hitCount > 1 ? `🎯 Multiple Hits (${hitCount})!` : '🎯 Direct Hit!';
    } else if (lastAction.cells.every((c) => c.status === 'miss')) {
      actionFeedback = '💦 Splash! Miss.';
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#FFFDF7] p-2.5 sm:p-3 rounded-sm border-2 border-[#302A78] shadow-[3px_4px_0px_rgba(48,42,120,0.2)]">
      {/* Turn Indicator Banner */}
      <div className="flex items-center gap-3">
        <div
          className={`px-4 py-1.5 rounded-sm border-2 text-sm sm:text-base font-bold tracking-wider uppercase transition-all shadow-sm ${
            isMyTurn
              ? 'bg-[#302A78] text-white border-[#201D50] animate-pulse'
              : 'bg-[#F2EFE6] text-[#585098] border-[#C7D9E7]'
          }`}
          style={{ fontFamily: "'Special Elite', cursive, serif" }}
        >
          {isMyTurn ? '⚔️ YOUR TURN' : '⏳ OPPONENT’S TURN'}
        </div>

        <span
          className="text-xs font-bold text-[#585098]"
          style={{ fontFamily: "'Courier Prime', monospace" }}
        >
          Round #{turnNumber}
        </span>
      </div>

      {/* Mid Action Feedback */}
      {actionFeedback && (
        <div
          className="text-xs sm:text-sm font-bold text-[#C73538] bg-[#FFF0F0] border border-[#FFCDD2] px-3 py-1 rounded"
          style={{ fontFamily: "'Special Elite', cursive, serif" }}
        >
          {actionFeedback}
        </div>
      )}

      {/* Controls: Audio Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onToggleMute();
            soundManager.playPencil();
          }}
          className="p-1.5 rounded border border-[#302A78] text-[#302A78] hover:bg-[#EEF4FB] transition-colors"
          title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-[#C73538]" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};


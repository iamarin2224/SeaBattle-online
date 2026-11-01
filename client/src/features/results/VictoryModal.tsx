'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerStats } from '../../types/game';
import { CoinIcon } from '../../components/illustrations/NauticalDecorations';
import { soundManager } from '../../lib/audio';
import { RotateCcw, Home, Trophy, Skull } from 'lucide-react';

interface VictoryModalProps {
  isWinner: boolean;
  winnerName: string;
  stats: PlayerStats;
  rematchRequestedByOpponent: boolean;
  hasRequestedRematch: boolean;
  onRequestRematch: () => void;
  onReturnToLobby: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isWinner,
  winnerName,
  stats,
  rematchRequestedByOpponent,
  hasRequestedRematch,
  onRequestRematch,
  onReturnToLobby,
}) => {
  useEffect(() => {
    if (isWinner) {
      soundManager.playVictory();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#302A78', '#D7AA43', '#C73538', '#3B7550'],
        });
      } catch {
        // Safe fallback if canvas-confetti is not loaded
      }
    } else {
      soundManager.playDefeat();
    }
  }, [isWinner]);

  const totalShots = stats.hits + stats.misses;
  const accuracy = totalShots > 0 ? Math.round((stats.hits / totalShots) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFDF7] max-w-md w-full p-6 rounded-sm border-4 border-[#302A78] shadow-[8px_10px_0px_rgba(48,42,120,0.35)] relative graph-paper-sheet">
        {/* Header Stamped Banner */}
        <div className="text-center pb-4 border-b-2 border-dashed border-[#C7D9E7]">
          <div className="flex justify-center mb-2">
            {isWinner ? (
              <div className="w-16 h-16 rounded-full bg-[#FFEAA7] border-2 border-[#D7AA43] flex items-center justify-center shadow-md animate-bounce">
                <Trophy className="w-9 h-9 text-[#B58721]" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#FFCDD2] border-2 border-[#C73538] flex items-center justify-center shadow-md">
                <Skull className="w-9 h-9 text-[#C73538]" />
              </div>
            )}
          </div>

          <h2
            className={`text-3xl sm:text-4xl font-black uppercase tracking-wider ${
              isWinner ? 'text-[#3B7550]' : 'text-[#C73538]'
            }`}
            style={{ fontFamily: "'Special Elite', cursive, serif" }}
          >
            {isWinner ? 'VICTORY AT SEA!' : 'FLEET DESTROYED!'}
          </h2>
          <p className="text-xs text-[#585098] mt-1 font-mono">
            {isWinner ? 'You dominated enemy waters.' : `${winnerName} emerged victorious.`}
          </p>
        </div>

        {/* Combat Stats Breakdown */}
        <div className="py-4 grid grid-cols-2 gap-3 text-center">
          <div className="p-2.5 bg-[#FFF9E6] border border-[#D7AA43] rounded">
            <div className="text-[11px] text-[#8C6D1F] uppercase font-bold">Accuracy</div>
            <div className="text-xl font-black text-[#302A78] font-mono">{accuracy}%</div>
            <div className="text-[10px] text-[#585098]">
              {stats.hits} hits / {totalShots} shots
            </div>
          </div>

          <div className="p-2.5 bg-[#F0F4FA] border border-[#A6C3DA] rounded">
            <div className="text-[11px] text-[#476785] uppercase font-bold">Ships Sunk</div>
            <div className="text-xl font-black text-[#302A78] font-mono">{stats.shipsDestroyed}</div>
            <div className="text-[10px] text-[#585098]">Naval kills</div>
          </div>

          <div className="p-2.5 bg-[#F7F9FC] border border-[#C7D9E7] rounded">
            <div className="text-[11px] text-[#585098] uppercase font-bold">Power-ups Used</div>
            <div className="text-xl font-black text-[#302A78] font-mono">{stats.abilitiesUsed}</div>
            <div className="text-[10px] text-[#585098]">Tactical strikes</div>
          </div>

          <div className="p-2.5 bg-[#FFF9E6] border border-[#D7AA43] rounded">
            <div className="text-[11px] text-[#8C6D1F] uppercase font-bold">Coins Earned</div>
            <div className="text-xl font-black text-[#946A14] font-mono flex items-center justify-center gap-1">
              <CoinIcon className="w-4 h-4" />
              +{stats.coinsEarned}
            </div>
            <div className="text-[10px] text-[#585098]">Match reward</div>
          </div>
        </div>

        {/* Rematch Notification if Opponent requested */}
        {rematchRequestedByOpponent && !hasRequestedRematch && (
          <div className="mb-3 bg-[#E8F5E9] border border-[#81C784] p-2 rounded text-center text-xs font-bold text-[#2E5B3E] animate-pulse">
            ⚔️ Opponent has requested a rematch! Click below to accept!
          </div>
        )}

        {/* Actions: Rematch & Leave */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#C7D9E7]">
          <button
            type="button"
            onClick={onRequestRematch}
            disabled={hasRequestedRematch}
            className={`w-full py-2.5 text-sm font-bold uppercase rounded border-2 transition-all flex items-center justify-center gap-2 shadow-[2px_3px_0px_rgba(48,42,120,0.25)] ${
              hasRequestedRematch
                ? 'bg-[#E8DCC2] text-[#585098] border-[#C7D9E7] cursor-wait'
                : 'bg-[#302A78] text-white border-[#201D50] hover:bg-[#201D50] cursor-pointer'
            }`}
            style={{ fontFamily: "'Special Elite', cursive, serif" }}
          >
            <RotateCcw className="w-4 h-4" />
            {hasRequestedRematch ? 'Waiting for opponent to accept...' : 'Request Rematch'}
          </button>

          <button
            type="button"
            onClick={onReturnToLobby}
            className="ink-stamp-btn text-xs py-2 w-full flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Return to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};


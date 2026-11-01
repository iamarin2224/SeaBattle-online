'use client';

import React from 'react';
import { CoinIcon } from '../illustrations/NauticalDecorations';

interface PlayerBadgeProps {
  displayName: string;
  coins?: number;
  isConnected?: boolean;
  isHost?: boolean;
  score?: number;
  rankTitle?: string;
  className?: string;
}

export const PlayerBadge: React.FC<PlayerBadgeProps> = ({
  displayName,
  coins,
  isConnected = true,
  isHost = false,
  score = 1420,
  rankTitle = 'Captain',
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2.5 bg-[#FFFCF4] border-2 border-[#302A78] p-1.5 px-3 rounded shadow-[2px_3px_0px_rgba(48,42,120,0.2)] ${className}`}
    >
      {/* Rank Ribbon Icon */}
      <div className="w-6 h-7 bg-[#FFEAA7] border border-[#D7AA43] flex items-center justify-center rounded-sm text-xs shadow-inner">
        ⚓
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className="font-bold text-sm text-[#302A78] leading-tight"
            style={{ fontFamily: "'Special Elite', cursive, serif" }}
          >
            {displayName || 'Anonymous Sailor'}
          </span>
          {isHost && (
            <span className="text-[10px] bg-[#302A78] text-white px-1.5 py-0.2 rounded font-mono">
              HOST
            </span>
          )}
          {/* Connection Dot */}
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#3B7550]' : 'bg-[#C73538] animate-ping'}`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[#585098]">
          <span>{rankTitle} ({score})</span>
          {coins !== undefined && (
            <span className="flex items-center gap-1 font-bold text-[#946A14]">
              <CoinIcon className="w-3.5 h-3.5" />
              {coins}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


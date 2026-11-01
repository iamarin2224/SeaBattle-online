'use client';

import React, { useState } from 'react';
import { soundManager } from '../../lib/audio';
import { Check, Copy, LogOut, Share2, Users } from 'lucide-react';

interface WaitingRoomProps {
  roomCode: string;
  hostName: string;
  opponentName?: string;
  mode: 'classic' | 'advanced';
  boardSize: number;
  onLeaveRoom: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomCode,
  hostName,
  opponentName,
  mode,
  boardSize,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    soundManager.playPencil();
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareLink = () => {
    soundManager.playPencil();
    const url = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto bg-[#FFFDF7] p-6 sm:p-8 rounded-sm border-4 border-[#302A78] shadow-[8px_10px_0px_rgba(48,42,120,0.3)] graph-paper-sheet relative">
      {/* Header */}
      <div className="text-center pb-5 border-b-2 border-dashed border-[#C7D9E7]">
        <div className="inline-block bg-[#FFEAA7] border border-[#D7AA43] text-[#8C6D1F] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
          Private Battle Room
        </div>
        <h2
          className="text-2xl sm:text-3xl font-black text-[#302A78] tracking-wider"
          style={{ fontFamily: "'Special Elite', cursive, serif" }}
        >
          WAITING FOR OPPONENT
        </h2>
        <p className="text-xs text-[#585098] mt-1">
          Share your room code with a friend to begin the naval confrontation
        </p>
      </div>

      {/* Room Code Card Display */}
      <div className="my-6 p-6 bg-[#FFFCF4] border-2 border-[#302A78] rounded text-center shadow-[4px_5px_0px_rgba(48,42,120,0.15)]">
        <div className="text-xs text-[#585098] uppercase font-bold tracking-wider mb-1">
          Invitation Room Code
        </div>
        <div
          className="text-4xl sm:text-5xl font-black text-[#302A78] tracking-widest my-2 select-all"
          style={{ fontFamily: "'Special Elite', cursive, serif" }}
        >
          {roomCode}
        </div>

        {/* Copy / Share Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={handleCopyCode}
            className="ink-stamp-btn text-xs py-2 px-4 flex items-center gap-1.5"
          >
            {copiedCode ? <Check className="w-4 h-4 text-[#3B7550]" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareLink}
            className="ink-stamp-btn text-xs py-2 px-4 flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#3B7550]" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
          </button>
        </div>
      </div>

      {/* Players in Room */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Player 1 (Host) */}
        <div className="p-3 bg-[#EEF4FB] border-2 border-[#302A78] rounded flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#302A78] text-white flex items-center justify-center font-bold text-lg font-mono">
            ⚓
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-[#585098] font-bold">Player 1 (Host)</div>
            <div className="font-bold text-sm text-[#302A78] truncate">{hostName}</div>
          </div>
        </div>

        {/* Player 2 (Challenger) */}
        <div className="p-3 bg-white border-2 border-dashed border-[#C7D9E7] rounded flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8DCC2] text-[#8E88BE] flex items-center justify-center font-bold text-lg">
            <Users className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-[#585098] font-bold">Player 2 (Challenger)</div>
            <div className="font-bold text-sm text-[#C73538] truncate">
              {opponentName || 'Waiting to join...'}
            </div>
          </div>
        </div>
      </div>

      {/* Rules & Game Setup Details */}
      <div className="flex items-center justify-between text-xs text-[#585098] pb-4 mb-4 border-b border-[#C7D9E7] font-mono">
        <span>Mode: <strong className="text-[#302A78] uppercase">{mode}</strong></span>
        <span>Grid: <strong className="text-[#302A78]">{boardSize}x{boardSize}</strong></span>
        <span>Fleet: <strong className="text-[#302A78]">5 Ships (17 Cells)</strong></span>
      </div>

      {/* Leave Room Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="ink-stamp-btn ink-stamp-danger text-xs py-2 px-5 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Leave Room</span>
        </button>
      </div>
    </div>
  );
};


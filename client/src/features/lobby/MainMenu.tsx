'use client';

import React, { useState } from 'react';
import { GameTitleBanner } from '../../components/illustrations/NauticalDecorations';
import { PlayerBadge } from '../../components/ui/PlayerBadge';
import { soundManager } from '../../lib/audio';
import { Bot, Globe, Settings, Users } from 'lucide-react';

interface MainMenuProps {
  displayName: string;
  onUpdateDisplayName: (name: string) => void;
  onOpenCreateRoom: () => void;
  onOpenJoinRoom: () => void;
  onStartVersusAI: () => void;
  mode: 'classic' | 'advanced';
  onToggleMode: () => void;
  boardSize: number;
  onUpdateBoardSize: (size: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  displayName,
  onUpdateDisplayName,
  onOpenCreateRoom,
  onOpenJoinRoom,
  onStartVersusAI,
  mode,
  onToggleMode,
  boardSize,
  onUpdateBoardSize,
  isMuted,
  onToggleMute,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [editingName, setEditingName] = useState(displayName);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-between min-h-[85vh] p-4 relative">
      {/* Top Header Bar: Player Badge (Left) & Settings Gear (Right) */}
      <div className="w-full flex items-center justify-between mb-2">
        <PlayerBadge
          displayName={displayName}
          coins={100}
          rankTitle="Commodore"
          score={1387}
        />

        <button
          type="button"
          onClick={() => {
            soundManager.playPencil();
            setShowSettings(true);
          }}
          className="p-2.5 rounded-sm bg-[#FFFCF4] border-2 border-[#302A78] text-[#302A78] shadow-[2px_3px_0px_rgba(48,42,120,0.2)] hover:bg-[#FFF9E6] transition-all cursor-pointer"
          title="Game Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Title Section */}
      <div className="my-auto text-center flex flex-col items-center gap-6 w-full">
        <GameTitleBanner />

        {/* 3 Main Hand-Drawn Paper Buttons matching Reference Image 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl px-2">
          {/* 1. Versus AI / Solo Practice */}
          <button
            type="button"
            onClick={() => {
              soundManager.playPencil();
              onStartVersusAI();
            }}
            className="group relative p-6 bg-[#FFFCF4] border-3 border-[#302A78] rounded-sm shadow-[5px_6px_0px_rgba(48,42,120,0.25)] hover:shadow-[7px_9px_0px_rgba(48,42,120,0.3)] hover:-translate-y-1 transition-all flex flex-col items-center justify-between text-center cursor-pointer min-h-[170px]"
          >
            {/* Illustrated Icon */}
            <div className="w-16 h-16 mb-2 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Retro desktop monitor sketch */}
                <rect x="18" y="15" width="64" height="48" rx="4" fill="#FFF9E6" stroke="#302A78" strokeWidth="3" />
                <rect x="24" y="21" width="52" height="36" fill="#EEF4FB" stroke="#302A78" strokeWidth="2" />
                {/* Robot face in screen */}
                <circle cx="38" cy="35" r="4" fill="#302A78" />
                <circle cx="62" cy="35" r="4" fill="#302A78" />
                <line x1="38" y1="46" x2="62" y2="46" stroke="#302A78" strokeWidth="3" strokeLinecap="round" />
                {/* Stand */}
                <path d="M 44 63 L 42 75 L 30 78 L 70 78 L 58 75 L 56 63" stroke="#302A78" strokeWidth="3" fill="#FFF9E6" />
                {/* Keyboard sketch */}
                <path d="M 15 84 L 85 84 L 80 94 L 20 94 Z" fill="#FFF9E6" stroke="#302A78" strokeWidth="2.5" />
              </svg>
            </div>
            <div
              className="text-xl font-black text-[#302A78] tracking-wider"
              style={{ fontFamily: "'Special Elite', cursive, serif" }}
            >
              Versus AI
            </div>
            <div className="text-xs text-[#585098] mt-1 font-mono">
              Practice tactical maneuvers solo
            </div>
          </button>

          {/* 2. Create Room (Online Host) */}
          <button
            type="button"
            onClick={() => {
              soundManager.playPencil();
              onOpenCreateRoom();
            }}
            className="group relative p-6 bg-[#FFFCF4] border-3 border-[#302A78] rounded-sm shadow-[5px_6px_0px_rgba(48,42,120,0.25)] hover:shadow-[7px_9px_0px_rgba(48,42,120,0.3)] hover:-translate-y-1 transition-all flex flex-col items-center justify-between text-center cursor-pointer min-h-[170px]"
          >
            {/* Illustrated Globe Sketch */}
            <div className="w-16 h-16 mb-2 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="38" fill="#FFF9E6" stroke="#302A78" strokeWidth="3.2" />
                {/* Latitudes & Longitudes */}
                <ellipse cx="50" cy="50" rx="18" ry="38" fill="none" stroke="#6860A5" strokeWidth="2" />
                <line x1="12" y1="50" x2="88" y2="50" stroke="#6860A5" strokeWidth="2" />
                <line x1="20" y1="30" x2="80" y2="30" stroke="#6860A5" strokeWidth="1.8" strokeDasharray="4,3" />
                <line x1="20" y1="70" x2="80" y2="70" stroke="#6860A5" strokeWidth="1.8" strokeDasharray="4,3" />
                {/* Sketched ship on ocean */}
                <path d="M 40 45 L 60 45 L 56 50 L 44 50 Z" fill="#302A78" />
              </svg>
            </div>
            <div
              className="text-xl font-black text-[#302A78] tracking-wider"
              style={{ fontFamily: "'Special Elite', cursive, serif" }}
            >
              Create Room
            </div>
            <div className="text-xs text-[#585098] mt-1 font-mono">
              Host a match & invite a friend
            </div>
          </button>

          {/* 3. Join Room (With friend) */}
          <button
            type="button"
            onClick={() => {
              soundManager.playPencil();
              onOpenJoinRoom();
            }}
            className="group relative p-6 bg-[#FFFCF4] border-3 border-[#302A78] rounded-sm shadow-[5px_6px_0px_rgba(48,42,120,0.25)] hover:shadow-[7px_9px_0px_rgba(48,42,120,0.3)] hover:-translate-y-1 transition-all flex flex-col items-center justify-between text-center cursor-pointer min-h-[170px]"
          >
            {/* Illustrated Sailors Silhouettes with Caps matching Reference 2 */}
            <div className="w-16 h-16 mb-2 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Sailor 1 */}
                <g transform="translate(14, 18)">
                  <circle cx="20" cy="22" r="12" fill="#FFF9E6" stroke="#302A78" strokeWidth="2.5" />
                  {/* Sailor hat */}
                  <ellipse cx="20" cy="12" rx="14" ry="5" fill="#302A78" />
                  <path d="M 8 36 C 8 28, 32 28, 32 36 L 35 55 L 5 55 Z" fill="#FFF9E6" stroke="#302A78" strokeWidth="2.5" />
                  {/* Neckerchief */}
                  <path d="M 16 34 L 20 42 L 24 34 Z" fill="#C73538" stroke="#302A78" strokeWidth="1.5" />
                </g>
                {/* Sailor 2 */}
                <g transform="translate(48, 18)">
                  <circle cx="20" cy="22" r="12" fill="#FFF9E6" stroke="#302A78" strokeWidth="2.5" />
                  <ellipse cx="20" cy="12" rx="14" ry="5" fill="#302A78" />
                  <path d="M 8 36 C 8 28, 32 28, 32 36 L 35 55 L 5 55 Z" fill="#FFF9E6" stroke="#302A78" strokeWidth="2.5" />
                  <path d="M 16 34 L 20 42 L 24 34 Z" fill="#C73538" stroke="#302A78" strokeWidth="1.5" />
                </g>
              </svg>
            </div>
            <div
              className="text-xl font-black text-[#302A78] tracking-wider"
              style={{ fontFamily: "'Special Elite', cursive, serif" }}
            >
              Join Room
            </div>
            <div className="text-xs text-[#585098] mt-1 font-mono">
              Enter an invitation code
            </div>
          </button>
        </div>

        {/* Mode Selector Pill matching Reference Image 2 */}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundManager.playPencil();
              onToggleMode();
            }}
            className="px-6 py-2 rounded-sm bg-[#FFFCF4] border-2 border-[#302A78] text-[#302A78] font-bold text-sm tracking-widest shadow-[3px_4px_0px_rgba(48,42,120,0.2)] hover:bg-[#FFF9E6] transition-all cursor-pointer flex items-center gap-2"
            style={{ fontFamily: "'Special Elite', cursive, serif" }}
          >
            <span>MODE:</span>
            <span className="uppercase text-[#C73538] underline decoration-dashed">
              {mode === 'advanced' ? 'Advanced Mode (Arsenal)' : 'Classic Mode'}
            </span>
            <span className="text-xs font-mono text-[#585098]">[Click to Toggle]</span>
          </button>
        </div>
      </div>

      {/* Bottom Torn Paper Ribbon matching Reference Image 2 */}
      <div className="w-full max-w-2xl mt-6 py-3 px-6 bg-[#FFFCF4] border-2 border-[#302A78] rounded-sm text-center shadow-[4px_5px_0px_rgba(48,42,120,0.2)]">
        <p
          className="text-xs sm:text-sm font-bold text-[#302A78] tracking-wide"
          style={{ fontFamily: "'Special Elite', cursive, serif" }}
        >
          Online naval battles against players from all over the world
        </p>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFFDF7] max-w-sm w-full p-6 rounded-sm border-4 border-[#302A78] shadow-[8px_10px_0px_rgba(48,42,120,0.35)] relative graph-paper-sheet">
            <h3
              className="text-xl font-bold text-[#302A78] tracking-wider mb-4 border-b-2 border-dashed border-[#C7D9E7] pb-2 text-center"
              style={{ fontFamily: "'Special Elite', cursive, serif" }}
            >
              GAME SETTINGS
            </h3>

            <div className="flex flex-col gap-4 text-xs font-mono">
              {/* Sailor Name */}
              <div>
                <label className="block text-[#585098] font-bold mb-1">Your Sailor Call-Sign:</label>
                <input
                  type="text"
                  value={editingName}
                  maxLength={20}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full p-2 border-2 border-[#302A78] rounded bg-white text-[#302A78] font-bold"
                />
              </div>

              {/* Grid Size Preference */}
              <div>
                <label className="block text-[#585098] font-bold mb-1">Board Dimension:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateBoardSize(15)}
                    className={`p-2 rounded border-2 font-bold ${
                      boardSize === 15
                        ? 'bg-[#302A78] text-white border-[#201D50]'
                        : 'bg-white text-[#302A78] border-[#C7D9E7]'
                    }`}
                  >
                    15x15 (Extended)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateBoardSize(10)}
                    className={`p-2 rounded border-2 font-bold ${
                      boardSize === 10
                        ? 'bg-[#302A78] text-white border-[#201D50]'
                        : 'bg-white text-[#302A78] border-[#C7D9E7]'
                    }`}
                  >
                    10x10 (Classic)
                  </button>
                </div>
              </div>

              {/* Sound Audio Toggle */}
              <div>
                <label className="block text-[#585098] font-bold mb-1">Sound Effects:</label>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={`w-full p-2 rounded border-2 font-bold ${
                    !isMuted
                      ? 'bg-[#3B7550] text-white border-[#2E5B3E]'
                      : 'bg-[#C73538] text-white border-[#902426]'
                  }`}
                >
                  {!isMuted ? '🔊 Sound Enabled' : '🔇 Muted'}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundManager.playPencil();
                  if (editingName.trim()) {
                    onUpdateDisplayName(editingName.trim());
                  }
                  setShowSettings(false);
                }}
                className="ink-stamp-btn text-xs py-2 px-5"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


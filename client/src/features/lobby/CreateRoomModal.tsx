'use client';

import React, { useState } from 'react';
import { soundManager } from '../../lib/audio';
import { X } from 'lucide-react';

interface CreateRoomModalProps {
  initialDisplayName: string;
  defaultMode: 'classic' | 'advanced';
  defaultBoardSize: number;
  onClose: () => void;
  onCreate: (displayName: string, mode: 'classic' | 'advanced', boardSize: number) => void;
  isLoading?: boolean;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  initialDisplayName,
  defaultMode,
  defaultBoardSize,
  onClose,
  onCreate,
  isLoading = false,
}) => {
  const [name, setName] = useState(initialDisplayName);
  const [mode, setMode] = useState<'classic' | 'advanced'>(defaultMode);
  const [boardSize, setBoardSize] = useState<number>(defaultBoardSize);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your sailor display name');
      return;
    }
    soundManager.playPencil();
    onCreate(trimmed, mode, boardSize);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFDF7] max-w-md w-full p-6 sm:p-7 rounded-sm border-4 border-[#302A78] shadow-[8px_10px_0px_rgba(48,42,120,0.35)] relative graph-paper-sheet">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded text-[#585098] hover:text-[#302A78]"
        >
          <X className="w-5 h-5" />
        </button>

        <h3
          className="text-2xl font-black text-[#302A78] tracking-wider mb-1 text-center"
          style={{ fontFamily: "'Special Elite', cursive, serif" }}
        >
          HOST NAVAL ROOM
        </h3>
        <p className="text-xs text-[#585098] text-center mb-5 font-mono">
          Configure match rules and receive your invitation code
        </p>

        {error && (
          <div className="mb-4 p-2 bg-[#FFF0F0] border border-[#FFCDD2] text-[#C73538] text-xs font-bold rounded text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-mono">
          {/* Display Name */}
          <div>
            <label className="block text-[#302A78] font-bold mb-1.5 uppercase">
              Your Sailor Call-Sign:
            </label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="e.g. Admiral Nelson"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className="w-full p-2.5 border-2 border-[#302A78] rounded bg-white text-sm text-[#302A78] font-bold focus:outline-none focus:ring-2 focus:ring-[#302A78]"
            />
          </div>

          {/* Game Mode */}
          <div>
            <label className="block text-[#302A78] font-bold mb-1.5 uppercase">
              Combat Mode:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('advanced')}
                className={`p-2.5 rounded border-2 font-bold text-left transition-all ${
                  mode === 'advanced'
                    ? 'border-[#302A78] bg-[#EEF4FB] text-[#302A78]'
                    : 'border-[#C7D9E7] bg-white text-[#585098]'
                }`}
              >
                <div className="font-bold text-xs">ADVANCED MODE</div>
                <div className="text-[10px] text-[#585098] mt-0.5 font-normal">
                  Airstrikes, radar, coins & air defence
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('classic')}
                className={`p-2.5 rounded border-2 font-bold text-left transition-all ${
                  mode === 'classic'
                    ? 'border-[#302A78] bg-[#EEF4FB] text-[#302A78]'
                    : 'border-[#C7D9E7] bg-white text-[#585098]'
                }`}
              >
                <div className="font-bold text-xs">CLASSIC MODE</div>
                <div className="text-[10px] text-[#585098] mt-0.5 font-normal">
                  Pure traditional battleship shots
                </div>
              </button>
            </div>
          </div>

          {/* Board Size */}
          <div>
            <label className="block text-[#302A78] font-bold mb-1.5 uppercase">
              Ocean Grid Dimension:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBoardSize(15)}
                className={`p-2 rounded border-2 font-bold text-center ${
                  boardSize === 15
                    ? 'border-[#302A78] bg-[#EEF4FB] text-[#302A78]'
                    : 'border-[#C7D9E7] bg-white text-[#585098]'
                }`}
              >
                15x15 (A-O, 1-15)
              </button>

              <button
                type="button"
                onClick={() => setBoardSize(10)}
                className={`p-2 rounded border-2 font-bold text-center ${
                  boardSize === 10
                    ? 'border-[#302A78] bg-[#EEF4FB] text-[#302A78]'
                    : 'border-[#C7D9E7] bg-white text-[#585098]'
                }`}
              >
                10x10 (A-J, 1-10)
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#302A78] hover:bg-[#201D50] text-white font-bold text-sm uppercase rounded border-2 border-[#201D50] transition-all shadow-[3px_4px_0px_rgba(48,42,120,0.3)] cursor-pointer"
              style={{ fontFamily: "'Special Elite', cursive, serif" }}
            >
              {isLoading ? 'Creating Room...' : 'Create Room & Get Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


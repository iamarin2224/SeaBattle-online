'use client';

import React, { useState } from 'react';
import { soundManager } from '../../lib/audio';
import { X } from 'lucide-react';

interface JoinRoomModalProps {
  initialDisplayName: string;
  initialRoomCode?: string;
  onClose: () => void;
  onJoin: (roomCode: string, displayName: string) => void;
  isLoading?: boolean;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  initialDisplayName,
  initialRoomCode = '',
  onClose,
  onJoin,
  isLoading = false,
}) => {
  const [name, setName] = useState(initialDisplayName);
  const [code, setCode] = useState(initialRoomCode.toUpperCase());
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedName) {
      setError('Please enter your sailor call-sign');
      return;
    }
    if (!trimmedCode || trimmedCode.length < 4) {
      setError('Please enter a valid room invitation code');
      return;
    }

    soundManager.playPencil();
    onJoin(trimmedCode, trimmedName);
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
          JOIN NAVAL BATTLE
        </h3>
        <p className="text-xs text-[#585098] text-center mb-5 font-mono">
          Enter the room code shared by the host commander
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
              placeholder="e.g. Captain Nemo"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className="w-full p-2.5 border-2 border-[#302A78] rounded bg-white text-sm text-[#302A78] font-bold focus:outline-none focus:ring-2 focus:ring-[#302A78]"
            />
          </div>

          {/* Room Code */}
          <div>
            <label className="block text-[#302A78] font-bold mb-1.5 uppercase">
              Room Invitation Code:
            </label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="e.g. K7PX4Q"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              className="w-full p-2.5 border-2 border-[#302A78] rounded bg-white text-lg tracking-widest text-[#302A78] font-bold uppercase text-center focus:outline-none focus:ring-2 focus:ring-[#302A78]"
              style={{ fontFamily: "'Special Elite', cursive, serif" }}
            />
          </div>

          {/* Submit */}
          <div className="mt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#302A78] hover:bg-[#201D50] text-white font-bold text-sm uppercase rounded border-2 border-[#201D50] transition-all shadow-[3px_4px_0px_rgba(48,42,120,0.3)] cursor-pointer"
              style={{ fontFamily: "'Special Elite', cursive, serif" }}
            >
              {isLoading ? 'Joining Battle Room...' : 'Enter Combat Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


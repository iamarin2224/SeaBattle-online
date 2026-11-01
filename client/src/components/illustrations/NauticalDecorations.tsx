'use client';

import React from 'react';

export const WaterSplashIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 40 40" className={`pointer-events-none ${className}`}>
    {/* Concentric sketched ink ripples and splash droplets */}
    <path
      d="M 10 24 C 14 20, 26 20, 30 24 C 26 28, 14 28, 10 24 Z"
      fill="none"
      stroke="#585098"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M 14 22 C 16 18, 24 18, 26 22"
      fill="none"
      stroke="#302A78"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Splash drops */}
    <circle cx="20" cy="12" r="2.2" fill="#302A78" />
    <circle cx="13" cy="15" r="1.6" fill="#585098" />
    <circle cx="27" cy="15" r="1.6" fill="#585098" />
  </svg>
);

export const HitCrossIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 40 40" className={`pointer-events-none drop-shadow ${className}`}>
    {/* Red ballpoint / pencil aggressive cross */}
    <path
      d="M 8 9 Q 20 20, 32 31"
      stroke="#C73538"
      strokeWidth="3.8"
      strokeLinecap="round"
    />
    <path
      d="M 32 9 Q 20 20, 8 31"
      stroke="#C73538"
      strokeWidth="3.8"
      strokeLinecap="round"
    />
    {/* Secondary stroke for hand-drawn density */}
    <path
      d="M 10 7 L 30 33"
      stroke="#E04044"
      strokeWidth="1.8"
      strokeLinecap="round"
      opacity="0.7"
    />
    <path
      d="M 30 7 L 10 33"
      stroke="#E04044"
      strokeWidth="1.8"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

export const ExplosionCloudIcon: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" className={`pointer-events-none ${className}`}>
    {/* Crossed bombs/cannons in background */}
    <line x1="20" y1="20" x2="80" y2="80" stroke="#302A78" strokeWidth="3" strokeLinecap="round" />
    <line x1="80" y1="20" x2="20" y2="80" stroke="#302A78" strokeWidth="3" strokeLinecap="round" />
    {/* Fluffy sketched explosion puffs */}
    <path
      d="M 50 15 C 38 12, 28 22, 28 34 C 18 36, 12 48, 18 60 C 14 72, 26 84, 38 82 C 46 88, 58 88, 66 82 C 78 84, 90 74, 86 60 C 92 48, 86 36, 76 34 C 76 22, 66 12, 50 15 Z"
      fill="#FFFCF4"
      stroke="#302A78"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* Inner billow circles and smoke sparks */}
    <path d="M 36 40 Q 50 32, 64 40" stroke="#585098" strokeWidth="2" fill="none" />
    <path d="M 32 58 Q 50 68, 68 58" stroke="#585098" strokeWidth="2" fill="none" />
    <circle cx="50" cy="50" r="10" stroke="#C73538" strokeWidth="2.5" fill="none" strokeDasharray="4,3" />
    <path d="M 45 45 L 55 55 M 55 45 L 45 55" stroke="#C73538" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const CoinIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" className={`inline-block ${className}`}>
    {/* Hand-drawn gold coin */}
    <circle cx="16" cy="16" r="13" fill="#FFEAA7" stroke="#D7AA43" strokeWidth="2.8" />
    <circle cx="16" cy="16" r="9.5" fill="none" stroke="#C3962F" strokeWidth="1.5" strokeDasharray="3,2" />
    <text
      x="16"
      y="21"
      textAnchor="middle"
      fontSize="14"
      fontWeight="bold"
      fontFamily="'Courier Prime', monospace"
      fill="#A47B1E"
    >
      $
    </text>
  </svg>
);

export const GameTitleBanner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex flex-col items-center select-none relative ${className}`}>
    <div className="relative inline-flex items-center justify-center gap-3">
      {/* 3D Sketched Hand-Lettered Title matching Reference 2 */}
      <div className="text-center">
        <div className="flex items-center gap-2 justify-center">
          <span
            className="text-4xl sm:text-6xl font-black tracking-wider text-[#302A78] drop-shadow-[2px_3px_0px_#C7D9E7]"
            style={{ fontFamily: "'Special Elite', cursive, serif" }}
          >
            CLASSIC
          </span>
        </div>
        <div className="flex items-center gap-3 justify-center mt-[-4px]">
          <span
            className="text-5xl sm:text-7xl font-black tracking-wider text-[#302A78] drop-shadow-[3px_4px_0px_#C7D9E7]"
            style={{ fontFamily: "'Special Elite', cursive, serif" }}
          >
            SEA
          </span>
          {/* Hand-drawn rocket / missile in center with "CLICK" as in screenshot 2 */}
          <div className="relative w-10 sm:w-14 h-16 sm:h-20 flex items-center justify-center transform -rotate-12">
            <svg viewBox="0 0 60 90" className="w-full h-full drop-shadow">
              <path
                d="M 30 5 C 40 25, 45 55, 42 75 L 18 75 C 15 55, 20 25, 30 5 Z"
                fill="#FFF9E6"
                stroke="#302A78"
                strokeWidth="3.2"
              />
              <path d="M 18 60 L 5 78 L 18 75 Z" fill="#C73538" stroke="#302A78" strokeWidth="2.5" />
              <path d="M 42 60 L 55 78 L 42 75 Z" fill="#C73538" stroke="#302A78" strokeWidth="2.5" />
              <circle cx="30" cy="35" r="7" fill="#C7D9E7" stroke="#302A78" strokeWidth="2" />
              <text
                x="30"
                y="55"
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#302A78"
                transform="rotate(90 30 52)"
                fontFamily="'Courier Prime', monospace"
              >
                CLICK
              </text>
            </svg>
          </div>
          <span
            className="text-5xl sm:text-7xl font-black tracking-wider text-[#302A78] drop-shadow-[3px_4px_0px_#C7D9E7]"
            style={{ fontFamily: "'Special Elite', cursive, serif" }}
          >
            BATTLE
          </span>
        </div>
      </div>
    </div>
  </div>
);


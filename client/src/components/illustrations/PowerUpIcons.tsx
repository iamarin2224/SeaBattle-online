'use client';

import React from 'react';
import { PowerUpType } from '../../types/game';

interface PowerUpIconProps {
  type: PowerUpType;
  className?: string;
}

export const PowerUpIcon: React.FC<PowerUpIconProps> = ({ type, className = 'w-10 h-10' }) => {
  const ink = '#302A78';
  const accent = '#6860A5';

  switch (type) {
    case 'row_airstrike':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          {/* Hand-drawn bomber plane dropping 3 bombs across row */}
          {/* Plane fuselage & wings */}
          <path
            d="M 20 40 L 45 40 L 50 15 L 56 15 L 54 40 L 82 40 L 88 32 L 92 32 L 90 45 L 82 45 L 54 45 L 50 70 L 45 70 L 48 45 L 20 45 Z"
            fill="#FFF9E6"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Bombs falling */}
          <g transform="translate(18, 62)">
            <ellipse cx="6" cy="14" rx="4" ry="8" fill="#FFF9E6" stroke={ink} strokeWidth="2" transform="rotate(25 6 14)" />
            <line x1="6" y1="4" x2="6" y2="8" stroke={ink} strokeWidth="2" />
          </g>
          <g transform="translate(42, 65)">
            <ellipse cx="6" cy="14" rx="4" ry="8" fill="#FFF9E6" stroke={ink} strokeWidth="2" transform="rotate(25 6 14)" />
            <line x1="6" y1="4" x2="6" y2="8" stroke={ink} strokeWidth="2" />
          </g>
          <g transform="translate(66, 68)">
            <ellipse cx="6" cy="14" rx="4" ry="8" fill="#FFF9E6" stroke={ink} strokeWidth="2" transform="rotate(25 6 14)" />
            <line x1="6" y1="4" x2="6" y2="8" stroke={ink} strokeWidth="2" />
          </g>
        </svg>
      );

    case 'carpet_bomb':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          {/* Heavy strategic bomber sweeping down */}
          <path
            d="M 15 48 C 30 45, 50 35, 75 22 L 78 28 L 60 48 L 88 50 L 92 46 L 95 46 L 93 55 L 88 55 L 58 54 L 40 76 L 35 74 L 46 54 L 15 52 Z"
            fill="#FFF9E6"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Dense bomb cluster */}
          <circle cx="32" cy="78" r="4.5" fill="#FFF9E6" stroke={ink} strokeWidth="2" />
          <circle cx="48" cy="84" r="4.5" fill="#FFF9E6" stroke={ink} strokeWidth="2" />
          <circle cx="64" cy="80" r="4.5" fill="#FFF9E6" stroke={ink} strokeWidth="2" />
          <circle cx="48" cy="70" r="4" fill="#FFF9E6" stroke={accent} strokeWidth="1.8" />
        </svg>
      );

    case 'radar_scan':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          {/* Radar dish with circular scan waves (matching Reference Image 3) */}
          <circle cx="50" cy="50" r="40" fill="#FFF9E6" stroke={ink} strokeWidth="3" />
          <circle cx="50" cy="50" r="28" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="4,4" />
          <circle cx="50" cy="50" r="16" fill="none" stroke={ink} strokeWidth="2" />
          {/* Crosshairs */}
          <line x1="10" y1="50" x2="90" y2="50" stroke={accent} strokeWidth="1.8" />
          <line x1="50" y1="10" x2="50" y2="90" stroke={accent} strokeWidth="1.8" />
          {/* Radar sweep wedge */}
          <path d="M 50 50 L 85 22 A 40 40 0 0 1 88 50 Z" fill={ink} opacity="0.35" />
          <circle cx="50" cy="50" r="4" fill={ink} />
        </svg>
      );

    case 'air_defence':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          {/* Naval Anti-Air battery / Flak shield */}
          <path
            d="M 50 12 L 82 24 C 82 58, 68 78, 50 88 C 32 78, 18 58, 18 24 Z"
            fill="#FFF9E6"
            stroke={ink}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Dual Anti-Air Barrels */}
          <line x1="44" y1="60" x2="35" y2="30" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="56" y1="60" x2="65" y2="30" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
          {/* Flak mount */}
          <rect x="38" y="55" width="24" height="16" rx="3" fill="#FFF9E6" stroke={ink} strokeWidth="2.5" />
          {/* Small anti-air bursts */}
          <path d="M 28 20 L 32 24 M 72 20 L 68 24" stroke="#C73538" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'precision_strike':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          {/* Precision guided missile / reticle */}
          <circle cx="50" cy="50" r="36" fill="#FFF9E6" stroke={ink} strokeWidth="3" />
          <circle cx="50" cy="50" r="18" fill="none" stroke={ink} strokeWidth="2" />
          <line x1="14" y1="50" x2="86" y2="50" stroke={ink} strokeWidth="2.5" />
          <line x1="50" y1="14" x2="50" y2="86" stroke={ink} strokeWidth="2.5" />
          {/* Central red laser dot */}
          <circle cx="50" cy="50" r="5" fill="#C73538" />
          {/* Corner brackets */}
          <path d="M 26 36 L 26 26 L 36 26" stroke="#C73538" strokeWidth="2.5" fill="none" />
          <path d="M 74 36 L 74 26 L 64 26" stroke="#C73538" strokeWidth="2.5" fill="none" />
          <path d="M 26 64 L 26 74 L 36 74" stroke="#C73538" strokeWidth="2.5" fill="none" />
          <path d="M 74 64 L 74 74 L 64 74" stroke="#C73538" strokeWidth="2.5" fill="none" />
        </svg>
      );

    default:
      return null;
  }
};


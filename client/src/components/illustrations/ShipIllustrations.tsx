'use client';

import React from 'react';
import { ShipOrientation, ShipType } from '../../types/game';

interface ShipIllustrationProps {
  type: ShipType;
  orientation: ShipOrientation;
  isSunk?: boolean;
  className?: string;
}

export const ShipIllustration: React.FC<ShipIllustrationProps> = ({
  type,
  orientation,
  isSunk = false,
  className = '',
}) => {
  const inkColor = isSunk ? '#8C1E20' : '#2D2775';
  const accentColor = isSunk ? '#C73538' : '#494294';

  const isVertical = orientation === 'V';
  // Rotates 90 deg if vertical
  const transform = isVertical ? 'rotate(90 50 50)' : '';

  // Render SVG based on ship type
  switch (type) {
    case 'carrier': // 5 units
      return (
        <svg
          viewBox="0 0 500 100"
          className={`w-full h-full pointer-events-none drop-shadow-sm ${className}`}
          preserveAspectRatio="none"
          style={{ transform: isVertical ? 'rotate(90deg)' : 'none' }}
        >
          {/* Main Flight Deck Hull */}
          <path
            d="M 15 50 Q 30 15, 60 14 L 460 14 Q 485 14, 495 50 Q 485 86, 460 86 L 60 86 Q 30 85, 15 50 Z"
            fill="none"
            stroke={inkColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Flight Runway Lines */}
          <line x1="45" y1="50" x2="480" y2="50" stroke={inkColor} strokeWidth="2" strokeDasharray="16,10" />
          <line x1="55" y1="32" x2="440" y2="32" stroke={accentColor} strokeWidth="1.2" strokeDasharray="25,12" />
          <line x1="55" y1="68" x2="440" y2="68" stroke={accentColor} strokeWidth="1.2" strokeDasharray="25,12" />
          {/* Island Superstructure / Tower */}
          <rect x="230" y="16" width="70" height="15" rx="3" fill="#FFF9E6" stroke={inkColor} strokeWidth="2.5" />
          <line x1="265" y1="16" x2="265" y2="8" stroke={inkColor} strokeWidth="2" />
          <circle cx="265" cy="7" r="2.5" fill={inkColor} />
          {/* Arrestor wires */}
          <line x1="70" y1="20" x2="70" y2="80" stroke={inkColor} strokeWidth="1.5" />
          <line x1="85" y1="20" x2="85" y2="80" stroke={inkColor} strokeWidth="1.5" />
          <line x1="100" y1="20" x2="100" y2="80" stroke={inkColor} strokeWidth="1.5" />
          {/* Deck elevator hatches */}
          <rect x="135" y="36" width="30" height="28" fill="none" stroke={inkColor} strokeWidth="1.8" strokeDasharray="4,3" />
          <rect x="350" y="36" width="30" height="28" fill="none" stroke={inkColor} strokeWidth="1.8" strokeDasharray="4,3" />
          {/* Pencil hatching for hand-drawn look */}
          <path d="M 40 45 L 50 55 M 460 45 L 470 55 M 240 22 L 246 25" stroke={accentColor} strokeWidth="1" />
        </svg>
      );

    case 'battleship': // 4 units
      return (
        <svg
          viewBox="0 0 400 100"
          className={`w-full h-full pointer-events-none drop-shadow-sm ${className}`}
          preserveAspectRatio="none"
          style={{ transform: isVertical ? 'rotate(90deg)' : 'none' }}
        >
          {/* Armored Hull */}
          <path
            d="M 12 50 Q 30 18, 70 18 L 340 18 Q 380 20, 392 50 Q 380 80, 340 82 L 70 82 Q 30 82, 12 50 Z"
            fill="none"
            stroke={inkColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner armor deck */}
          <path
            d="M 28 50 Q 42 26, 75 26 L 330 26 Q 365 28, 376 50 Q 365 72, 330 74 L 75 74 Q 42 74, 28 50 Z"
            fill="none"
            stroke={accentColor}
            strokeWidth="1.2"
          />
          {/* Heavy Gun Turrets Forward (A & B turrets) */}
          <circle cx="310" cy="50" r="16" fill="#FFF9E6" stroke={inkColor} strokeWidth="2.5" />
          <line x1="322" y1="46" x2="355" y2="46" stroke={inkColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="322" y1="54" x2="355" y2="54" stroke={inkColor} strokeWidth="2.5" strokeLinecap="round" />

          <circle cx="260" cy="50" r="15" fill="#FFF9E6" stroke={inkColor} strokeWidth="2.5" />
          <line x1="271" y1="46" x2="300" y2="46" stroke={inkColor} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="271" y1="54" x2="300" y2="54" stroke={inkColor} strokeWidth="2.2" strokeLinecap="round" />

          {/* Central Conning Tower / Bridge */}
          <rect x="175" y="32" width="50" height="36" rx="4" fill="#FFF9E6" stroke={inkColor} strokeWidth="2.5" />
          <line x1="200" y1="32" x2="200" y2="20" stroke={inkColor} strokeWidth="2" />
          <circle cx="200" cy="18" r="3" fill={inkColor} />
          {/* Aft Turret (X turret) */}
          <circle cx="100" cy="50" r="16" fill="#FFF9E6" stroke={inkColor} strokeWidth="2.5" />
          <line x1="88" y1="46" x2="55" y2="46" stroke={inkColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="88" y1="54" x2="55" y2="54" stroke={inkColor} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'cruiser': // 3 units
      return (
        <svg
          viewBox="0 0 300 100"
          className={`w-full h-full pointer-events-none drop-shadow-sm ${className}`}
          preserveAspectRatio="none"
          style={{ transform: isVertical ? 'rotate(90deg)' : 'none' }}
        >
          {/* Sleek Cruiser Hull */}
          <path
            d="M 12 50 Q 28 22, 60 22 L 245 22 Q 280 25, 292 50 Q 280 75, 245 78 L 60 78 Q 28 78, 12 50 Z"
            fill="none"
            stroke={inkColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Forward Gun */}
          <circle cx="235" cy="50" r="13" fill="#FFF9E6" stroke={inkColor} strokeWidth="2.2" />
          <line x1="245" y1="50" x2="275" y2="50" stroke={inkColor} strokeWidth="2.5" strokeLinecap="round" />
          {/* Bridge & Radar Mast */}
          <rect x="140" y="33" width="46" height="34" rx="3" fill="#FFF9E6" stroke={inkColor} strokeWidth="2.2" />
          <line x1="163" y1="33" x2="163" y2="22" stroke={inkColor} strokeWidth="1.8" />
          <path d="M 155 22 Q 163 18, 171 22" stroke={inkColor} strokeWidth="1.8" fill="none" />
          {/* Torpedo / Missile Rack */}
          <rect x="80" y="38" width="30" height="24" rx="2" fill="none" stroke={inkColor} strokeWidth="2" strokeDasharray="5,3" />
        </svg>
      );

    case 'submarine': // 3 units
      return (
        <svg
          viewBox="0 0 300 100"
          className={`w-full h-full pointer-events-none drop-shadow-sm ${className}`}
          preserveAspectRatio="none"
          style={{ transform: isVertical ? 'rotate(90deg)' : 'none' }}
        >
          {/* Rounded Submarine Hull */}
          <path
            d="M 20 50 C 20 30, 45 26, 80 26 L 240 26 C 275 26, 290 35, 290 50 C 290 65, 275 74, 240 74 L 80 74 C 45 74, 20 70, 20 50 Z"
            fill="none"
            stroke={inkColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Conning tower / sail */}
          <rect x="135" y="34" width="42" height="32" rx="10" fill="#FFF9E6" stroke={inkColor} strokeWidth="2.5" />
          {/* Periscopes */}
          <line x1="156" y1="34" x2="156" y2="18" stroke={inkColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="156" y1="18" x2="162" y2="18" stroke={inkColor} strokeWidth="2" strokeLinecap="round" />
          {/* Ballast / Deck hatch details */}
          <circle cx="85" cy="50" r="8" fill="none" stroke={inkColor} strokeWidth="1.8" />
          <circle cx="215" cy="50" r="8" fill="none" stroke={inkColor} strokeWidth="1.8" />
          {/* Stern Propeller and Rudders */}
          <line x1="20" y1="36" x2="20" y2="64" stroke={inkColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="10" y1="44" x2="20" y2="50" stroke={inkColor} strokeWidth="2" />
          <line x1="10" y1="56" x2="20" y2="50" stroke={inkColor} strokeWidth="2" />
        </svg>
      );

    case 'destroyer': // 2 units
      return (
        <svg
          viewBox="0 0 200 100"
          className={`w-full h-full pointer-events-none drop-shadow-sm ${className}`}
          preserveAspectRatio="none"
          style={{ transform: isVertical ? 'rotate(90deg)' : 'none' }}
        >
          {/* Fast Patrol / Destroyer Hull */}
          <path
            d="M 12 50 Q 25 24, 50 24 L 155 24 Q 185 26, 192 50 Q 185 74, 155 76 L 50 76 Q 25 76, 12 50 Z"
            fill="none"
            stroke={inkColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Bow Gun Turret */}
          <circle cx="150" cy="50" r="11" fill="#FFF9E6" stroke={inkColor} strokeWidth="2" />
          <line x1="158" y1="50" x2="182" y2="50" stroke={inkColor} strokeWidth="2.5" strokeLinecap="round" />
          {/* Bridge Cabin */}
          <rect x="85" y="36" width="34" height="28" rx="3" fill="#FFF9E6" stroke={inkColor} strokeWidth="2" />
          <line x1="102" y1="36" x2="102" y2="24" stroke={inkColor} strokeWidth="1.8" />
          {/* Depth Charge Racks at Stern */}
          <line x1="34" y1="38" x2="52" y2="38" stroke={inkColor} strokeWidth="2" />
          <line x1="34" y1="62" x2="52" y2="62" stroke={inkColor} strokeWidth="2" />
        </svg>
      );

    default:
      return null;
  }
};


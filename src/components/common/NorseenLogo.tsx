import React from 'react';

interface NorseenLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  textColor?: string;
  className?: string;
  theme?: 'dark' | 'light';
}

export const NorseenLogo: React.FC<NorseenLogoProps> = ({
  size = 'md',
  showText = true,
  textColor,
  className = '',
  theme = 'dark',
}) => {
  // Size mapping for the logo emblem
  const widthMap = {
    sm: 'w-20',
    md: 'w-32',
    lg: 'w-44',
    xl: 'w-56',
    '2xl': 'w-72',
  };

  const textMap = {
    sm: 'text-base font-extrabold',
    md: 'text-xl font-black',
    lg: 'text-3xl font-black',
    xl: 'text-4xl font-black',
    '2xl': 'text-5xl font-black',
  };

  const mainColor = theme === 'light' ? '#0f172a' : '#FFFFFF';
  const resolvedTextColor = textColor || (theme === 'light' ? 'text-slate-900' : 'text-white');

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Official NOOR F&B Emblem from Brand Specification */}
      <div className={`relative ${widthMap[size]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 240 110"
          className="w-full h-auto overflow-visible drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Cyan / Teal gradient for the F&B badge */}
            <linearGradient id="noorCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
            {/* Subtle glow filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Stylized Left Figure (Human figure with outstretched arms) */}
          {/* Head Dot */}
          <circle cx="43" cy="23" r="5.5" fill={mainColor} />

          {/* Left Hand Dot */}
          <circle cx="20" cy="41" r="3.2" fill={mainColor} />

          {/* Left Arm Stroke */}
          <path
            d="M 21 44 C 23 54, 30 68, 42 76 C 36 67, 30 55, 27 45 C 26 42, 21 41, 21 44 Z"
            fill={mainColor}
          />

          {/* Main Body Dynamic V-Shape & Underline Swoosh */}
          <path
            d="M 38 41 C 41 52, 45 74, 52 87 C 53.5 89.5, 56.5 89.5, 58 87 C 65 72, 75 42, 88 30 C 104 16, 138 15, 172 23 C 196 29, 214 38, 224 46 C 206 40, 182 34, 154 33 C 122 32, 98 42, 82 62 C 69 79, 61 87, 55 87 C 49 87, 44 68, 40 45 C 39.5 40, 35 38, 38 41 Z"
            fill={mainColor}
          />

          {/* Underline Swoosh Cradle under NOOR */}
          <path
            d="M 55 86 C 68 70, 85 49, 114 43 C 145 37, 185 41, 218 53 C 188 47, 146 44, 116 49 C 88 54, 70 70, 55 86 Z"
            fill={mainColor}
            opacity="0.95"
          />

          {/* 2. "NOOR" Typography in Serif */}
          <g fill={mainColor} style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 900 }}>
            <text
              x="92"
              y="37"
              fontSize="34"
              fontWeight="900"
              fontFamily="Georgia, serif"
              letterSpacing="1"
            >
              N
            </text>
            <text
              x="122"
              y="37"
              fontSize="34"
              fontWeight="900"
              fontFamily="Georgia, serif"
            >
              O
            </text>
            <text
              x="151"
              y="37"
              fontSize="34"
              fontWeight="900"
              fontFamily="Georgia, serif"
            >
              O
            </text>
            <text
              x="180"
              y="37"
              fontSize="34"
              fontWeight="900"
              fontFamily="Georgia, serif"
            >
              R
            </text>
          </g>

          {/* 3. "F & B" Cyan Pill Capsule situated below the two Os */}
          <g>
            <rect
              x="124"
              y="44"
              width="45"
              height="20"
              rx="10"
              fill="url(#noorCyanGrad)"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              filter="url(#softGlow)"
            />
            <text
              x="146.5"
              y="58"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
              textAnchor="middle"
              letterSpacing="0.8"
            >
              F&amp;B
            </text>
          </g>
        </svg>
      </div>

      {/* Brand Typography: ONLY "نورسين" (No "شركة") */}
      {showText && (
        <div className="mt-2 text-center">
          <span className={`tracking-wide ${textMap[size]} ${resolvedTextColor} block leading-tight font-sans drop-shadow-sm`}>
            نورسين
          </span>
        </div>
      )}
    </div>
  );
};

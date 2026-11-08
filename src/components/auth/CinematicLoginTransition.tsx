import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface CinematicLoginTransitionProps {
  userName?: string;
  onComplete: () => void;
  durationMs?: number;
}

export const CinematicLoginTransition: React.FC<CinematicLoginTransitionProps> = ({
  userName = 'مدير النظام',
  onComplete,
  durationMs = 3600,
}) => {
  // Animation progress: 0 to 1
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'drawing' | 'letters' | 'full' | 'exit'>('drawing');
  const [lensFlare, setLensFlare] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    let frameId: number;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / durationMs, 1);
      setProgress(p);

      if (p < 0.38) {
        setStage('drawing');
      } else if (p < 0.72) {
        setStage('letters');
      } else if (p < 0.92) {
        setStage('full');
        if (!lensFlare && p > 0.75) {
          setLensFlare(true);
        }
      } else {
        setStage('exit');
      }

      if (p < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        // Complete the cinematic transition and redirect
        setTimeout(() => {
          onComplete();
        }, 150);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [durationMs, onComplete, lensFlare]);

  // Normalized sub-progress calculations for precise sequential drawing
  // 1. Fluid V Wave & Figure: 0 -> 0.45
  const waveProgress = Math.min(Math.max((progress - 0.04) / 0.42, 0), 1);
  // 2. Letters NOOR: 0.35 -> 0.75
  const noorProgress = Math.min(Math.max((progress - 0.35) / 0.4, 0), 1);
  // 3. F&B badge & Norseen: 0.65 -> 0.9
  const badgeProgress = Math.min(Math.max((progress - 0.65) / 0.25, 0), 1);

  // SVG stroke-dash calculations (based on pathLength 100)
  const leftArmDash = Math.min(waveProgress * 2.2, 1) * 100;
  const mainWaveDash = Math.min(Math.max((waveProgress - 0.15) * 1.3, 0), 1) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-[#041217] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none animate-in fade-in duration-300">
      
      {/* 1. Deep Atmospheric Dark Teal Backdrop with Moving Aurora Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Dynamic center radiant glow that blooms as the logo materializes */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-[130px] transition-all duration-1000"
          style={{
            width: `${350 + progress * 350}px`,
            height: `${350 + progress * 350}px`,
            opacity: 0.3 + progress * 0.5,
          }}
        ></div>

        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-teal-600/15 blur-[160px]"></div>
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-600/15 blur-[160px]"></div>

        {/* Ambient star dust particles */}
        <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:32px_32px] opacity-15"></div>
      </div>

      {/* Discrete Skip Button */}
      <button
        onClick={onComplete}
        className="absolute top-6 left-6 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold backdrop-blur-md transition cursor-pointer z-30"
      >
        تخطي الانتقال
      </button>

      {/* 2. Main Animated Canvas & Self-Drawing Logo Container */}
      <div className="relative flex flex-col items-center justify-center my-auto z-20 w-full max-w-xl">
        
        {/* Radial Lens Flare Burst when logo fully materializes */}
        {lensFlare && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[500px] rounded-full bg-radial from-cyan-300/40 via-teal-400/20 to-transparent blur-2xl animate-ping duration-1000"></div>
            <div className="absolute w-[800px] h-[2px] bg-gradient-to-r from-transparent via-cyan-200 to-transparent blur-xs rotate-12"></div>
            <div className="absolute w-[800px] h-[2px] bg-gradient-to-r from-transparent via-cyan-200 to-transparent blur-xs -rotate-12"></div>
          </div>
        )}

        {/* The Self-Drawing Logo SVG */}
        <div className="relative w-full max-w-[420px] aspect-[16/9] flex items-center justify-center">
          <svg
            viewBox="0 0 500 280"
            className="w-full h-full overflow-visible drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Luminous Neon Gradient */}
              <linearGradient id="neonCyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#67e8f9" />
                <stop offset="80%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>

              {/* F&B Cyan Pill Gradient */}
              <linearGradient id="badgeCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0e7490" />
              </linearGradient>

              {/* Intense Light Beam Filter */}
              <filter id="beamFilter" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="glow1" />
                <feGaussianBlur stdDeviation="8" result="glow2" />
                <feMerge>
                  <feMergeNode in="glow2" />
                  <feMergeNode in="glow1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* A. Left Arm of V Figure */}
            <path
              d="M 95 105 C 102 135, 116 175, 142 205"
              stroke="#FFFFFF"
              strokeWidth="11"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - leftArmDash}
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
              filter="url(#beamFilter)"
            />

            {/* B. Head Dot (Blooms at waveProgress > 0.25) */}
            <circle
              cx="135"
              cy="135"
              r="14"
              fill="#FFFFFF"
              className="transition-all duration-500 ease-out"
              style={{
                transformOrigin: '135px 135px',
                transform: waveProgress > 0.2 ? 'scale(1)' : 'scale(0)',
                opacity: waveProgress > 0.2 ? 1 : 0,
                filter: waveProgress > 0.2 ? 'drop-shadow(0 0 12px #67e8f9)' : 'none',
              }}
            />

            {/* C. Main V-Apex and Sweeping Wave Crest (Self-Drawing Path) */}
            <path
              d="M 130 145 C 136 170, 145 220, 162 250 C 166 256, 172 256, 176 250 C 188 220, 208 150, 240 122 C 275 92, 330 90, 390 108 C 430 120, 465 140, 480 152 C 450 140, 405 130, 355 130 C 295 130, 250 155, 220 195 C 198 228, 182 245, 170 245 C 158 245, 146 200, 138 155 Z"
              fill="#FFFFFF"
              fillOpacity={stage === 'full' || stage === 'exit' ? 1 : Math.max((waveProgress - 0.7) * 3, 0)}
              stroke="url(#neonCyanGlow)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - mainWaveDash}
              style={{
                transition: 'fill-opacity 0.5s ease-out, stroke-dashoffset 0.05s linear',
              }}
              filter="url(#beamFilter)"
            />

            {/* D. Underline wave swoosh highlight trail */}
            <path
              d="M 170 245 C 190 220, 220 185, 270 170 C 330 155, 395 160, 470 175 C 410 165, 335 162, 275 175 C 225 185, 195 215, 170 245 Z"
              fill="#FFFFFF"
              opacity={waveProgress > 0.8 ? 0.95 : 0}
              className="transition-opacity duration-300"
            />

            {/* Traveling Light Spark / Beam Comet along the wave crest */}
            {progress > 0.08 && progress < 0.85 && (
              <circle
                cx={
                  progress < 0.35
                    ? 100 + waveProgress * 80
                    : 160 + (progress - 0.35) * 650
                }
                cy={
                  progress < 0.35
                    ? 110 + waveProgress * 280
                    : 250 - Math.sin((progress - 0.35) * 3.5) * 140
                }
                r="7"
                fill="#ffffff"
                filter="url(#beamFilter)"
                className="animate-pulse"
              />
            )}

            {/* E. "NOOR" Letters (Sequentially Traced & Filled) */}
            <g
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: 900,
                fontStyle: 'italic',
                opacity: noorProgress > 0 ? 1 : 0,
                transform: `translateY(${(1 - noorProgress) * 8}px)`,
                transition: 'transform 0.4s ease-out, opacity 0.3s ease-out',
              }}
            >
              {/* Letter N */}
              <text
                x="240"
                y="115"
                fontSize="65"
                fill="#FFFFFF"
                stroke="#67e8f9"
                strokeWidth={noorProgress > 0.8 ? 0 : 2}
                opacity={Math.min(noorProgress * 2.5, 1)}
                filter="drop-shadow(0 0 8px rgba(6,182,212,0.8))"
              >
                N
              </text>

              {/* Letter O 1 */}
              <text
                x="300"
                y="118"
                fontSize="65"
                fill="#FFFFFF"
                stroke="#67e8f9"
                strokeWidth={noorProgress > 0.8 ? 0 : 2}
                opacity={Math.min(Math.max((noorProgress - 0.2) * 2.5, 0), 1)}
                filter="drop-shadow(0 0 8px rgba(6,182,212,0.8))"
              >
                O
              </text>

              {/* Letter O 2 */}
              <text
                x="358"
                y="122"
                fontSize="65"
                fill="#FFFFFF"
                stroke="#67e8f9"
                strokeWidth={noorProgress > 0.8 ? 0 : 2}
                opacity={Math.min(Math.max((noorProgress - 0.4) * 2.5, 0), 1)}
                filter="drop-shadow(0 0 8px rgba(6,182,212,0.8))"
              >
                O
              </text>

              {/* Letter R */}
              <text
                x="418"
                y="126"
                fontSize="65"
                fill="#FFFFFF"
                stroke="#67e8f9"
                strokeWidth={noorProgress > 0.8 ? 0 : 2}
                opacity={Math.min(Math.max((noorProgress - 0.6) * 2.5, 0), 1)}
                filter="drop-shadow(0 0 8px rgba(6,182,212,0.8))"
              >
                R
              </text>
            </g>

            {/* F. "F & B" Capsule Badge (Reveals smoothly under the wave crest) */}
            <g
              style={{
                opacity: badgeProgress,
                transform: `scale(${0.6 + badgeProgress * 0.4})`,
                transformOrigin: '280px 175px',
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <rect
                x="248"
                y="158"
                width="72"
                height="32"
                rx="16"
                fill="url(#badgeCyan)"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                filter="drop-shadow(0 0 10px rgba(6,182,212,0.7))"
              />
              <text
                x="284"
                y="180"
                fill="#FFFFFF"
                fontSize="16"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
                textAnchor="middle"
                letterSpacing="1"
              >
                F&amp;B
              </text>
            </g>
          </svg>
        </div>

        {/* 3. Brand Text Reveal: "نورسين" (Arabic Typography with Shimmer) */}
        <div
          className="text-center mt-3 transition-all duration-700 ease-out"
          style={{
            opacity: badgeProgress > 0.3 ? 1 : 0,
            transform: `translateY(${(1 - badgeProgress) * 15}px)`,
          }}
        >
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-wide font-sans drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            نـورسـيـن
          </h1>
          <p className="text-xs sm:text-sm text-cyan-300/90 font-medium mt-1 tracking-wider">
            منظومة إدارة الفروع والمخزون والمشتريات
          </p>
        </div>

        {/* 4. Success State & Progress Indicator */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold backdrop-blur-md animate-in fade-in zoom-in duration-300 shadow-lg shadow-emerald-950/40">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>تم التحقق من الحساب بنجاح • مرحباً بك {userName}</span>
          </div>

          {/* Animated Glowing Progress Bar */}
          <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-white rounded-full shadow-[0_0_12px_#22d3ee] transition-all duration-75"
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-widest">
            {progress < 0.9 ? 'جاري تهيئة بيئة العمل السحابية...' : 'جاري الدخول إلى المنظومة...'}
          </span>
        </div>

      </div>

    </div>
  );
};

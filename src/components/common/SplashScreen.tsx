import React, { useState, useEffect } from 'react';
import { Sparkles, Play, RotateCcw, ArrowLeft, ShieldCheck, Check } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  autoDismissMs?: number; // if set, automatically finishes after specified ms
  canDismiss?: boolean;
}

interface LogoFragment {
  id: string;
  name: string;
  type: 'path' | 'circle' | 'glow';
  // Scattered coordinates
  scatterX: number;
  scatterY: number;
  scatterRotate: number;
  scatterScale: number;
  scatterOpacity: number;
  delayMs: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  autoDismissMs = 3800,
  canDismiss = true,
}) => {
  // Animation Phase: 'scattered' -> 'gathering' -> 'assembled'
  const [phase, setPhase] = useState<'scattered' | 'gathering' | 'assembled'>('scattered');
  const [pulseGlow, setPulseGlow] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Scattered fragments initial configurations
  const fragments: LogoFragment[] = [
    {
      id: 'frag-wing-left-1',
      name: 'الجناح الأيسر الخارجي',
      type: 'path',
      scatterX: -160,
      scatterY: -110,
      scatterRotate: -45,
      scatterScale: 0.5,
      scatterOpacity: 0.2,
      delayMs: 120,
    },
    {
      id: 'frag-wing-left-2',
      name: 'ريشة الجناح الأيسر',
      type: 'path',
      scatterX: -190,
      scatterY: 40,
      scatterRotate: 65,
      scatterScale: 0.45,
      scatterOpacity: 0.25,
      delayMs: 180,
    },
    {
      id: 'frag-wing-right-1',
      name: 'الجناح الأيمن الخارجي',
      type: 'path',
      scatterX: 170,
      scatterY: -120,
      scatterRotate: 50,
      scatterScale: 0.5,
      scatterOpacity: 0.2,
      delayMs: 150,
    },
    {
      id: 'frag-wing-right-2',
      name: 'ريشة الجناح الأيمن',
      type: 'path',
      scatterX: 195,
      scatterY: 35,
      scatterRotate: -70,
      scatterScale: 0.45,
      scatterOpacity: 0.25,
      delayMs: 220,
    },
    {
      id: 'frag-crescent-base',
      name: 'هلال النون الملكي',
      type: 'path',
      scatterX: -20,
      scatterY: 140,
      scatterRotate: 30,
      scatterScale: 0.6,
      scatterOpacity: 0.3,
      delayMs: 80,
    },
    {
      id: 'frag-core-pearl',
      name: 'جوهرة النورسين',
      type: 'circle',
      scatterX: 80,
      scatterY: -140,
      scatterRotate: 180,
      scatterScale: 0.3,
      scatterOpacity: 0.15,
      delayMs: 260,
    },
    {
      id: 'frag-orbit-arc',
      name: 'قوس التوازن',
      type: 'path',
      scatterX: 110,
      scatterY: 120,
      scatterRotate: -80,
      scatterScale: 0.4,
      scatterOpacity: 0.2,
      delayMs: 300,
    },
  ];

  // Play animation lifecycle
  const runAnimation = () => {
    setPhase('scattered');
    setPulseGlow(false);
    setIsFinished(false);

    // After brief moment, initiate the gathering
    const gatherTimer = setTimeout(() => {
      setPhase('gathering');
    }, 400);

    // After gathering completes, lock into assembled state with flash pulse
    const assembleTimer = setTimeout(() => {
      setPhase('assembled');
      setPulseGlow(true);
      setTimeout(() => setPulseGlow(false), 900);
      setIsFinished(true);
    }, 1800);

    return () => {
      clearTimeout(gatherTimer);
      clearTimeout(assembleTimer);
    };
  };

  useEffect(() => {
    const cancel = runAnimation();
    let dismissTimer: NodeJS.Timeout | null = null;
    if (autoDismissMs && onComplete) {
      dismissTimer = setTimeout(() => {
        onComplete();
      }, autoDismissMs);
    }
    return () => {
      cancel();
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, []);

  const handleSkipOrContinue = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-radial from-slate-900 via-slate-950 to-black text-white flex flex-col items-center justify-between p-6 overflow-hidden font-sans select-none">
      
      {/* Background Animated Star/Dust Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/5 w-72 h-72 rounded-full bg-emerald-600/10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/5 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl"></div>
      </div>

      {/* Top Header Controls */}
      <div className="w-full max-w-4xl flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>نظام نورسين المركزي للإدارة المؤسسية</span>
        </div>

        {canDismiss && onComplete && (
          <button
            onClick={handleSkipOrContinue}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/80 transition backdrop-blur-md cursor-pointer"
          >
            <span>تخطي</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Central Animated Canvas / Vector Assembly Stage */}
      <div className="relative flex flex-col items-center justify-center my-auto z-10 w-full max-w-md">
        
        {/* State Indicator Tag */}
        <div className="mb-8">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-all duration-500 ${
              phase === 'scattered'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : phase === 'gathering'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {phase === 'scattered' && '✨ الشعار متناثر (حالة التبعثر الأولية)'}
            {phase === 'gathering' && '⚡ جاري تجميع وتوحيد أجزاء الشعار...'}
            {phase === 'assembled' && '🌟 تم تجميع واكتمال شعار نورسين بنجاح!'}
          </span>
        </div>

        {/* Logo Container Box */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          
          {/* Radial Shockwave upon Assembly */}
          {pulseGlow && (
            <div className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping duration-700 pointer-events-none"></div>
          )}

          {/* Golden Core Spotlight */}
          <div
            className={`absolute w-36 h-36 rounded-full bg-radial from-emerald-500/30 via-emerald-700/10 to-transparent blur-xl transition-all duration-1000 ${
              phase === 'assembled' ? 'scale-125 opacity-100' : 'scale-50 opacity-20'
            }`}
          ></div>

          {/* Interactive Vector Logo Stage */}
          <svg
            viewBox="0 0 100 100"
            className="w-48 h-48 drop-shadow-2xl relative z-10 overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="splashGradWingL" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="splashGradWingR" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="60%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
              <linearGradient id="splashGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <filter id="splashGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Piece 1: Left Wing Main (الجناح الأيسر الكبير) */}
            <path
              d="M 16 46 C 24 32, 44 26, 50 36 C 42 38, 30 45, 25 56 C 21 54, 18 50, 16 46 Z"
              fill="url(#splashGradWingL)"
              style={{
                transform:
                  phase === 'scattered'
                    ? 'translate(-95px, -65px) rotate(-40deg) scale(0.4)'
                    : phase === 'gathering'
                    ? 'translate(-15px, -10px) rotate(-8deg) scale(0.9)'
                    : 'translate(0px, 0px) rotate(0deg) scale(1)',
                opacity: phase === 'scattered' ? 0.35 : 1,
                transformOrigin: '50px 50px',
                transition: 'all 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />

            {/* Piece 2: Left Wing Tip Accent (رأس الجناح الأيسر) */}
            <path
              d="M 16 46 C 18 42, 28 35, 34 33 C 27 38, 22 43, 19 48 Z"
              fill="#a7f3d0"
              style={{
                transform:
                  phase === 'scattered'
                    ? 'translate(-120px, 25px) rotate(55deg) scale(0.3)'
                    : phase === 'gathering'
                    ? 'translate(-20px, 5px) rotate(10deg) scale(0.85)'
                    : 'translate(0px, 0px) rotate(0deg) scale(1)',
                opacity: phase === 'scattered' ? 0.25 : 0.9,
                transformOrigin: '25px 40px',
                transition: 'all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />

            {/* Piece 3: Right Wing Main (الجناح الأيمن المتسامي) */}
            <path
              d="M 84 46 C 76 32, 56 26, 50 36 C 58 38, 70 45, 75 56 C 79 54, 82 50, 84 46 Z"
              fill="url(#splashGradWingR)"
              style={{
                transform:
                  phase === 'scattered'
                    ? 'translate(100px, -70px) rotate(45deg) scale(0.4)'
                    : phase === 'gathering'
                    ? 'translate(18px, -12px) rotate(9deg) scale(0.9)'
                    : 'translate(0px, 0px) rotate(0deg) scale(1)',
                opacity: phase === 'scattered' ? 0.35 : 1,
                transformOrigin: '50px 50px',
                transition: 'all 1.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />

            {/* Piece 4: Right Wing Tip Accent (رأس الجناح الأيمن) */}
            <path
              d="M 84 46 C 82 42, 72 35, 66 33 C 73 38, 78 43, 81 48 Z"
              fill="#5eead4"
              style={{
                transform:
                  phase === 'scattered'
                    ? 'translate(125px, 30px) rotate(-60deg) scale(0.3)'
                    : phase === 'gathering'
                    ? 'translate(22px, 6px) rotate(-12deg) scale(0.85)'
                    : 'translate(0px, 0px) rotate(0deg) scale(1)',
                opacity: phase === 'scattered' ? 0.25 : 0.9,
                transformOrigin: '75px 40px',
                transition: 'all 1.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />

            {/* Piece 5: Arabic Noon Base Crescent (هلال النون) */}
            <path
              d="M 24 53 C 27 74, 73 74, 76 53 C 71 67, 29 67, 24 53 Z"
              fill="url(#splashGradWingL)"
              style={{
                transform:
                  phase === 'scattered'
                    ? 'translate(-10px, 95px) rotate(35deg) scale(0.45)'
                    : phase === 'gathering'
                    ? 'translate(-2px, 18px) rotate(6deg) scale(0.9)'
                    : 'translate(0px, 0px) rotate(0deg) scale(1)',
                opacity: phase === 'scattered' ? 0.3 : 1,
                transformOrigin: '50px 65px',
                transition: 'all 1.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />

            {/* Piece 6: Lower Arch Accent */}
            <path
              d="M 38 78 Q 50 83 62 78"
              stroke="#34d399"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                transform:
                  phase === 'scattered'
                    ? 'translate(60px, 85px) rotate(-75deg) scale(0.3)'
                    : phase === 'gathering'
                    ? 'translate(10px, 12px) scale(0.85)'
                    : 'translate(0px, 0px) scale(1)',
                opacity: phase === 'scattered' ? 0.2 : 0.9,
                transformOrigin: '50px 80px',
                transition: 'all 1.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />

            {/* Piece 7: Center Golden Pearl / Noon Diamond Dot (جوهرة النون) */}
            <g
              style={{
                transform:
                  phase === 'scattered'
                    ? 'translate(75px, -100px) rotate(180deg) scale(0.2)'
                    : phase === 'gathering'
                    ? 'translate(12px, -15px) scale(0.8)'
                    : 'translate(0px, 0px) scale(1)',
                opacity: phase === 'scattered' ? 0.2 : 1,
                transformOrigin: '50px 46px',
                transition: 'all 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <circle cx="50" cy="46" r="7.5" fill="url(#splashGradGold)" filter="url(#splashGlow)" />
              <circle cx="50" cy="46" r="4.2" fill="#ffffff" />
            </g>
          </svg>
        </div>

        {/* Brand Text Reveal (Animates upon Assembly) */}
        <div
          className={`text-center space-y-2 mt-6 transition-all duration-700 ${
            phase === 'assembled'
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-wider font-sans">
              نـورسـيـن
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              NORSEEN
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-light max-w-sm mx-auto leading-relaxed">
            المنظومة المركزية لإدارة الموارد، الفروع، والمخزون
          </p>
          <p className="text-[11px] text-emerald-400 font-mono tracking-widest pt-1">
            Enterprise Management System • v3.0
          </p>
        </div>

      </div>

      {/* Bottom Interactive Controls */}
      <div className="w-full max-w-md flex flex-col sm:flex-row items-center justify-center gap-3 relative z-20 pb-4">
        {/* Replay Scatter & Re-assemble */}
        <button
          onClick={runAnimation}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>إعادة تشتيت وتجميع الشعار</span>
        </button>

        {/* Enter System / Continue */}
        {onComplete && (
          <button
            onClick={handleSkipOrContinue}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              isFinished
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 scale-105'
                : 'bg-emerald-700/60 text-slate-200'
            }`}
          >
            <span>دخول المنظومة</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
};

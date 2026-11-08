import React, { useState } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  RotateCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import { useQuranRadio } from '../../context/QuranRadioContext';

interface QuranRadioMiniBarProps {
  onGoToDashboard?: () => void;
  isDashboardActive?: boolean;
}

export const QuranRadioMiniBar: React.FC<QuranRadioMiniBarProps> = ({
  onGoToDashboard,
  isDashboardActive = false,
}) => {
  const {
    selectedStation,
    isPlaying,
    isLoading,
    hasError,
    volume,
    isMuted,
    togglePlay,
    setVolume,
    setIsMuted,
    retry,
  } = useQuranRadio();

  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // If we are already on the dashboard, we don't need the floating mini-player since the full showcase widget is in front of the user!
  if (isDashboardActive) {
    return null;
  }

  // If minimized, show a small glowing pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-14 left-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#041f18]/95 backdrop-blur-xl border border-emerald-500/50 text-white shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 transition cursor-pointer group"
          title="توسيع مشغل القرآن الكريم"
        >
          <div className="relative">
            <Radio className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </div>
          <span className="text-xs font-bold text-emerald-200">
            {isPlaying ? 'القرآن الكريم يعمل' : 'إذاعة القرآن الكريم'}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-12 left-4 sm:left-6 z-40 max-w-md w-[calc(100%-2rem)] sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#031d17]/95 backdrop-blur-2xl border-2 border-emerald-500/40 rounded-2xl p-3 shadow-[0_15px_40px_rgba(0,0,0,0.7),0_0_25px_rgba(16,185,129,0.25)] text-white flex items-center justify-between gap-3">
        
        {/* Reciter Info & Animated Wave */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-900/80 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shadow-md">
              <Radio className={`w-4 h-4 ${isPlaying ? 'animate-pulse text-emerald-300' : ''}`} />
            </div>
            {isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>

          <div className="min-w-0 flex-1 text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white truncate">
                {selectedStation.reciter}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 font-medium hidden sm:inline">
                مباشر
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {/* Mini equalizer bars */}
              <div className="flex items-center gap-0.5 h-3 shrink-0">
                {[40, 90, 60, 100, 70, 85, 50].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: isPlaying ? `${h}%` : '25%' }}
                    className={`w-0.5 rounded-full transition-all duration-200 ${
                      isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-800'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-emerald-300/80 truncate">
                {isPlaying ? 'جاري الاستماع...' : 'متوقف'}
              </span>
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasError ? (
            <button
              onClick={retry}
              className="p-1.5 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-200 hover:bg-rose-600/50 text-xs transition cursor-pointer"
              title="إعادة المحاولة"
            >
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            </button>
          ) : (
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer shadow-md ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
              }`}
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-slate-950" />
              ) : (
                <Play className="w-4 h-4 fill-slate-950 mr-0.5" />
              )}
            </button>
          )}

          {/* Mute / Unmute */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900/40 transition cursor-pointer"
            title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Jump to Dashboard button if provided */}
          {onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900/40 transition cursor-pointer"
              title="الذهاب للرئيسية وشاشة الإذاعة الكاملة"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
          )}

          {/* Minimize button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-emerald-400/70 hover:text-white rounded-lg hover:bg-emerald-900/40 transition cursor-pointer"
            title="تصغير المشغل"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

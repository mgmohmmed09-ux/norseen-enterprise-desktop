import React, { useState } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  RotateCcw,
  BookOpen,
  Headphones,
  Sparkles,
  Check,
  Disc3,
  Flame,
} from 'lucide-react';
import { useQuranRadio, QURAN_STATIONS, QuranStation } from '../../context/QuranRadioContext';

export const QuranRadioWidget: React.FC = () => {
  const {
    selectedStation,
    isPlaying,
    isLoading,
    hasError,
    volume,
    isMuted,
    togglePlay,
    selectStation,
    setVolume,
    setIsMuted,
    retry,
  } = useQuranRadio();

  const [showStationPicker, setShowStationPicker] = useState<boolean>(false);

  const handleSelectStation = (station: QuranStation) => {
    selectStation(station);
    setShowStationPicker(false);
  };

  return (
    <div className="relative rounded-[28px] p-6 text-white bg-gradient-to-br from-[#031d17]/95 via-[#061822]/90 to-[#03131b]/95 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(16,185,129,0.15)] flex flex-col justify-between overflow-hidden">
      {/* 4 Realistic Industrial Rivet Screws in the Corners */}
      <div className="absolute top-3.5 right-3.5 w-3.5 h-3.5 rounded-full bg-emerald-950 border border-emerald-600/40 shadow-inner flex items-center justify-center">
        <div className="w-2.5 h-[1.5px] bg-emerald-500/60 rotate-45"></div>
      </div>
      <div className="absolute top-3.5 left-3.5 w-3.5 h-3.5 rounded-full bg-emerald-950 border border-emerald-600/40 shadow-inner flex items-center justify-center">
        <div className="w-2.5 h-[1.5px] bg-emerald-500/60 -rotate-45"></div>
      </div>
      <div className="absolute bottom-3.5 right-3.5 w-3.5 h-3.5 rounded-full bg-emerald-950 border border-emerald-600/40 shadow-inner flex items-center justify-center">
        <div className="w-2.5 h-[1.5px] bg-emerald-500/60 -rotate-30"></div>
      </div>
      <div className="absolute bottom-3.5 left-3.5 w-3.5 h-3.5 rounded-full bg-emerald-950 border border-emerald-600/40 shadow-inner flex items-center justify-center">
        <div className="w-2.5 h-[1.5px] bg-emerald-500/60 rotate-60"></div>
      </div>

      {/* Decorative Islamic Geometric subtle background watermark */}
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

      {/* 1. Header with Live Status Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>إذاعة القرآن الكريم</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                  بث مباشر 24/7
                </span>
              </h2>
              <p className="text-xs text-emerald-200/70 font-medium">
                تلاوات عطرة ومستمرة بأصوات نخبة من كبار القراء (تعمل أثناء التنقل)
              </p>
            </div>
          </div>
        </div>

        {/* Station Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowStationPicker(!showStationPicker)}
            className="text-xs font-bold text-emerald-300 hover:text-white flex items-center gap-1.5 cursor-pointer bg-emerald-950/60 hover:bg-emerald-900/80 px-3 py-1.5 rounded-xl border border-emerald-500/40 transition shadow-sm"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>تغيير القارئ ({QURAN_STATIONS.length})</span>
          </button>

          {/* Station Selection Dropdown */}
          {showStationPicker && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-[#051f1a]/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl shadow-2xl p-2 z-50 max-h-72 overflow-y-auto custom-scrollbar">
              <div className="px-2 py-1.5 text-[11px] font-bold text-emerald-400 border-b border-emerald-800/40 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>اختر الإذاعة أو القارئ المفضل</span>
              </div>
              <div className="space-y-1">
                {QURAN_STATIONS.map((st) => {
                  const isCur = st.id === selectedStation.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => handleSelectStation(st)}
                      className={`w-full text-right p-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                        isCur
                          ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/50 font-bold'
                          : 'text-slate-300 hover:bg-emerald-900/40 hover:text-white'
                      }`}
                    >
                      <div className="truncate pl-2">
                        <div className="font-bold truncate">{st.reciter}</div>
                        <div className="text-[10px] text-emerald-300/60 truncate">{st.riwaya}</div>
                      </div>
                      {isCur && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Player Showcase */}
      <div className="my-5 relative z-10">
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#04241e]/60 to-emerald-950/40 rounded-2xl p-4 border border-emerald-500/25 shadow-inner">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Reciter & Station Info */}
            <div className="flex items-center gap-3.5 text-right w-full md:w-auto">
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-900 to-teal-700 border-2 border-emerald-400/50 flex items-center justify-center text-emerald-200 shadow-lg ${
                    isPlaying ? 'ring-4 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : ''
                  }`}
                >
                  <Disc3
                    className={`w-8 h-8 text-emerald-300 ${
                      isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
                    }`}
                  />
                </div>
                {isPlaying && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white truncate">
                    {selectedStation.reciter}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                    {selectedStation.riwaya}
                  </span>
                </div>
                <p className="text-xs text-emerald-300/80 font-medium mt-0.5 truncate">
                  {isPlaying ? 'جاري البث المباشر بجودة رقمية عالية' : 'متوقف مؤقتاً - اضغط تشغيل للاستماع'}
                </p>
                <p className="text-[11px] text-amber-200/90 font-serif italic mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>« أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ »</span>
                </p>
              </div>
            </div>

            {/* Tactile Play / Pause Controller Button */}
            <div className="flex items-center gap-3">
              {hasError ? (
                <button
                  onClick={retry}
                  className="px-4 py-2.5 rounded-2xl bg-rose-600/30 border border-rose-500 text-rose-200 hover:bg-rose-600/50 flex items-center gap-2 text-xs font-bold transition cursor-pointer"
                  title="إعادة المحاولة"
                >
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>إعادة الاتصال</span>
                </button>
              ) : (
                <button
                  onClick={togglePlay}
                  disabled={isLoading}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-xl ${
                    isPlaying
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                  }`}
                  title={isPlaying ? 'إيقاف البث' : 'تشغيل البث المباشر'}
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-3 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : isPlaying ? (
                    <Pause className="w-7 h-7 fill-slate-950" />
                  ) : (
                    <Play className="w-7 h-7 fill-slate-950 mr-0.5" />
                  )}
                </button>
              )}
            </div>

          </div>

          {/* Animated Audio Wave Frequency Equalizer */}
          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5 h-6">
              {[40, 75, 55, 90, 60, 85, 45, 100, 70, 50, 95, 65, 80, 40, 85, 60, 90, 75, 50].map(
                (height, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: isPlaying ? `${height}%` : '20%',
                      animationDuration: `${0.6 + (idx % 5) * 0.15}s`,
                    }}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isPlaying
                        ? 'bg-gradient-to-t from-emerald-500 to-amber-300 animate-pulse'
                        : 'bg-emerald-800/40'
                    }`}
                  />
                )
              )}
              <span className="text-[10px] text-emerald-400/80 mr-2 font-mono">
                {isPlaying ? 'LIVE STREAMING' : 'READY TO STREAM'}
              </span>
            </div>

            {/* Volume & Sound Level Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-emerald-300 hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-emerald-900/40"
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
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-emerald-400 border border-emerald-500/30"
                title="مستوى الصوت"
              />
              <span className="text-[10px] text-emerald-300 font-mono w-7 text-left">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Reciter Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
          <span className="text-emerald-300/70 text-[10px] shrink-0 font-medium">قراء متميزون:</span>
          {QURAN_STATIONS.slice(0, 5).map((st) => (
            <button
              key={st.id}
              onClick={() => handleSelectStation(st)}
              className={`px-2.5 py-1 rounded-lg shrink-0 cursor-pointer transition border ${
                st.id === selectedStation.id
                  ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/60 font-bold'
                  : 'bg-emerald-950/40 text-slate-300 border-emerald-500/20 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              {st.reciter.replace('الشيخ ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Footer */}
      <div className="pt-2 text-[10px] text-emerald-400/70 font-mono flex items-center justify-between border-t border-emerald-500/20 relative z-10">
        <span className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-400" />
          <span>NORSEEN RADIO NETWORK: 108.0 MHZ HQ STREAM</span>
        </span>
        <span className="text-emerald-300 font-sans font-bold">بث مستمر ببركة القرآن الكريم</span>
      </div>
    </div>
  );
};

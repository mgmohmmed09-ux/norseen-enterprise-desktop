import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

export interface QuranStation {
  id: string;
  name: string;
  reciter: string;
  riwaya: string;
  url: string;
}

export const QURAN_STATIONS: QuranStation[] = [
  {
    id: 'abdulbasit',
    name: 'إذاعة عبدالباسط عبدالصمد',
    reciter: 'الشيخ عبدالباسط عبدالصمد',
    riwaya: 'المصحف المجود والمرتل',
    url: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad',
  },
  {
    id: 'maher',
    name: 'إذاعة ماهر المعيقلي',
    reciter: 'الشيخ ماهر المعيقلي',
    riwaya: 'رواية حفص عن عاصم',
    url: 'https://backup.qurango.net/radio/maher',
  },
  {
    id: 'mishary',
    name: 'إذاعة مشاري راشد العفاسي',
    reciter: 'الشيخ مشاري بن راشد العفاسي',
    riwaya: 'تلاوات خاشعة ومميزة',
    url: 'https://backup.qurango.net/radio/mishary_alafasi',
  },
  {
    id: 'minshawi',
    name: 'إذاعة محمد صديق المنشاوي',
    reciter: 'الشيخ محمد صديق المنشاوي',
    riwaya: 'المصحف المرتل',
    url: 'https://backup.qurango.net/radio/mohammed_siddiq_alminshawi',
  },
  {
    id: 'alajmy',
    name: 'إذاعة أحمد بن علي العجمي',
    reciter: 'الشيخ أحمد العجمي',
    riwaya: 'رواية حفص عن عاصم',
    url: 'https://backup.qurango.net/radio/ahmad_alajmy',
  },
  {
    id: 'ghamdi',
    name: 'إذاعة سعد الغامدي',
    reciter: 'الشيخ سعد الغامدي',
    riwaya: 'تلاوة متقنة مرسومة',
    url: 'https://backup.qurango.net/radio/saad_alghamdi',
  },
  {
    id: 'hussary',
    name: 'إذاعة محمود خليل الحصري',
    reciter: 'الشيخ محمود خليل الحصري',
    riwaya: 'المصحف المرتل - شيخ عموم المقارئ',
    url: 'https://backup.qurango.net/radio/mahmoud_khalil_alhussary',
  },
  {
    id: 'shatri',
    name: 'إذاعة أبو بكر الشاطري',
    reciter: 'الشيخ أبو بكر الشاطري',
    riwaya: 'رواية حفص عن عاصم',
    url: 'https://backup.qurango.net/radio/shaik_abu_bakr_al_shatri',
  },
  {
    id: 'trabulsi',
    name: 'إذاعة أحمد خضر الطرابلسي',
    reciter: 'الشيخ أحمد خضر الطرابلسي',
    riwaya: 'رواية قالون عن نافع',
    url: 'https://backup.qurango.net/radio/ahmed_altrabulsi',
  },
  {
    id: 'akdar',
    name: 'إذاعة إبراهيم الأخضر',
    reciter: 'الشيخ إبراهيم الأخضر',
    riwaya: 'أستاذ القراءات بالمدينة المنورة',
    url: 'https://backup.qurango.net/radio/ibrahim_alakdar',
  },
];

interface QuranRadioContextType {
  selectedStation: QuranStation;
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
  volume: number;
  isMuted: boolean;
  togglePlay: () => void;
  selectStation: (station: QuranStation) => void;
  setVolume: (v: number) => void;
  setIsMuted: (m: boolean | ((prev: boolean) => boolean)) => void;
  retry: () => void;
}

const QuranRadioContext = createContext<QuranRadioContextType | undefined>(undefined);

export const QuranRadioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedStation, setSelectedStation] = useState<QuranStation>(QURAN_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (isMuted) setIsMuted(false);
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      setHasError(false);
      setIsLoading(true);

      if (audioRef.current.src !== selectedStation.url) {
        audioRef.current.src = selectedStation.url;
      }

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Audio play error:', err);
          setIsLoading(false);
          setIsPlaying(false);
          setHasError(true);
        });
    }
  };

  // Switch Station
  const selectStation = (station: QuranStation) => {
    setSelectedStation(station);
    setHasError(false);

    if (audioRef.current) {
      const wasPlaying = isPlaying;
      audioRef.current.src = station.url;
      audioRef.current.load();

      if (wasPlaying) {
        setIsLoading(true);
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error('Failed to play station:', err);
            setIsLoading(false);
            setHasError(true);
          });
      }
    }
  };

  // Retry Connection
  const retry = () => {
    setHasError(false);
    if (audioRef.current) {
      audioRef.current.src = selectedStation.url + '?t=' + Date.now();
      audioRef.current.load();
      setIsLoading(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          setHasError(true);
        });
    }
  };

  return (
    <QuranRadioContext.Provider
      value={{
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
      }}
    >
      {/* 
        Persistent Root HTML5 Audio Element 
        This lives at the root of the app, so it NEVER unmounts during page navigation!
      */}
      <audio
        ref={audioRef}
        src={selectedStation.url}
        preload="none"
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
          setHasError(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onError={() => {
          setIsPlaying(false);
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {children}
    </QuranRadioContext.Provider>
  );
};

export const useQuranRadio = (): QuranRadioContextType => {
  const context = useContext(QuranRadioContext);
  if (!context) {
    throw new Error('useQuranRadio must be used within a QuranRadioProvider');
  }
  return context;
};

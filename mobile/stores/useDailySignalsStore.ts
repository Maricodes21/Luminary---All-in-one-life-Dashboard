import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ListeningTag } from '@/lib/spotifyRecap';

type DailySignalsState = {
  musicTagCorrections: Record<string, ListeningTag>;
  setMusicTag: (date: string, tag: ListeningTag) => void;
};

export const useDailySignalsStore = create<DailySignalsState>()(
  persist(
    (set) => ({
      musicTagCorrections: {},
      setMusicTag: (date, tag) =>
        set((state) => ({
          musicTagCorrections: { ...state.musicTagCorrections, [date]: tag },
        })),
    }),
    {
      name: 'luminary.daily-signals',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

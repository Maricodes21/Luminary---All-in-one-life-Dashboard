import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { NightlyReflection } from '@/lib/personalization';

type PersonalizationState = {
  reflections: NightlyReflection[];
  saveReflection: (reflection: NightlyReflection) => void;
  acceptReflection: (id: string) => void;
  rejectReflection: (id: string) => void;
  deleteReflection: (id: string) => void;
  hydrateReflections: (reflections: NightlyReflection[]) => void;
  clearPrivateCache: () => void;
};

export const usePersonalizationStore = create<PersonalizationState>()(
  persist(
    (set) => ({
      reflections: [],
      saveReflection: (reflection) =>
        set((state) => ({
          reflections: [
            reflection,
            ...state.reflections.filter((item) => item.localDate !== reflection.localDate),
          ].slice(0, 90),
        })),
      acceptReflection: (id) =>
        set((state) => ({
          reflections: state.reflections.map((item) =>
            item.id === id ? { ...item, status: 'accepted' } : item,
          ),
        })),
      rejectReflection: (id) =>
        set((state) => ({
          reflections: state.reflections.filter((item) => item.id !== id),
        })),
      deleteReflection: (id) =>
        set((state) => ({
          reflections: state.reflections.filter((item) => item.id !== id),
        })),
      hydrateReflections: (reflections) =>
        set((state) => {
          const merged = new Map(reflections.map((item) => [item.id, item]));
          state.reflections.forEach((item) => {
            if (!merged.has(item.id)) merged.set(item.id, item);
          });
          return {
            reflections: [...merged.values()]
              .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
              .slice(0, 90),
          };
        }),
      clearPrivateCache: () => set({ reflections: [] }),
    }),
    { name: 'luminary.personalization.v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

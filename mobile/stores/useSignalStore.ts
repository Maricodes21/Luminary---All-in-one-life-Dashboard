import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DailySignal, DailySignalResponse, SignalInteraction } from '@/lib/dailySignals';

type SignalState = {
  interactions: SignalInteraction[];
  record: (signal: DailySignal, response: DailySignalResponse) => void;
  prune: () => void;
};

export const useSignalStore = create<SignalState>()(
  persist(
    (set) => ({
      interactions: [],
      record: (signal, response) => set((state) => ({
        interactions: [
          ...state.interactions,
          {
            signalId: signal.id,
            key: signal.key,
            family: signal.family,
            templateId: signal.templateId,
            evidenceHash: signal.evidenceHash,
            occurredAt: new Date().toISOString(),
            response,
          },
        ].slice(-500),
      })),
      prune: () => set((state) => ({
        interactions: state.interactions.filter((item) => Date.now() - new Date(item.occurredAt).getTime() < 45 * 86_400_000),
      })),
    }),
    { name: 'luminary.daily-signals.v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DecisionDomain, DecisionOutcome } from '@/lib/dailyDecisionSystem';

export type DecisionEvent = {
  id: string;
  domain: DecisionDomain;
  action: string;
  outcome: DecisionOutcome;
  reason?: string;
  localDate: string;
  occurredAt: string;
};

type DecisionState = {
  events: DecisionEvent[];
  record: (event: Omit<DecisionEvent, 'id' | 'occurredAt'>) => void;
};

export const useDecisionStore = create<DecisionState>()(persist((set) => ({
  events: [],
  record: (event) => set((state) => ({
    events: [...state.events.slice(-199), { ...event, id: `decision_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, occurredAt: new Date().toISOString() }],
  })),
}), { name: 'luminary.daily-decisions.v1', storage: createJSONStorage(() => AsyncStorage) }));

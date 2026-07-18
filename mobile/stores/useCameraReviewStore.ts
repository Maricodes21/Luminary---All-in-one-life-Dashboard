import { create } from 'zustand';

import type { FoodSearchResult } from '@/lib/meals/types';

type CameraReviewState = {
  results: FoodSearchResult[];
  setResults: (results: FoodSearchResult[]) => void;
  clear: () => void;
};

export const useCameraReviewStore = create<CameraReviewState>((set) => ({
  results: [],
  setResults: (results) => set({ results }),
  clear: () => set({ results: [] }),
}));

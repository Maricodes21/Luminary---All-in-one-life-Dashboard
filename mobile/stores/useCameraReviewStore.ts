import { create } from 'zustand';

import type { MealPhotoAnalysis } from '@/lib/meals/types';

type CameraReviewState = {
  analysis: MealPhotoAnalysis | null;
  setAnalysis: (analysis: MealPhotoAnalysis) => void;
  setIngredient: (index: number, ingredient: string) => void;
  addIngredient: () => void;
  removeIngredient: (index: number) => void;
  clear: () => void;
};

export const useCameraReviewStore = create<CameraReviewState>((set) => ({
  analysis: null,
  setAnalysis: (analysis) => set({ analysis }),
  setIngredient: (index, ingredient) =>
    set((state) =>
      state.analysis
        ? {
            analysis: {
              ...state.analysis,
              ingredients: state.analysis.ingredients.map((item, itemIndex) =>
                itemIndex === index ? ingredient : item,
              ),
            },
          }
        : state,
    ),
  addIngredient: () =>
    set((state) =>
      state.analysis && state.analysis.ingredients.length < 12
        ? { analysis: { ...state.analysis, ingredients: [...state.analysis.ingredients, ''] } }
        : state,
    ),
  removeIngredient: (index) =>
    set((state) =>
      state.analysis
        ? {
            analysis: {
              ...state.analysis,
              ingredients: state.analysis.ingredients.filter((_, itemIndex) => itemIndex !== index),
            },
          }
        : state,
    ),
  clear: () => set({ analysis: null }),
}));

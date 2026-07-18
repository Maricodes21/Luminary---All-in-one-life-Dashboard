import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export type Meal = {
  id: string;
  meal_date: string;
  name: string;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  calories: number | null;
};

export function useMeals() {
  const session = useAuthStore((s) => s.session);

  const mealsQuery = useQuery({
    queryKey: ['meals_today'],
    queryFn: async (): Promise<Meal[]> => {
      if (!session) return [];
      
      // Fetch only today's meals for the daily timeline
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('meal_date', today)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data as Meal[];
    },
    enabled: !!session,
  });

  return {
    meals: mealsQuery.data || [],
    isLoading: mealsQuery.isLoading,
  };
}

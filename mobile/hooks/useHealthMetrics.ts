import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export type HealthWorkout = {
  id: string;
  workout_date: string;
  workout_type: 'gym' | 'home';
  duration_minutes: number | null;
  notes: string | null;
};

export function useHealthMetrics() {
  const session = useAuthStore((s) => s.session);

  const workoutsQuery = useQuery({
    queryKey: ['health_workouts'],
    queryFn: async (): Promise<HealthWorkout[]> => {
      if (!session) return [];
      const { data, error } = await supabase
        .from('health_workouts')
        .select('*')
        .order('workout_date', { ascending: false });
      if (error) throw new Error(error.message);
      return data as HealthWorkout[];
    },
    enabled: !!session,
  });

  return {
    workouts: workoutsQuery.data || [],
    isLoading: workoutsQuery.isLoading,
  };
}

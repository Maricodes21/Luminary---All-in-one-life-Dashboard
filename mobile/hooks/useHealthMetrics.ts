import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export type WorkoutCategory = 'calisthenics' | 'cardio' | 'cycling' | 'gym';

export type HealthWorkout = {
  id: string;
  workout_date: string;
  workout_type: WorkoutCategory;
  duration_minutes: number | null;
  notes: string | null;
};

export type HealthMetric = {
  id: string;
  metric_date: string;
  source: 'manual' | 'health_connect' | 'google_fit' | 'samsung_health';
  steps: number | null;
  heart_rate_bpm: number | null;
  sleep_minutes: number | null;
  raw: Record<string, unknown>;
};

export function useHealthMetrics() {
  const session = useAuthStore((s) => s.session);

  const workoutsQuery = useQuery({
    queryKey: ['health_workouts', session?.user.id],
    queryFn: async (): Promise<HealthWorkout[]> => {
      if (!session) return [];
      const { data, error } = await supabase
        .from('health_workouts')
        .select('id, workout_date, workout_type, duration_minutes, notes')
        .order('workout_date', { ascending: false });
      if (error) throw new Error(error.message);
      return data as HealthWorkout[];
    },
    enabled: !!session,
  });

  const metricsQuery = useQuery({
    queryKey: ['health_metrics', session?.user.id],
    queryFn: async (): Promise<HealthMetric[]> => {
      if (!session) return [];
      const { data, error } = await supabase
        .from('health_metrics')
        .select('id, metric_date, source, steps, heart_rate_bpm, sleep_minutes, raw')
        .order('metric_date', { ascending: false })
        .limit(7);
      if (error) throw new Error(error.message);
      return data as HealthMetric[];
    },
    enabled: !!session,
  });

  return {
    workouts: workoutsQuery.data || [],
    metrics: metricsQuery.data || [],
    latestMetric: metricsQuery.data?.[0] ?? null,
    isLoading: workoutsQuery.isLoading || metricsQuery.isLoading,
    error: workoutsQuery.error ?? metricsQuery.error ?? null,
  };
}

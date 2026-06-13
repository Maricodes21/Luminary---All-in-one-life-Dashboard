import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { MoodLabel } from '@/lib/mood';

export type MoodEvent = {
  id: string;
  occurred_at: string;
  label: MoodLabel;
  source: string;
  confidence: number;
};

export function useMoodTrends(days: number = 7) {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: ['mood_trends', days],
    queryFn: async (): Promise<MoodEvent[]> => {
      if (!session) return [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('mood_events')
        .select('id, occurred_at, label, source, confidence')
        .gte('occurred_at', startDate.toISOString())
        .order('occurred_at', { ascending: true });

      if (error) throw new Error(error.message);
      return data as MoodEvent[];
    },
    enabled: !!session,
  });
}

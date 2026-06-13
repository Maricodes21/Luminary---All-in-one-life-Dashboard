import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export type JournalEntry = {
  id: string;
  written_at: string;
  title: string | null;
  body: string;
  tags: string[];
};

export function useJournalEntries() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: ['journal_entries'],
    queryFn: async (): Promise<JournalEntry[]> => {
      if (!session) return [];
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, written_at, title, body, tags')
        .order('written_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data as JournalEntry[];
    },
    enabled: !!session,
  });
}
